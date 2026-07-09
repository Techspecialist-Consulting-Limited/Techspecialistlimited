import json
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.ai_readiness_assessment import AiReadinessAssessment

router = APIRouter(prefix="/api/ai-readiness", tags=["ai-readiness"])


class SubmitRequest(BaseModel):
    email: str
    company_name: str | None = None
    scores: dict[str, Any]
    total_score: float
    max_score: float | None = 75
    level: str


class AssessmentResponse(BaseModel):
    id: uuid.UUID
    email: str
    company_name: str
    total_score: float
    max_score: float
    level: str
    scores: dict[str, Any]
    created_at: datetime
    followed_up: bool

    model_config = {"from_attributes": True}


def _to_response(row: AiReadinessAssessment) -> AssessmentResponse:
    return AssessmentResponse(
        id=row.id,
        email=row.email,
        company_name=row.company_name,
        total_score=row.total_score,
        max_score=row.max_score,
        level=row.level,
        scores=json.loads(row.scores),
        created_at=row.created_at,
        followed_up=row.followed_up,
    )


@router.post("/submit", response_model=AssessmentResponse, status_code=201)
async def submit_assessment(req: SubmitRequest, db: AsyncSession = Depends(get_db)):
    row = AiReadinessAssessment(
        email=req.email,
        company_name=req.company_name or "Not provided",
        scores=json.dumps(req.scores),
        total_score=req.total_score,
        max_score=req.max_score or 75,
        level=req.level,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return _to_response(row)


@router.get("/results", response_model=list[AssessmentResponse])
async def list_assessments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AiReadinessAssessment).order_by(AiReadinessAssessment.created_at.desc())
    )
    return [_to_response(row) for row in result.scalars().all()]


class UpdateRequest(BaseModel):
    followed_up: bool


@router.patch("/results/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(
    assessment_id: uuid.UUID, req: UpdateRequest, db: AsyncSession = Depends(get_db)
):
    row = await db.get(AiReadinessAssessment, assessment_id)
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")

    row.followed_up = req.followed_up
    await db.commit()
    await db.refresh(row)
    return _to_response(row)


@router.delete("/results/{assessment_id}")
async def delete_assessment(assessment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    row = await db.get(AiReadinessAssessment, assessment_id)
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")

    await db.delete(row)
    await db.commit()
    return {"message": "Assessment deleted"}
