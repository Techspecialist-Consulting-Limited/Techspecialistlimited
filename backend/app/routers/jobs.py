import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import verify_hr_token
from app.database import get_db
from app.models.job_posting import JobPosting
from app.models.application import Application

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


class JobCreate(BaseModel):
    title: str
    description: str
    requirements: str
    department: str = ""
    location: str = ""
    type: str = "Full-time"
    screening_instructions: str = ""
    stage2_instructions: str = ""
    stage2_questions: list[str] = []
    stage2_topic_labels: list[str] = []
    auto_advance_enabled: bool = False
    auto_advance_pass_mark: float = 70.0
    auto_advance_delay_minutes: int = 5


class JobResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    requirements: str
    department: str = ""
    location: str = ""
    type: str = ""
    status: str
    is_deleted: bool = False
    is_closed: bool = False
    screening_instructions: str = ""
    stage2_instructions: str = ""
    stage2_questions: list[str] = []
    stage2_topic_labels: list[str] = []
    auto_advance_enabled: bool = False
    auto_advance_pass_mark: float = 70.0
    auto_advance_delay_minutes: int = 5
    applicant_count: int = 0
    created_at: str | None = None

    model_config = {"from_attributes": True}


class JobUpdate(BaseModel):
    is_closed: bool | None = None
    status: str | None = None
    department: str | None = None
    location: str | None = None
    type: str | None = None
    auto_advance_enabled: bool | None = None
    auto_advance_pass_mark: float | None = None
    auto_advance_delay_minutes: int | None = None


def parse_json_list(value: str | list | None) -> list:
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return []
    return []


def format_dt(dt) -> str | None:
    return str(dt) if dt else None


async def _build_job_response(job: JobPosting, db: AsyncSession) -> JobResponse:
    count_result = await db.execute(
        select(func.count(Application.id)).where(Application.job_id == job.id)
    )
    applicant_count = count_result.scalar() or 0

    return JobResponse(
        id=job.id,
        title=job.title,
        description=job.description,
        requirements=job.requirements,
        department=job.department or "",
        location=job.location or "",
        type=job.type or "",
        status=job.status,
        is_deleted=job.is_deleted,
        is_closed=job.is_closed,
        screening_instructions=job.screening_instructions or "",
        stage2_instructions=job.stage2_instructions or "",
        stage2_questions=parse_json_list(job.stage2_questions),
        stage2_topic_labels=parse_json_list(job.stage2_topic_labels),
        auto_advance_enabled=job.auto_advance_enabled,
        auto_advance_pass_mark=job.auto_advance_pass_mark,
        auto_advance_delay_minutes=job.auto_advance_delay_minutes,
        applicant_count=applicant_count,
        created_at=format_dt(job.created_at),
    )


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(job: JobCreate, db: AsyncSession = Depends(get_db), _: dict = Depends(verify_hr_token)):
    db_job = JobPosting(
        title=job.title,
        description=job.description,
        requirements=job.requirements,
        department=job.department,
        location=job.location,
        type=job.type,
        screening_instructions=job.screening_instructions,
        stage2_instructions=job.stage2_instructions,
        stage2_questions=json.dumps(job.stage2_questions),
        stage2_topic_labels=json.dumps(job.stage2_topic_labels),
        auto_advance_enabled=job.auto_advance_enabled,
        auto_advance_pass_mark=job.auto_advance_pass_mark,
        auto_advance_delay_minutes=job.auto_advance_delay_minutes,
    )
    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)
    return await _build_job_response(db_job, db)


@router.get("", response_model=list[JobResponse])
async def list_jobs(
    show_all: bool = False,
    deleted: bool = False,
    db: AsyncSession = Depends(get_db),
):
    query = select(JobPosting)

    if show_all:
        pass  # return all including deleted
    elif deleted:
        query = query.where(JobPosting.is_deleted == True)
    else:
        query = query.where(JobPosting.is_deleted == False)

    query = query.order_by(JobPosting.created_at.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()

    responses = []
    for job in jobs:
        responses.append(await _build_job_response(job, db))
    return responses


@router.get("/history", response_model=list[JobResponse])
async def list_deleted_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(JobPosting)
        .where(JobPosting.is_deleted == True)
        .order_by(JobPosting.updated_at.desc())
    )
    jobs = result.scalars().all()
    responses = []
    for job in jobs:
        responses.append(await _build_job_response(job, db))
    return responses


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(JobPosting).where(JobPosting.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return await _build_job_response(job, db)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: uuid.UUID,
    update: JobUpdate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    result = await db.execute(select(JobPosting).where(JobPosting.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if update.is_closed is not None:
        job.is_closed = update.is_closed
    if update.status is not None:
        job.status = update.status
    if update.department is not None:
        job.department = update.department
    if update.location is not None:
        job.location = update.location
    if update.type is not None:
        job.type = update.type
    if update.auto_advance_enabled is not None:
        job.auto_advance_enabled = update.auto_advance_enabled
    if update.auto_advance_pass_mark is not None:
        job.auto_advance_pass_mark = update.auto_advance_pass_mark
    if update.auto_advance_delay_minutes is not None:
        job.auto_advance_delay_minutes = update.auto_advance_delay_minutes

    await db.commit()
    await db.refresh(job)
    return await _build_job_response(job, db)


@router.put("/{job_id}/soft-delete", response_model=JobResponse)
async def soft_delete_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    result = await db.execute(select(JobPosting).where(JobPosting.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_deleted = True
    await db.commit()
    await db.refresh(job)
    return await _build_job_response(job, db)


@router.put("/{job_id}/restore", response_model=JobResponse)
async def restore_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    result = await db.execute(select(JobPosting).where(JobPosting.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_deleted = False
    await db.commit()
    await db.refresh(job)
    return await _build_job_response(job, db)
