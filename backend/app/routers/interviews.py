import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import verify_hr_token
from app.database import get_db
from app.models.application import Application
from app.models.interview import Interview
from app.models.job_posting import JobPosting
from app.services.audit_service import log_action
from app.services.email_service import send_interview_invitation_email

router = APIRouter(prefix="/api/hr/interviews", tags=["interviews"])


class InterviewCreate(BaseModel):
    application_id: str
    interview_type: str = "physical"
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int = 60
    location: str | None = None
    meeting_link: str | None = None
    interviewer_name: str | None = None
    notes: str | None = None


class InterviewUpdate(BaseModel):
    interview_type: str | None = None
    scheduled_date: str | None = None
    scheduled_time: str | None = None
    duration_minutes: int | None = None
    location: str | None = None
    meeting_link: str | None = None
    interviewer_name: str | None = None
    notes: str | None = None
    status: str | None = None


class InterviewResponse(BaseModel):
    id: str
    application_id: str
    candidate_name: str
    job_title: str
    interview_type: str
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int
    location: str | None = None
    meeting_link: str | None = None
    interviewer_name: str | None = None
    notes: str | None = None
    status: str
    created_at: str | None = None
    updated_at: str | None = None

    model_config = {"from_attributes": True}


@router.post("", response_model=InterviewResponse)
async def create_interview(
    data: InterviewCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    app_result = await db.execute(
        select(Application)
        .where(Application.id == uuid.UUID(data.application_id))
        .options(selectinload(Application.job))
    )
    app = app_result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    interview = Interview(
        application_id=uuid.UUID(data.application_id),
        interview_type=data.interview_type,
        scheduled_date=data.scheduled_date,
        scheduled_time=data.scheduled_time,
        duration_minutes=data.duration_minutes,
        location=data.location,
        meeting_link=data.meeting_link,
        interviewer_name=data.interviewer_name,
        notes=data.notes,
        status="scheduled",
    )
    db.add(interview)
    await db.commit()
    await db.refresh(interview)

    app.status = "interview_scheduled"
    await db.commit()

    await log_action(db, data.application_id, "interview_scheduled", f"Interview scheduled - {data.interview_type}, {data.scheduled_date} at {data.scheduled_time}, {data.duration_minutes}min")

    job_title = app.job.title if app.job else "the position"
    await send_interview_invitation_email(
        to=app.candidate_email,
        name=app.candidate_name,
        job_title=job_title,
        interview_date=data.scheduled_date,
        interview_time=data.scheduled_time,
        interview_type=data.interview_type,
        location_or_link=data.location or data.meeting_link or "",
        interviewer=data.interviewer_name or "",
        notes=data.notes or "",
        duration_minutes=data.duration_minutes,
    )

    return _format_interview(interview, app.candidate_name, job_title)


@router.get("/by-application/{application_id}", response_model=list[InterviewResponse])
async def get_interviews_for_application(
    application_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    result = await db.execute(
        select(Interview)
        .where(Interview.application_id == uuid.UUID(application_id))
        .order_by(Interview.scheduled_date.desc())
    )
    interviews = result.scalars().all()

    app_result = await db.execute(
        select(Application)
        .where(Application.id == uuid.UUID(application_id))
        .options(selectinload(Application.job))
    )
    app = app_result.scalar_one_or_none()
    candidate_name = app.candidate_name if app else ""
    job_title = app.job.title if app and app.job else ""

    return [_format_interview(iv, candidate_name, job_title) for iv in interviews]


@router.get("/upcoming", response_model=list[InterviewResponse])
async def get_upcoming_interviews(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = await db.execute(
        select(Interview)
        .where(
            Interview.status == "scheduled",
            Interview.scheduled_date >= today,
        )
        .order_by(Interview.scheduled_date, Interview.scheduled_time)
    )
    interviews = result.scalars().all()

    response = []
    for iv in interviews:
        app_result = await db.execute(
            select(Application)
            .where(Application.id == iv.application_id)
            .options(selectinload(Application.job))
        )
        app = app_result.scalar_one_or_none()
        candidate_name = app.candidate_name if app else ""
        job_title = app.job.title if app and app.job else ""
        response.append(_format_interview(iv, candidate_name, job_title))

    return response


@router.get("/all", response_model=list[InterviewResponse])
async def get_all_interviews(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    result = await db.execute(
        select(Interview).order_by(Interview.scheduled_date.desc(), Interview.scheduled_time.desc())
    )
    interviews = result.scalars().all()

    response = []
    for iv in interviews:
        app_result = await db.execute(
            select(Application)
            .where(Application.id == iv.application_id)
            .options(selectinload(Application.job))
        )
        app = app_result.scalar_one_or_none()
        candidate_name = app.candidate_name if app else ""
        job_title = app.job.title if app and app.job else ""
        response.append(_format_interview(iv, candidate_name, job_title))

    return response


@router.put("/{interview_id}", response_model=InterviewResponse)
async def update_interview(
    interview_id: str,
    data: InterviewUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    result = await db.execute(
        select(Interview).where(Interview.id == uuid.UUID(interview_id))
    )
    interview = result.scalar_one_or_none()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if data.interview_type is not None:
        interview.interview_type = data.interview_type
    if data.scheduled_date is not None:
        interview.scheduled_date = data.scheduled_date
    if data.scheduled_time is not None:
        interview.scheduled_time = data.scheduled_time
    if data.duration_minutes is not None:
        interview.duration_minutes = data.duration_minutes
    if data.location is not None:
        interview.location = data.location
    if data.meeting_link is not None:
        interview.meeting_link = data.meeting_link
    if data.interviewer_name is not None:
        interview.interviewer_name = data.interviewer_name
    if data.notes is not None:
        interview.notes = data.notes
    if data.status is not None:
        interview.status = data.status

    await db.commit()
    await db.refresh(interview)

    await log_action(
        db,
        str(interview.application_id),
        f"interview_{data.status or 'updated'}",
        f"Interview updated: {data.interview_type or 'unchanged'}, status={data.status or 'unchanged'}",
    )

    app_result = await db.execute(
        select(Application)
        .where(Application.id == interview.application_id)
        .options(selectinload(Application.job))
    )
    app = app_result.scalar_one_or_none()
    candidate_name = app.candidate_name if app else ""
    job_title = app.job.title if app and app.job else ""

    return _format_interview(interview, candidate_name, job_title)


def _format_interview(iv: Interview, candidate_name: str, job_title: str) -> InterviewResponse:
    return InterviewResponse(
        id=str(iv.id),
        application_id=str(iv.application_id),
        candidate_name=candidate_name,
        job_title=job_title,
        interview_type=iv.interview_type,
        scheduled_date=iv.scheduled_date,
        scheduled_time=iv.scheduled_time,
        duration_minutes=iv.duration_minutes,
        location=iv.location,
        meeting_link=iv.meeting_link,
        interviewer_name=iv.interviewer_name,
        notes=iv.notes,
        status=iv.status,
        created_at=str(iv.created_at) if iv.created_at else None,
        updated_at=str(iv.updated_at) if iv.updated_at else None,
    )
