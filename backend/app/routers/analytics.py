import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import verify_hr_token
from app.database import get_db
from app.models.ai_result import AIScreeningResult
from app.models.application import Application
from app.models.conversation import ConversationSession
from app.models.job_posting import JobPosting
from app.models.stage import StageResult

router = APIRouter(prefix="/api/hr/analytics", tags=["analytics"])


@router.get("/overview")
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    total_apps = await db.execute(select(func.count(Application.id)))
    total_applications = total_apps.scalar() or 0

    pending = await db.execute(
        select(func.count(Application.id)).where(Application.status == "pending")
    )
    pending_review = pending.scalar() or 0

    approved = await db.execute(
        select(func.count(Application.id)).where(Application.status == "approved")
    )
    shortlisted = approved.scalar() or 0

    rejected = await db.execute(
        select(func.count(Application.id)).where(Application.status == "rejected")
    )
    rejected_count = rejected.scalar() or 0

    completed = await db.execute(
        select(func.count(Application.id)).where(Application.status == "assessment_completed")
    )
    completed_count = completed.scalar() or 0

    jobs_result = await db.execute(
        select(JobPosting.id, JobPosting.title, JobPosting.status).where(
            JobPosting.is_deleted == False
        )
    )
    jobs_raw = jobs_result.all()

    per_job = []
    for jid, title, status in jobs_raw:
        cnt = await db.execute(
            select(func.count(Application.id)).where(Application.job_id == jid)
        )
        per_job.append({
            "job_id": str(jid),
            "title": title,
            "status": status,
            "applications": cnt.scalar() or 0,
        })

    return {
        "total_applications": total_applications,
        "pending_review": pending_review,
        "shortlisted": shortlisted,
        "rejected": rejected_count,
        "assessment_completed": completed_count,
        "per_job": per_job,
    }


@router.get("/interviews")
async def get_interview_analytics(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    total_sent = await db.execute(
        select(func.count(Application.id)).where(
            Application.assessment_token.isnot(None)
        )
    )
    total_sent_count = total_sent.scalar() or 0

    completed = await db.execute(
        select(func.count(Application.id)).where(Application.status == "assessment_completed")
    )
    completed_count = completed.scalar() or 0

    completion_rate = round((completed_count / total_sent_count * 100), 1) if total_sent_count > 0 else 0

    stage_results = await db.execute(
        select(StageResult.score).where(
            StageResult.stage_number == 2,
            StageResult.score.isnot(None),
        )
    )
    scores = [r[0] for r in stage_results.all() if r[0] is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    top_result = await db.execute(
        select(
            Application.candidate_name,
            Application.candidate_email,
            StageResult.score,
            JobPosting.title,
        )
        .select_from(Application)
        .join(StageResult, StageResult.application_id == Application.id)
        .join(JobPosting, JobPosting.id == Application.job_id)
        .where(
            StageResult.stage_number == 2,
            StageResult.score.isnot(None),
        )
        .order_by(StageResult.score.desc())
        .limit(10)
    )
    top_performers = [
        {
            "name": row[0],
            "email": row[1],
            "score": row[2],
            "job_title": row[3],
        }
        for row in top_result.all()
    ]

    return {
        "total_sent": total_sent_count,
        "completed": completed_count,
        "completion_rate": completion_rate,
        "average_score": avg_score,
        "top_performers": top_performers,
    }


@router.get("/pipeline")
async def get_pipeline(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    jobs_result = await db.execute(
        select(JobPosting).where(
            JobPosting.is_deleted == False,
            JobPosting.status == "active",
        )
    )
    jobs = jobs_result.scalars().all()

    pipeline_data = []
    for job in jobs:
        total = await db.execute(
            select(func.count(Application.id)).where(Application.job_id == job.id)
        )
        total_count = total.scalar() or 0

        screened = await db.execute(
            select(func.count(Application.id)).where(
                Application.job_id == job.id,
                Application.screening_result.has(),
            )
        )
        screened_count = screened.scalar() or 0

        shortlisted = await db.execute(
            select(func.count(Application.id)).where(
                Application.job_id == job.id,
                Application.status == "approved",
            )
        )
        shortlisted_count = shortlisted.scalar() or 0

        interviewed = await db.execute(
            select(func.count(Application.id)).where(
                Application.job_id == job.id,
                Application.status == "assessment_completed",
            )
        )
        interviewed_count = interviewed.scalar() or 0

        rejected_count = await db.execute(
            select(func.count(Application.id)).where(
                Application.job_id == job.id,
                Application.status == "rejected",
            )
        )
        rejected_count = rejected_count.scalar() or 0

        pipeline_data.append({
            "job_id": str(job.id),
            "title": job.title,
            "total_applications": total_count,
            "screened": screened_count,
            "shortlisted": shortlisted_count,
            "interviewed": interviewed_count,
            "rejected": rejected_count,
        })

    return {"pipeline": pipeline_data}


@router.get("/time-to-hire")
async def get_time_to_hire(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    results = await db.execute(
        select(
            Application.id,
            Application.candidate_name,
            Application.created_at,
            Application.assessment_sent_at,
            JobPosting.title,
        )
        .select_from(Application)
        .join(JobPosting, JobPosting.id == Application.job_id)
        .where(
            Application.assessment_sent_at.isnot(None),
            Application.created_at.isnot(None),
        )
    )

    time_deltas = []
    for row in results.all():
        created = row[2]
        sent = row[3]
        if created and sent:
            days = (sent - created).days
            time_deltas.append({
                "application_id": str(row[0]),
                "candidate_name": row[1],
                "job_title": row[4],
                "application_date": str(created),
                "assessment_sent_date": str(sent),
                "days_to_review": days,
            })

    avg_days = round(sum(t["days_to_review"] for t in time_deltas) / len(time_deltas), 1) if time_deltas else 0

    return {
        "average_days_to_review": avg_days,
        "records": time_deltas,
    }


@router.get("/trends")
async def get_trends(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    apps = await db.execute(
        select(
            func.date(Application.created_at).label("date"),
            func.count(Application.id).label("count"),
        )
        .group_by(func.date(Application.created_at))
        .order_by(func.date(Application.created_at).desc())
        .limit(30)
    )
    daily_applications = [
        {"date": str(row[0]), "count": row[1]}
        for row in apps.all()
    ]
    daily_applications.reverse()

    return {
        "daily_applications": daily_applications,
    }
