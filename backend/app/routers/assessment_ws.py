import asyncio
import base64
import json
import logging
import re
import uuid as uuid_mod

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import async_session
from app.models.application import Application
from app.models.conversation import ConversationSession
from app.models.stage import StageResult
from app.services.audio_evaluation import transcribe_audio
from app.services.conversation import (
    evaluate_full_conversation,
    process_candidate_response,
)
from app.services.storage import upload_bytes
from app.services.tts import synthesize_speech

router = APIRouter(prefix="/api/assessment", tags=["assessment-ws"])
logger = logging.getLogger(__name__)


def split_into_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()] or [text]


@router.websocket("/{token}/ws")
async def assessment_websocket(
    websocket: WebSocket,
    token: str,
    conversation_id: str,
):
    await websocket.accept()

    app = None
    session_obj = None
    topics = []

    try:
        async with async_session() as db:
            result = await db.execute(
                select(Application)
                .where(Application.assessment_token == token)
                .options(selectinload(Application.job))
            )
            app = result.scalar_one_or_none()
            if not app:
                await websocket.send_json({"type": "error", "message": "Invalid token"})
                await websocket.close()
                return

            session_result = await db.execute(
                select(ConversationSession).where(
                    ConversationSession.id == uuid_mod.UUID(conversation_id),
                    ConversationSession.application_id == app.id,
                    ConversationSession.status == "in_progress",
                )
            )
            session_obj = session_result.scalar_one_or_none()
            if not session_obj:
                await websocket.send_json({"type": "error", "message": "Session not found or already completed"})
                await websocket.close()
                return

            topics = json.loads(session_obj.topics)

        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)

            if msg.get("type") == "audio":
                await handle_audio_message(websocket, app, session_obj, msg, topics)
            elif msg.get("type") == "end":
                await handle_end_message(websocket, app, session_obj, topics)
                return

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for token {token}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


async def handle_audio_message(
    websocket: WebSocket,
    app: Application,
    session_obj: ConversationSession,
    msg: dict,
    topics: list[dict],
):
    try:
        audio_bytes = base64.b64decode(msg["data"])
    except Exception as e:
        await websocket.send_json({"type": "error", "message": f"Invalid audio data: {e}"})
        return

    try:
        transcript = await transcribe_audio(audio_bytes, "response.webm")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": f"Transcription failed: {e}"})
        return

    await websocket.send_json({"type": "transcript", "role": "candidate", "text": transcript})

    try:
        async with async_session() as db:
            session_result = await db.execute(
                select(ConversationSession).where(
                    ConversationSession.id == session_obj.id
                )
            )
            session = session_result.scalar_one_or_none()
            if not session:
                await websocket.send_json({"type": "error", "message": "Session lost"})
                return

            conversation_history = json.loads(session.conversation_history)
            current_topics = json.loads(session.topics)

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
                topics=current_topics,
                current_topic_index=session.current_topic_index,
                turns_on_current_topic=session.turns_on_current_topic,
                max_turns_per_topic=settings.max_turns_per_topic,
            )

            session.conversation_history = json.dumps(updated_history)
            session.current_topic_index = new_topic_index
            session.turns_on_current_topic = new_turns_count
            await db.commit()

            session_obj.conversation_history = session.conversation_history
            session_obj.current_topic_index = session.current_topic_index
            session_obj.turns_on_current_topic = session.turns_on_current_topic
    except Exception as e:
        await websocket.send_json({"type": "error", "message": f"AI processing failed: {e}"})
        return

    try:
        await upload_bytes(audio_bytes, settings.assessments_container_name)
    except Exception as e:
        logger.warning(f"Audio upload failed (non-fatal): {e}")

    await websocket.send_json({"type": "transcript", "role": "ai", "text": ai_message_text})

    sentences = split_into_sentences(ai_message_text)
    dev_mode_tts = False

    for i, sentence in enumerate(sentences):
        try:
            audio_bytes_tts = await synthesize_speech(sentence)
        except Exception as e:
            logger.warning(f"TTS failed for sentence {i}: {e}")
            audio_bytes_tts = b""

        if not audio_bytes_tts:
            dev_mode_tts = True
            continue

        b64 = base64.b64encode(audio_bytes_tts).decode("ascii")
        await websocket.send_json({
            "type": "audio_chunk",
            "data": b64,
            "sentence_index": i,
        })

    topic_label = (
        topics[min(new_topic_index, len(topics) - 1)]["label"]
        if topics else "Complete"
    )

    await websocket.send_json({
        "type": "audio_done",
        "topic_label": topic_label,
        "is_done": is_done,
        "dev_mode_tts": dev_mode_tts,
    })

    if is_done:
        try:
            async with async_session() as db:
                session_result = await db.execute(
                    select(ConversationSession).where(
                        ConversationSession.id == session_obj.id
                    )
                )
                session = session_result.scalar_one_or_none()

                app_result = await db.execute(
                    select(Application)
                    .where(Application.id == app.id)
                    .options(selectinload(Application.job))
                )
                app_refresh = app_result.scalar_one_or_none()

                if session and app_refresh:
                    final_history = json.loads(session.conversation_history)
                    current_topics = json.loads(session.topics)

                    evaluation = await evaluate_full_conversation(
                        conversation_history=final_history,
                        job_title=app_refresh.job.title,
                        instructions=app_refresh.job.stage2_instructions,
                        topics=current_topics,
                    )

                    stage_result = StageResult(
                        application_id=app_refresh.id,
                        stage_number=2,
                        transcript=json.dumps(final_history),
                        score=evaluation.get("score"),
                        ai_feedback=json.dumps(evaluation),
                    )
                    db.add(stage_result)
                    session.status = "completed"
                    app_refresh.status = "assessment_completed"
                    await db.commit()

                    await websocket.send_json({
                        "type": "interview_complete",
                        "score": evaluation.get("score"),
                    })
        except Exception as e:
            logger.error(f"Final evaluation failed: {e}")
            await websocket.send_json({"type": "error", "message": f"Final evaluation failed: {e}"})

        await websocket.close()
        return


async def handle_end_message(
    websocket: WebSocket,
    app: Application,
    session_obj: ConversationSession,
    topics: list[dict],
):
    try:
        async with async_session() as db:
            session_result = await db.execute(
                select(ConversationSession).where(
                    ConversationSession.id == session_obj.id
                )
            )
            session = session_result.scalar_one_or_none()

            app_result = await db.execute(
                select(Application)
                .where(Application.id == app.id)
                .options(selectinload(Application.job))
            )
            app_refresh = app_result.scalar_one_or_none()

            if not session or not app_refresh:
                await websocket.send_json({"type": "error", "message": "Session not found"})
                return

            conversation_history = json.loads(session.conversation_history)
            current_topics = json.loads(session.topics)

            evaluation = await evaluate_full_conversation(
                conversation_history=conversation_history,
                job_title=app_refresh.job.title,
                instructions=app_refresh.job.stage2_instructions,
                topics=current_topics,
            )

            stage_result = StageResult(
                application_id=app_refresh.id,
                stage_number=2,
                transcript=json.dumps(conversation_history),
                score=evaluation.get("score"),
                ai_feedback=json.dumps(evaluation),
            )
            db.add(stage_result)
            session.status = "completed"
            app_refresh.status = "assessment_completed"
            await db.commit()

            await websocket.send_json({
                "type": "interview_complete",
                "score": evaluation.get("score"),
            })
    except Exception as e:
        logger.error(f"End interview failed: {e}")
        await websocket.send_json({"type": "error", "message": str(e)})

    await websocket.close()
