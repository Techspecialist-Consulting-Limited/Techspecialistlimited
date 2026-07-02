import io
import logging
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.ai_result import AIScreeningResult
from app.models.application import Application
from app.models.job_posting import JobPosting
from app.services.email_service import send_new_application_notification
from app.services.storage import upload_file
from app.workers.tasks import run_screening

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/applications", tags=["applications"])


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
