import io
import json
import uuid as uuid_mod
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db
from app.models.application import Application
from app.models.conversation import ConversationSession
from app.models.stage import StageResult
from app.services.audio_evaluation import transcribe_audio
from app.services.conversation import (
    evaluate_full_conversation,
    process_candidate_response,
    start_conversation,
)
from app.services.storage import upload_bytes, upload_file
from app.services.tts import synthesize_speech

router = APIRouter(prefix="/api/assessment", tags=["assessment"])


def _sanitize_header(text: str) -> str:
    return text.encode("latin-1", errors="replace").decode("latin-1")


def _parse_questions(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return [q.strip() for q in raw.split(",") if q.strip()]


def _is_expired(expires_at: datetime | None) -> bool:
    """SQLite drops tzinfo on round-trip, so DateTime(timezone=True) columns
    come back naive even though they were written as UTC-aware. Strip tzinfo
    from `now` too so the comparison doesn't raise on naive/aware mismatch."""
    if not expires_at:
        return False
    now = datetime.now(timezone.utc).replace(tzinfo=None) if expires_at.tzinfo is None else datetime.now(timezone.utc)
    return expires_at < now


@router.get("/{token}")
async def get_assessment(
    token: str, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Application)
        .where(Application.assessment_token == token)
        .options(selectinload(Application.job))
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Invalid or expired token")
    if app.status != "approved" or app.stage != 2:
        raise HTTPException(status_code=400, detail="Assessment not available")

    if _is_expired(app.assessment_expires_at):
        raise HTTPException(
            status_code=410,
            detail="This assessment link has expired. Please contact the HR team for a new invitation.",
        )

    topic_labels = _parse_questions(app.job.stage2_topic_labels)
    questions = _parse_questions(app.job.stage2_questions)
    if not topic_labels and questions:
        topic_labels = [f"Topic {i+1}" for i in range(len(questions))]

    existing_session = await db.execute(
        select(ConversationSession).where(
            ConversationSession.application_id == app.id,
            ConversationSession.status == "in_progress",
        )
    )
    session = existing_session.scalar_one_or_none()

    return {
        "candidate_name": app.candidate_name,
        "job_title": app.job.title,
        "topic_labels": topic_labels,
        "topic_count": len(topic_labels),
        "topic_time_limit": settings.topic_time_limit_seconds,
        "instructions": app.job.stage2_instructions,
        "has_existing_session": session is not None,
        "existing_conversation_id": str(session.id) if session else None,
        "engine": "realtime" if settings.realtime_interview_enabled else "legacy",
    }


@router.post("/{token}/start")
async def start_assessment(
    token: str, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Application)
        .where(Application.assessment_token == token)
        .options(selectinload(Application.job))
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Invalid token")
    if app.status != "approved" or app.stage != 2:
        raise HTTPException(status_code=400, detail="Assessment not available")

    if _is_expired(app.assessment_expires_at):
        raise HTTPException(
            status_code=410,
            detail="This assessment link has expired. Please contact the HR team for a new invitation.",
        )

    existing = await db.execute(
        select(ConversationSession).where(
            ConversationSession.application_id == app.id,
            ConversationSession.status == "in_progress",
        )
    )
    existing_session = existing.scalar_one_or_none()

    questions = _parse_questions(app.job.stage2_questions)
    labels = _parse_questions(app.job.stage2_topic_labels)

    topics = []
    for i, q in enumerate(questions):
        label = labels[i] if i < len(labels) else f"Topic {i+1}"
        topics.append({"label": label, "seed_question": q})

    if existing_session:
        history = json.loads(existing_session.conversation_history)
        ai_message_text = history[-1]["content"] if history and history[-1]["role"] == "ai" else "Welcome back. Let's continue."
        topic_idx = existing_session.current_topic_index
        topic_label = topics[min(topic_idx, len(topics) - 1)]["label"] if topics else "Topic 1"
        try:
            audio_bytes = await synthesize_speech(ai_message_text)
        except Exception:
            audio_bytes = b""

        return StreamingResponse(
            io.BytesIO(audio_bytes) if audio_bytes else io.BytesIO(b""),
            media_type="audio/mpeg",
            headers={
                "X-Topic-Label": topic_label,
                "X-Conversation-Id": str(existing_session.id),
                "X-Interview-Done": "false",
                "X-AI-Text": _sanitize_header(ai_message_text),
            },
        )

    ai_message_text, history = await start_conversation(
        job_title=app.job.title,
        instructions=app.job.stage2_instructions,
        candidate_name=app.candidate_name,
        topics=topics,
    )

    session = ConversationSession(
        application_id=app.id,
        status="in_progress",
        current_topic_index=0,
        turns_on_current_topic=1,
        topics=json.dumps(topics),
        conversation_history=json.dumps(history),
        engine="realtime" if settings.realtime_interview_enabled else "legacy",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    audio_bytes = await synthesize_speech(ai_message_text)

    return StreamingResponse(
        io.BytesIO(audio_bytes) if audio_bytes else io.BytesIO(b""),
        media_type="audio/mpeg",
        headers={
            "X-Topic-Label": topics[0]["label"],
            "X-Conversation-Id": str(session.id),
            "X-Interview-Done": "false",
            "X-AI-Text": _sanitize_header(ai_message_text),
        },
    )


@router.post("/{token}/respond")
async def respond_assessment(
    token: str,
    audio: UploadFile,
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .where(Application.assessment_token == token)
        .options(selectinload(Application.job))
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Invalid token")

    if _is_expired(app.assessment_expires_at):
        raise HTTPException(
            status_code=410,
            detail="This assessment link has expired.",
        )

    session_result = await db.execute(
        select(ConversationSession).where(
            ConversationSession.id == uuid_mod.UUID(conversation_id),
            ConversationSession.application_id == app.id,
            ConversationSession.status == "in_progress",
        )
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already completed")

    audio_data = await audio.read()
    transcript = await transcribe_audio(audio_data, audio.filename or "audio.webm")

    conversation_history = json.loads(session.conversation_history)
    topics = json.loads(session.topics)

    (
        ai_message_text,
        action,
        new_topic_index,
        new_turns_count,
        is_done,
        updated_history,
    ) = await process_candidate_response(
        conversation_history=conversation_history,
        candidate_transcript=transcript,
        job_title=app.job.title,
        instructions=app.job.stage2_instructions,
        topics=topics,
        current_topic_index=session.current_topic_index,
        turns_on_current_topic=session.turns_on_current_topic,
        max_turns_per_topic=settings.max_turns_per_topic,
    )

    session.conversation_history = json.dumps(updated_history)
    session.current_topic_index = new_topic_index
    session.turns_on_current_topic = new_turns_count

    await upload_bytes(audio_data, settings.assessments_container_name)

    if is_done:
        evaluation = await evaluate_full_conversation(
            conversation_history=updated_history,
            job_title=app.job.title,
            instructions=app.job.stage2_instructions,
            topics=topics,
        )

        stage_result = StageResult(
            application_id=app.id,
            stage_number=2,
            transcript=json.dumps(updated_history),
            score=evaluation.get("score"),
            ai_feedback=json.dumps(evaluation),
        )
        db.add(stage_result)
        session.status = "completed"
        app.status = "assessment_completed"

    await db.commit()

    audio_bytes = await synthesize_speech(ai_message_text)

    return StreamingResponse(
        io.BytesIO(audio_bytes) if audio_bytes else io.BytesIO(b""),
        media_type="audio/mpeg",
        headers={
            "X-Topic-Label": topics[new_topic_index]["label"]
            if new_topic_index < len(topics)
            else "Complete",
            "X-Interview-Done": "true" if is_done else "false",
            "X-AI-Text": _sanitize_header(ai_message_text),
        },
    )


@router.post("/{token}/end")
async def end_assessment(
    token: str,
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .where(Application.assessment_token == token)
        .options(selectinload(Application.job))
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Invalid token")

    if _is_expired(app.assessment_expires_at):
        raise HTTPException(
            status_code=410,
            detail="This assessment link has expired.",
        )

    session_result = await db.execute(
        select(ConversationSession).where(
            ConversationSession.id == uuid_mod.UUID(conversation_id),
            ConversationSession.application_id == app.id,
            ConversationSession.status == "in_progress",
        )
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or already completed")

    conversation_history = json.loads(session.conversation_history)
    topics = json.loads(session.topics)

    evaluation = await evaluate_full_conversation(
        conversation_history=conversation_history,
        job_title=app.job.title,
        instructions=app.job.stage2_instructions,
        topics=topics,
    )

    stage_result = StageResult(
        application_id=app.id,
        stage_number=2,
        transcript=json.dumps(conversation_history),
        score=evaluation.get("score"),
        ai_feedback=json.dumps(evaluation),
    )
    db.add(stage_result)
    session.status = "completed"
    app.status = "assessment_completed"
    await db.commit()

    return {"status": "completed"}
