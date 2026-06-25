import json
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
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
from app.models.job_posting import JobPosting
from app.models.stage import StageResult
from app.services.email_service import send_approval_email, send_rejection_email

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

    model_config = {"from_attributes": True}


class StageResultDetail(BaseModel):
    stage_number: int
    transcript: str | None = None
    score: float | None = None
    ai_feedback: str | None = None

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
    cv_text: str | None = None
    cover_letter_text: str | None = None
    status: str
    stage: int
    assessment_token: str | None = None
    job_title: str
    screening_result: ScreeningDetail | None = None
    stage_results: list[StageResultDetail] = []
    conversation_session: ConversationSessionDetail | None = None
    created_at: str | None = None


class ReviewAction(BaseModel):
    action: str


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

        response.append(ApplicationWithScreening(
            id=a.id,
            job_id=a.job_id,
            candidate_name=a.candidate_name,
            candidate_email=a.candidate_email,
            status=a.status,
            stage=a.stage,
            assessment_token=a.assessment_token,
            cv_text=a.cv_text,
            cover_letter_text=a.cover_letter_text,
            screening_result=ScreeningDetail.model_validate(screening) if screening else None,
            stage_results=[StageResultDetail.model_validate(s) for s in stage_results],
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
        cv_text=a.cv_text,
        cover_letter_text=a.cover_letter_text,
        status=a.status,
        stage=a.stage,
        assessment_token=a.assessment_token,
        job_title=a.job.title if a.job else "",
        screening_result=ScreeningDetail.model_validate(screening) if screening else None,
        stage_results=[StageResultDetail.model_validate(s) for s in stage_results],
        conversation_session=conv_detail,
        created_at=str(a.created_at) if a.created_at else None,
    )


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
        magic_link = f"{settings.frontend_url}/assessment/{app.assessment_token}"
        await db.commit()
        await send_approval_email(
            to=app.candidate_email,
            name=app.candidate_name,
            job_title=job.title,
            stage=old_stage,
            magic_link=magic_link if old_stage == 1 else "",
        )
    elif review.action == "reject":
        app.status = "rejected"
        await db.commit()
        await send_rejection_email(
            to=app.candidate_email,
            name=app.candidate_name,
            job_title=job.title,
            stage=app.stage,
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    return {"status": app.status, "stage": app.stage}


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
        await db.delete(a)
    await db.commit()
    return {"deleted": count}