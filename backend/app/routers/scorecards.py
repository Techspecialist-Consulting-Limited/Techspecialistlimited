import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_hr_token
from app.database import get_db
from app.models.application import Application
from app.models.scorecard import InterviewScorecard
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/hr/scorecards", tags=["scorecards"])

RECOMMENDATIONS = {"strong_yes", "yes", "no", "strong_no"}


class ScorecardCreate(BaseModel):
    application_id: uuid.UUID
    interviewer_name: str
    communication_score: int = Field(ge=1, le=5)
    technical_score: int = Field(ge=1, le=5)
    culture_fit_score: int = Field(ge=1, le=5)
    problem_solving_score: int = Field(ge=1, le=5)
    recommendation: str
    notes: str | None = None


class ScorecardResponse(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    interviewer_name: str
    communication_score: int
    technical_score: int
    culture_fit_score: int
    problem_solving_score: int
    recommendation: str
    notes: str | None = None
    created_at: str | None = None

    model_config = {"from_attributes": True}


def _to_response(s: InterviewScorecard) -> ScorecardResponse:
    return ScorecardResponse(
        id=s.id,
        application_id=s.application_id,
        interviewer_name=s.interviewer_name,
        communication_score=s.communication_score,
        technical_score=s.technical_score,
        culture_fit_score=s.culture_fit_score,
        problem_solving_score=s.problem_solving_score,
        recommendation=s.recommendation,
        notes=s.notes,
        created_at=str(s.created_at) if s.created_at else None,
    )


@router.post("", response_model=ScorecardResponse)
async def create_scorecard(
    data: ScorecardCreate,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    if data.recommendation not in RECOMMENDATIONS:
        raise HTTPException(status_code=400, detail="Invalid recommendation")

    app_result = await db.execute(select(Application).where(Application.id == data.application_id))
    if not app_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Application not found")

    scorecard = InterviewScorecard(
        application_id=data.application_id,
        interviewer_name=data.interviewer_name,
        communication_score=data.communication_score,
        technical_score=data.technical_score,
        culture_fit_score=data.culture_fit_score,
        problem_solving_score=data.problem_solving_score,
        recommendation=data.recommendation,
        notes=data.notes,
    )
    db.add(scorecard)
    await db.commit()
    await db.refresh(scorecard)

    await log_action(
        db, data.application_id, "scorecard_submitted",
        f"{data.interviewer_name} submitted a scorecard: {data.recommendation.replace('_', ' ')}",
    )

    return _to_response(scorecard)


@router.get("/by-application/{application_id}", response_model=list[ScorecardResponse])
async def list_scorecards(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(verify_hr_token),
):
    result = await db.execute(
        select(InterviewScorecard)
        .where(InterviewScorecard.application_id == application_id)
        .order_by(InterviewScorecard.created_at.desc())
    )
    return [_to_response(s) for s in result.scalars().all()]
