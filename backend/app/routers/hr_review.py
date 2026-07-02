import json
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import os

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import verify_hr_token
from app.config import settings
from app.database import get_db
from app.models.ai_result import AIScreeningResult
from app.models.application import Application
from app.models.conversation import ConversationSession
from app.models.interview import Interview
from app.models.job_posting import JobPosting
from app.models.stage import StageResult
from app.models.audit_log import AuditLog
from app.services.audit_service import log_action, get_audit_logs
from app.services.email_service import (
    send_approval_email,
    send_rejection_email,
    send_stage2_invitation_email,
)

router = APIRouter(prefix="/api/hr", tags=["hr"])


class StatsResponse(BaseModel):
    active_jobs: int
    total_applications: int
    pending_review: int
    completed: int
    total_applicants: int


@router.get("/stats", response_model=StatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    active_jobs_result = await db.execute(
        select(func.count(JobPosting.id)).where(
            JobPosting.is_deleted == False, JobPosting.status == "active"
        )
    )
    active_jobs = active_jobs_result.scalar() or 0

    total_apps_result = await db.execute(
        select(func.count(Application.id))
    )
    total_applications = total_apps_result.scalar() or 0

    pending_result = await db.execute(
        select(func.count(Application.id)).where(Application.status == "pending")
    )
    pending_review = pending_result.scalar() or 0

    completed_result = await db.execute(
        select(func.count(Application.id)).where(
            Application.status.in_(["approved", "rejected"])
        )
    )
    completed = completed_result.scalar() or 0

    total_applicants_result = await db.execute(
        select(func.count(func.distinct(Application.candidate_email)))
    )
    total_applicants = total_applicants_result.scalar() or 0

    return StatsResponse(
        active_jobs=active_jobs,
        total_applications=total_applications,
        pending_review=pending_review,
        completed=completed,
        total_applicants=total_applicants,
    )


class ScreeningDetail(BaseModel):
    overall_score: float
    strengths: str | None = None
    concerns: str | None = None
    evidence: str | None = None
    created_at: str | None = None

    model_config = {"from_attributes": True}


class StageResultDetail(BaseModel):
    stage_number: int
    transcript: str | None = None
    score: float | None = None
    ai_feedback: str | None = None
    created_at: str | None = None

    model_config = {"from_attributes": True}


class ConversationHistoryItem(BaseModel):
    role: str
    content: str
    topic_label: str | None = None


class ConversationSessionDetail(BaseModel):
    id: uuid.UUID
    status: str
    conversation_history: list[ConversationHistoryItem] = []
    current_topic_index: int = 0

    model_config = {"from_attributes": True}


class ApplicationWithScreening(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    candidate_name: str
    candidate_email: str
    status: str
    stage: int
    assessment_token: str | None = None
    assessment_sent_at: str | None = None
    assessment_expires_at: str | None = None
    cv_url: str | None = None
    cover_letter_url: str | None = None
    cv_text: str | None = None
    cover_letter_text: str | None = None
    screening_result: ScreeningDetail | None = None
    stage_results: list[StageResultDetail] = []
    conversation_session: ConversationSessionDetail | None = None
    created_at: str | None = None

    model_config = {"from_attributes": True}


class ApplicantDetailResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    candidate_name: str
    candidate_email: str
    cv_url: str | None = None
    cover_letter_url: str | None = None
    cv_text: str | None = None
    cover_letter_text: str | None = None
    status: str
    stage: int
    assessment_token: str | None = None
    assessment_sent_at: str | None = None
    assessment_expires_at: str | None = None
    job_title: str
    screening_result: ScreeningDetail | None = None
    stage_results: list[StageResultDetail] = []
    conversation_session: ConversationSessionDetail | None = None
    created_at: str | None = None


class ReviewAction(BaseModel):
    action: str
    expiration_days: int | None = None


@router.get("/applications/{job_id}", response_model=list[ApplicationWithScreening])
async def list_applications(job_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: dict = Depends(verify_hr_token)):
    result = await db.execute(
        select(Application).where(Application.job_id == job_id)
    )
    apps = result.scalars().all()

    response = []
    for a in apps:
        sr = await db.execute(
            select(AIScreeningResult).where(
                AIScreeningResult.application_id == a.id
            )
        )
        screening = sr.scalar_one_or_none()

        stage_r = await db.execute(
            select(StageResult).where(
                StageResult.application_id == a.id
            ).order_by(StageResult.created_at)
        )
        stage_results = stage_r.scalars().all()

        conv_r = await db.execute(
            select(ConversationSession).where(
                ConversationSession.application_id == a.id
            ).order_by(ConversationSession.id.desc()).limit(1)
        )
        conv = conv_r.scalar_one_or_none()

        conv_detail = None
        if conv:
            try:
                history = json.loads(conv.conversation_history) if isinstance(conv.conversation_history, str) else conv.conversation_history
            except (json.JSONDecodeError, TypeError):
                history = []
            conv_detail = ConversationSessionDetail(
                id=conv.id,
                status=conv.status,
                conversation_history=[ConversationHistoryItem(**h) for h in history] if history else [],
                current_topic_index=conv.current_topic_index,
            )

        response.append(ApplicationWithScreening(
            id=a.id,
            job_id=a.job_id,
            candidate_name=a.candidate_name,
            candidate_email=a.candidate_email,
            status=a.status,
            stage=a.stage,
            assessment_token=a.assessment_token,
            assessment_sent_at=str(a.assessment_sent_at) if a.assessment_sent_at else None,
            assessment_expires_at=str(a.assessment_expires_at) if a.assessment_expires_at else None,
            cv_url=a.cv_url,
            cover_letter_url=a.cover_letter_url,
            cv_text=a.cv_text,
            cover_letter_text=a.cover_letter_text,
            screening_result=ScreeningDetail(
                overall_score=screening.overall_score,
                strengths=screening.strengths,
                concerns=screening.concerns,
                evidence=screening.evidence,
                created_at=str(screening.created_at) if screening.created_at else None,
            ) if screening else None,
            stage_results=[StageResultDetail(
                stage_number=s.stage_number,
                transcript=s.transcript,
                score=s.score,
                ai_feedback=s.ai_feedback,
                created_at=str(s.created_at) if s.created_at else None,
            ) for s in stage_results],
            conversation_session=conv_detail,
            created_at=str(a.created_at) if a.created_at else None,
        ))

    response.sort(
        key=lambda a: (
            a.screening_result.overall_score if a.screening_result else -1
        ),
        reverse=True,
    )
    return response


@router.get("/applications/detail/{application_id}", response_model=ApplicantDetailResponse)
async def get_application_detail(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id)
        .options(selectinload(Application.job))
    )
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Application not found")

    sr = await db.execute(
        select(AIScreeningResult).where(
            AIScreeningResult.application_id == a.id
        )
    )
    screening = sr.scalar_one_or_none()

    stage_r = await db.execute(
        select(StageResult).where(
            StageResult.application_id == a.id
        ).order_by(StageResult.created_at)
    )
    stage_results = stage_r.scalars().all()

    conv_r = await db.execute(
        select(ConversationSession).where(
            ConversationSession.application_id == a.id
        )
    )
    conv = conv_r.scalar_one_or_none()

    conv_detail = None
    if conv:
        try:
            history = json.loads(conv.conversation_history) if isinstance(conv.conversation_history, str) else conv.conversation_history
        except (json.JSONDecodeError, TypeError):
            history = []
        conv_detail = ConversationSessionDetail(
            id=conv.id,
            status=conv.status,
            conversation_history=[ConversationHistoryItem(**h) for h in history] if history else [],
            current_topic_index=conv.current_topic_index,
        )

    return ApplicantDetailResponse(
        id=a.id,
        job_id=a.job_id,
        candidate_name=a.candidate_name,
        candidate_email=a.candidate_email,
        cv_url=a.cv_url,
        cover_letter_url=a.cover_letter_url,
        cv_text=a.cv_text,
        cover_letter_text=a.cover_letter_text,
        status=a.status,
        stage=a.stage,
        assessment_token=a.assessment_token,
        assessment_sent_at=str(a.assessment_sent_at) if a.assessment_sent_at else None,
        assessment_expires_at=str(a.assessment_expires_at) if a.assessment_expires_at else None,
        job_title=a.job.title if a.job else "",
        screening_result=ScreeningDetail(
            overall_score=screening.overall_score,
            strengths=screening.strengths,
            concerns=screening.concerns,
            evidence=screening.evidence,
            created_at=str(screening.created_at) if screening.created_at else None,
        ) if screening else None,
        stage_results=[StageResultDetail(
                stage_number=s.stage_number,
                transcript=s.transcript,
                score=s.score,
                ai_feedback=s.ai_feedback,
                created_at=str(s.created_at) if s.created_at else None,
            ) for s in stage_results],
        conversation_session=conv_detail,
        created_at=str(a.created_at) if a.created_at else None,
    )


class ApprovalRequest(BaseModel):
    expiration_days: int | None = None


@router.post("/approve/{application_id}")
async def approve_application(
    application_id: uuid.UUID,
    req: ApprovalRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    app_result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = app_result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    job_result = await db.execute(
        select(JobPosting).where(JobPosting.id == app.job_id)
    )
    job = job_result.scalar_one()

    old_stage = app.stage
    app.stage += 1
    app.status = "approved"
    app.assessment_token = secrets.token_urlsafe(32)
    app.assessment_sent_at = datetime.now(timezone.utc)

    expires_at = None
    if req.expiration_days and req.expiration_days > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(days=req.expiration_days)
        app.assessment_expires_at = expires_at

    magic_link = f"{settings.frontend_url}/assessment/{app.assessment_token}"
    await db.commit()

    await log_action(db, application_id, "assessment_approved", f"Approved for stage {app.stage}, link expires in {req.expiration_days or 'default'} days")

    await send_stage2_invitation_email(
        to=app.candidate_email,
        name=app.candidate_name,
        job_title=job.title,
        magic_link=magic_link,
        expires_at=expires_at,
    )

    return {
        "status": app.status,
        "stage": app.stage,
        "assessment_token": app.assessment_token,
        "assessment_sent_at": str(app.assessment_sent_at) if app.assessment_sent_at else None,
        "assessment_expires_at": str(app.assessment_expires_at) if app.assessment_expires_at else None,
    }


@router.post("/review/{application_id}")
async def review_application(
    application_id: uuid.UUID,
    review: ReviewAction,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    app_result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = app_result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    job_result = await db.execute(
        select(JobPosting).where(JobPosting.id == app.job_id)
    )
    job = job_result.scalar_one()

    if review.action == "approve":
        old_stage = app.stage
        app.stage += 1
        app.status = "approved"
        app.assessment_token = secrets.token_urlsafe(32)
        app.assessment_sent_at = datetime.now(timezone.utc)

        expires_at = None
        if review.expiration_days and review.expiration_days > 0:
            expires_at = datetime.now(timezone.utc) + timedelta(days=review.expiration_days)
            app.assessment_expires_at = expires_at

        magic_link = f"{settings.frontend_url}/assessment/{app.assessment_token}"
        await db.commit()

        await log_action(db, application_id, "approved", f"Approved to stage {app.stage} via review, expires in {review.expiration_days or 'default'} days")

        if old_stage == 1:
            await send_stage2_invitation_email(
                to=app.candidate_email,
                name=app.candidate_name,
                job_title=job.title,
                magic_link=magic_link,
                expires_at=expires_at,
            )
        else:
            await send_approval_email(
                to=app.candidate_email,
                name=app.candidate_name,
                job_title=job.title,
                stage=old_stage,
                magic_link=magic_link,
                expires_at=expires_at,
            )

    elif review.action == "reject":
        app.status = "rejected"
        await db.commit()
        await log_action(db, application_id, "rejected", f"Rejected at stage {app.stage}")
        await send_rejection_email(
            to=app.candidate_email,
            name=app.candidate_name,
            job_title=job.title,
            stage=app.stage,
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    return {
        "status": app.status,
        "stage": app.stage,
        "assessment_token": app.assessment_token,
        "assessment_sent_at": str(app.assessment_sent_at) if app.assessment_sent_at else None,
        "assessment_expires_at": str(app.assessment_expires_at) if app.assessment_expires_at else None,
    }


class ResendResponse(BaseModel):
    assessment_token: str
    assessment_sent_at: str | None = None
    assessment_expires_at: str | None = None
    message: str


@router.post("/resend/{application_id}", response_model=ResendResponse)
async def resend_assessment(
    application_id: uuid.UUID,
    req: ApprovalRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    app_result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = app_result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    job_result = await db.execute(
        select(JobPosting).where(JobPosting.id == app.job_id)
    )
    job = job_result.scalar_one()

    app.assessment_token = secrets.token_urlsafe(32)
    app.assessment_sent_at = datetime.now(timezone.utc)

    expires_at = None
    if req.expiration_days and req.expiration_days > 0:
        expires_at = datetime.now(timezone.utc) + timedelta(days=req.expiration_days)
        app.assessment_expires_at = expires_at
    else:
        app.assessment_expires_at = None

    if app.status != "approved":
        app.status = "approved"
        app.stage = max(app.stage, 2)

    magic_link = f"{settings.frontend_url}/assessment/{app.assessment_token}"
    await db.commit()

    await log_action(db, application_id, "assessment_resent", f"Resent assessment link, expires in {req.expiration_days or 'default'} days")

    await send_stage2_invitation_email(
        to=app.candidate_email,
        name=app.candidate_name,
        job_title=job.title,
        magic_link=magic_link,
        expires_at=expires_at,
    )

    return {
        "assessment_token": app.assessment_token,
        "assessment_sent_at": str(app.assessment_sent_at) if app.assessment_sent_at else None,
        "assessment_expires_at": str(app.assessment_expires_at) if app.assessment_expires_at else None,
        "message": "Assessment invitation resent successfully",
    }


@router.post("/clear/{job_id}", status_code=status.HTTP_200_OK)
async def clear_applications(job_id: uuid.UUID, db: AsyncSession = Depends(get_db), _: dict = Depends(verify_hr_token)):
    app_result = await db.execute(
        select(Application).where(Application.job_id == job_id)
    )
    apps = app_result.scalars().all()
    count = len(apps)
    for a in apps:
        sr_result = await db.execute(
            select(AIScreeningResult).where(AIScreeningResult.application_id == a.id)
        )
        sr = sr_result.scalar_one_or_none()
        if sr:
            await db.delete(sr)
        sr_result = await db.execute(
            select(StageResult).where(StageResult.application_id == a.id)
        )
        for st in sr_result.scalars().all():
            await db.delete(st)
        cs_result = await db.execute(
            select(ConversationSession).where(ConversationSession.application_id == a.id)
        )
        for cs in cs_result.scalars().all():
            await db.delete(cs)
        iv_result = await db.execute(
            select(Interview).where(Interview.application_id == a.id)
        )
        for iv in iv_result.scalars().all():
            await db.delete(iv)
        await db.delete(a)
    await db.commit()
    for a in apps:
        await log_action(db, a.id, "application_cleared", "Application removed from system")
    return {"deleted": count}


def _media_type_for(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return "application/pdf"
    if ext in (".docx", ".doc"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if ext == ".txt":
        return "text/plain"
    return "application/octet-stream"


@router.get("/applications/{application_id}/document")
async def get_application_document(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    file_path = app.cv_url or ""
    filename = f"{app.candidate_name}_CV.pdf"

    if file_path.startswith("file://"):
        local_path = file_path[7:]
        if not os.path.exists(local_path):
            raise HTTPException(status_code=404, detail="File not found")
        return FileResponse(local_path, media_type=_media_type_for(local_path), filename=filename)
    elif file_path and settings.azure_storage_connection_string and "blob.core.windows.net" in file_path:
        # Blobs are uploaded to a private container, so an anonymous GET against the
        # blob URL 404s — fetch through the authenticated SDK client instead.
        from urllib.parse import urlparse

        from azure.core.exceptions import ResourceNotFoundError
        from azure.storage.blob.aio import BlobServiceClient

        parsed_path = urlparse(file_path).path.lstrip("/")
        container_name, _, blob_name = parsed_path.partition("/")
        if not blob_name:
            raise HTTPException(status_code=404, detail="File not found")

        service = BlobServiceClient.from_connection_string(settings.azure_storage_connection_string)
        async with service:
            container = service.get_container_client(container_name)
            try:
                downloader = await container.download_blob(blob_name)
                content = await downloader.readall()
            except ResourceNotFoundError:
                raise HTTPException(status_code=404, detail="File not found")

        return Response(
            content=content,
            media_type=_media_type_for(blob_name),
            headers={"Content-Disposition": f'inline; filename="{filename}"'},
        )
    elif file_path:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(file_path)
            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="File not found")
            return Response(
                content=resp.content,
                media_type=resp.headers.get("content-type", _media_type_for(file_path)),
                headers={"Content-Disposition": f'inline; filename="{filename}"'},
            )

    raise HTTPException(status_code=404, detail="No document available")


class AuditLogEntry(BaseModel):
    id: str
    application_id: str
    action: str
    detail: str | None = None
    performed_by: str | None = None
    created_at: str | None = None

    model_config = {"from_attributes": True}


@router.get("/audit-logs/{application_id}", response_model=list[AuditLogEntry])
async def list_audit_logs(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    logs = await get_audit_logs(db, application_id)
    return [
        AuditLogEntry(
            id=str(log.id),
            application_id=str(log.application_id),
            action=log.action,
            detail=log.detail,
            performed_by=log.performed_by,
            created_at=str(log.created_at) if log.created_at else None,
        )
        for log in logs
    ]
