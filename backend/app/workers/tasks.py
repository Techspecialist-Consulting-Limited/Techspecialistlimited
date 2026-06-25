import json
import logging
import uuid

from sqlalchemy import select

from app.database import async_session
from app.models.ai_result import AIScreeningResult
from app.models.application import Application
from app.models.job_posting import JobPosting
from app.services.ai_screening import screen_application

logger = logging.getLogger(__name__)


def _to_str(value) -> str:
    if isinstance(value, str):
        if value.startswith("{") or value.startswith("["):
            try:
                parsed = json.loads(value)
                return _to_str(parsed)
            except json.JSONDecodeError:
                pass
        return value
    if isinstance(value, dict):
        return "\n".join(f"• {k.replace('_', ' ').title()}: {v}" for k, v in value.items())
    if isinstance(value, list):
        return "\n".join(f"• {item}" for item in value)
    return str(value)


async def run_screening(application_id: str):
    try:
        async with async_session() as db:
            result = await db.execute(
                select(Application).where(Application.id == uuid.UUID(application_id))
            )
            app = result.scalar_one_or_none()
            if not app:
                logger.warning(f"Application {application_id} not found")
                return

            job_result = await db.execute(
                select(JobPosting).where(JobPosting.id == app.job_id)
            )
            job = job_result.scalar_one()

            ai_result = await screen_application(
                job_title=job.title,
                requirements=job.requirements,
                instructions=job.screening_instructions,
                cv_text=app.cv_text or "",
                cover_letter_text=app.cover_letter_text,
            )

            existing = await db.execute(
                select(AIScreeningResult).where(
                    AIScreeningResult.application_id == app.id
                )
            )
            screening = existing.scalar_one_or_none()
            if screening:
                screening.overall_score = ai_result.get("overall_score", 50)
                screening.strengths = _to_str(ai_result.get("strengths", ""))
                screening.concerns = _to_str(ai_result.get("concerns", ""))
                screening.evidence = _to_str(ai_result.get("evidence", ""))
                screening.raw_response = str(ai_result)
            else:
                screening = AIScreeningResult(
                    application_id=app.id,
                    overall_score=ai_result.get("overall_score", 50),
                    strengths=_to_str(ai_result.get("strengths", "")),
                    concerns=_to_str(ai_result.get("concerns", "")),
                    evidence=_to_str(ai_result.get("evidence", "")),
                    raw_response=str(ai_result),
                )
                db.add(screening)
            await db.commit()
            logger.info(f"Screening completed for application {application_id}")
    except Exception as e:
        logger.error(f"Screening failed for application {application_id}: {e}")
        raise
