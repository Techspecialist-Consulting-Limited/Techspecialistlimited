import asyncio
import io
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import async_session, get_db
from app.models.ai_result import AIScreeningResult
from app.models.application import Application
from app.models.job_posting import JobPosting
from app.services.audit_service import SYSTEM_ACTOR, log_action
from app.services.email_service import (
    send_application_received_email,
    send_new_application_notification,
    send_stage2_invitation_email,
)
from app.services.storage import upload_file
from app.workers.tasks import run_screening

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/applications", tags=["applications"])


async def _auto_advance_after_delay(application_id: uuid.UUID, delay_minutes: int):
    await asyncio.sleep(max(delay_minutes, 0) * 60)
    try:
        async with async_session() as db:
            result = await db.execute(select(Application).where(Application.id == application_id))
            app = result.scalar_one_or_none()
            if not app or app.status != "pending":
                return  # HR already acted manually, or application no longer exists

            job_result = await db.execute(select(JobPosting).where(JobPosting.id == app.job_id))
            job = job_result.scalar_one_or_none()
            if not job:
                return

            app.stage += 1
            app.status = "approved"
            app.assessment_token = secrets.token_urlsafe(32)
            app.assessment_sent_at = datetime.now(timezone.utc)
            app.assessment_expires_at = datetime.now(timezone.utc) + timedelta(days=7)
            magic_link = f"{settings.frontend_url}/assessment/{app.assessment_token}"
            await db.commit()

            await log_action(
                db, application_id, "auto_advanced",
                f"Auto-advanced to stage {app.stage} - CV screening score met the configured pass mark",
                performed_by=SYSTEM_ACTOR,
            )

            await send_stage2_invitation_email(
                to=app.candidate_email,
                name=app.candidate_name,
                job_title=job.title,
                magic_link=magic_link,
                expires_at=app.assessment_expires_at,
            )
    except Exception as e:
        logger.error(f"Auto-advance failed for application {application_id}: {e}")


def extract_text(content: bytes, filename: str) -> str:
    name_lower = filename.lower()
    try:
        if name_lower.endswith(".pdf"):
            import fitz
            doc = fitz.open(stream=io.BytesIO(content), filetype="pdf")
            text = "\n".join(page.get_text() for page in doc)
            doc.close()
            return text.strip() or f"[Empty PDF: {filename}]"
        elif name_lower.endswith(".docx"):
            from docx import Document
            doc = Document(io.BytesIO(content))
            return "\n".join(p.text for p in doc.paragraphs).strip() or f"[Empty DOCX: {filename}]"
        else:
            return content.decode("utf-8")
    except Exception:
        return f"[Binary file: {filename}]"


async def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return True


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    candidate_name: str
    candidate_email: str
    status: str
    stage: int

    model_config = {"from_attributes": True}


@router.post(
    "", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED
)
async def submit_application(
    job_id: uuid.UUID,
    candidate_name: str,
    candidate_email: str,
    cv: UploadFile,
    background_tasks: BackgroundTasks,
    cover_letter: UploadFile | None = None,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    result = await db.execute(
        select(JobPosting).where(JobPosting.id == job_id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "active":
        raise HTTPException(status_code=400, detail="Job is not active")

    cv_content = await cv.read()
    cv_url = await upload_file(cv, settings.cvs_container_name, content=cv_content)
    cv_text = extract_text(cv_content, cv.filename or "cv.txt")

    cover_letter_url = None
    cover_letter_text = None
    if cover_letter:
        cl_content = await cover_letter.read()
        cover_letter_url = await upload_file(
            cover_letter, settings.cvs_container_name, content=cl_content
        )
        cover_letter_text = extract_text(cl_content, cover_letter.filename or "cover_letter.txt")

    app = Application(
        job_id=job_id,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        cv_url=cv_url,
        cover_letter_url=cover_letter_url,
        cv_text=cv_text,
        cover_letter_text=cover_letter_text,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)

    try:
        await run_screening(str(app.id))
        logger.info(f"Screening completed for application {app.id}")
    except Exception as e:
        logger.error(f"Screening failed for application {app.id}: {e}")

    screening_result = await db.execute(
        select(AIScreeningResult).where(AIScreeningResult.application_id == app.id)
    )
    screening = screening_result.scalar_one_or_none()

    if job.auto_advance_enabled and screening and screening.overall_score >= job.auto_advance_pass_mark:
        background_tasks.add_task(_auto_advance_after_delay, app.id, job.auto_advance_delay_minutes)

    try:
        await send_new_application_notification(
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            job_title=job.title,
            application_id=str(app.id),
            screening_score=screening.overall_score if screening else None,
        )
    except Exception as e:
        logger.error(f"HR notification failed for application {app.id}: {e}")

    try:
        await send_application_received_email(
            to=candidate_email, name=candidate_name, job_title=job.title,
            application_id=str(app.id),
        )
    except Exception as e:
        logger.error(f"Candidate confirmation email failed for application {app.id}: {e}")

    return app


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


STATUS_LABELS = {
    "pending": "Application received - under review",
    "approved": "Assessment invitation sent",
    "assessment_completed": "Assessment completed - awaiting review",
    "assessment_flagged": "Assessment completed - awaiting review",
    "interview_scheduled": "Interview scheduled",
    "hired": "Congratulations - you've been selected!",
    "rejected": "Not selected for this role",
}


class ApplicationStatusResponse(BaseModel):
    candidate_name: str
    job_title: str
    status_label: str
    applied_at: str | None = None


@router.get("/{application_id}/status", response_model=ApplicationStatusResponse)
async def get_application_status(
    application_id: uuid.UUID,
    email: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(selectinload(Application.job))
    )
    app = result.scalar_one_or_none()
    if not app or app.candidate_email.strip().lower() != email.strip().lower():
        raise HTTPException(status_code=404, detail="Application not found")

    return ApplicationStatusResponse(
        candidate_name=app.candidate_name,
        job_title=app.job.title if app.job else "",
        status_label=STATUS_LABELS.get(app.status, "Application received - under review"),
        applied_at=str(app.created_at) if app.created_at else None,
    )
