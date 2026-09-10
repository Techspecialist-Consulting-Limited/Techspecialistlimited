import asyncio
import json
import logging
import time
import uuid as uuid_mod

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import async_session
from app.models.application import Application
from app.models.conversation import ConversationSession
from app.models.stage import StageResult
from app.services.audit_service import SYSTEM_ACTOR, log_action
from app.services.conversation import evaluate_full_conversation
from app.services.realtime_interviewer import GREETING_INSTRUCTION, advance_topic, build_session_update

router = APIRouter(prefix="/api/assessment", tags=["assessment-realtime-ws"])
logger = logging.getLogger(__name__)


def _realtime_client() -> AsyncOpenAI:
    ws_base_url = settings.azure_realtime_endpoint.replace("https://", "wss://").rstrip("/") + "/openai/v1"
    return AsyncOpenAI(api_key=settings.azure_realtime_key, websocket_base_url=ws_base_url)


@router.websocket("/{token}/realtime-ws")
async def assessment_realtime_websocket(
    websocket: WebSocket,
    token: str,
    conversation_id: str,
):
    await websocket.accept()

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
        job_title = app.job.title
        instructions_text = app.job.stage2_instructions
        candidate_name = app.candidate_name
        application_id = app.id
        session_id = session_obj.id
        interview_max_seconds = min(
            app.job.interview_max_minutes * 60, settings.realtime_max_session_seconds
        )

    session_start = time.monotonic()

    def minutes_remaining() -> float:
        elapsed = time.monotonic() - session_start
        return (interview_max_seconds - elapsed) / 60

    ctx = {
        "conversation_history": json.loads(session_obj.conversation_history),
        "current_topic_index": session_obj.current_topic_index,
        "turns_on_current_topic": session_obj.turns_on_current_topic,
        "pending_advance": None,  # (new_topic_index, new_turns, is_done, effective_action) awaiting spoken reply
        "is_done": False,
        "explicit_end": False,
        "violation_reason": None,
        "transcript_buffer": "",
    }

    async def persist_turn():
        async with async_session() as db_session:
            result = await db_session.execute(
                select(ConversationSession).where(ConversationSession.id == session_id)
            )
            session = result.scalar_one_or_none()
            if not session:
                return
            session.conversation_history = json.dumps(ctx["conversation_history"])
            session.current_topic_index = ctx["current_topic_index"]
            session.turns_on_current_topic = ctx["turns_on_current_topic"]
            await db_session.commit()

    async def finalize_interview():
        async with async_session() as db_session:
            result = await db_session.execute(
                select(Application).where(Application.id == application_id).options(selectinload(Application.job))
            )
            app_refresh = result.scalar_one_or_none()
            session_result = await db_session.execute(
                select(ConversationSession).where(ConversationSession.id == session_id)
            )
            session = session_result.scalar_one_or_none()
            if not app_refresh or not session:
                return None

            evaluation = await evaluate_full_conversation(
                conversation_history=ctx["conversation_history"],
                job_title=app_refresh.job.title,
                instructions=app_refresh.job.stage2_instructions,
                topics=topics,
            )
            stage_result = StageResult(
                application_id=app_refresh.id,
                stage_number=2,
                transcript=json.dumps(ctx["conversation_history"]),
                score=evaluation.get("score"),
                ai_feedback=json.dumps(evaluation),
            )
            db_session.add(stage_result)
            session.status = "completed"
            app_refresh.status = "assessment_completed"
            await db_session.commit()
            return evaluation

    async def finalize_violation(reason: str):
        async with async_session() as db_session:
            result = await db_session.execute(
                select(Application).where(Application.id == application_id)
            )
            app_refresh = result.scalar_one_or_none()
            session_result = await db_session.execute(
                select(ConversationSession).where(ConversationSession.id == session_id)
            )
            session = session_result.scalar_one_or_none()
            if not app_refresh or not session:
                return

            session.conversation_history = json.dumps(ctx["conversation_history"])
            session.status = "terminated_violation"
            app_refresh.status = "assessment_flagged"
            await log_action(
                db_session,
                application_id,
                "interview_terminated_violation",
                f"Candidate left the interview window/tab (reason: {reason}). Session ended automatically and flagged for HR review.",
                performed_by=SYSTEM_ACTOR,
            )
            await db_session.commit()

    async def handle_azure_event(event, conn) -> None:
        # Note: turn_detection.interrupt_response is false (see
        # realtime_interviewer.py), so speech_started no longer means "cancel
        # the AI's response" server-side — it fires on any detected sound,
        # including background noise, and forwarding it as a client-side
        # "interrupt" here would still cut local playback even though the
        # server keeps generating. Deliberately not forwarded.

        if event.type == "conversation.item.input_audio_transcription.completed":
            topic_label = (
                topics[min(ctx["current_topic_index"], len(topics) - 1)]["label"]
                if topics else "Complete"
            )
            ctx["conversation_history"].append({
                "role": "candidate",
                "content": event.transcript,
                "topic_label": topic_label,
            })
            await websocket.send_json({"type": "transcript", "role": "candidate", "text": event.transcript})

        elif event.type == "response.function_call_arguments.done":
            try:
                args = json.loads(event.arguments)
            except (json.JSONDecodeError, TypeError):
                args = {}
            action = args.get("action", "follow_up")
            reported_topic_index = args.get("topic_index", ctx["current_topic_index"])

            new_topic_index, new_turns, is_done, effective_action = advance_topic(
                action=action,
                reported_topic_index=reported_topic_index,
                current_topic_index=ctx["current_topic_index"],
                turns_on_current_topic=ctx["turns_on_current_topic"],
                topics=topics,
                max_turns_per_topic=settings.max_turns_per_topic,
            )
            ctx["pending_advance"] = (new_topic_index, new_turns, is_done, effective_action)

            # Refresh the session's instructions with the just-computed topic/turn
            # state (and remaining time) before the model speaks — otherwise the
            # model keeps working off the state from when the connection opened,
            # which is stale after the very first exchange.
            await conn.session.update(session=build_session_update(
                job_title, candidate_name, instructions_text, topics,
                new_topic_index, new_turns, minutes_remaining(),
            ))

            await conn.conversation.item.create(item={
                "type": "function_call_output",
                "call_id": event.call_id,
                "output": json.dumps({"ok": True}),
            })
            await conn.response.create()

        elif event.type == "response.output_audio_transcript.delta":
            ctx["transcript_buffer"] += event.delta
            await websocket.send_json({"type": "transcript_delta", "text": event.delta})

        elif event.type == "response.output_audio.delta":
            await websocket.send_json({"type": "audio_chunk", "data": event.delta, "sample_rate": 24000})

        elif event.type == "response.done":
            has_message = any(item.type == "message" for item in event.response.output)
            if not has_message:
                return  # the function-call-only response; nothing spoken yet

            ai_text = ctx["transcript_buffer"]
            ctx["transcript_buffer"] = ""

            advance = ctx["pending_advance"]
            ctx["pending_advance"] = None
            if advance is None:
                advance = (ctx["current_topic_index"], ctx["turns_on_current_topic"], False, "follow_up")

            new_topic_index, new_turns, is_done, _effective_action = advance
            ctx["current_topic_index"] = new_topic_index
            ctx["turns_on_current_topic"] = new_turns

            topic_label = topics[min(new_topic_index, len(topics) - 1)]["label"] if topics else "Complete"

            if ai_text:
                ctx["conversation_history"].append({
                    "role": "ai",
                    "content": ai_text,
                    "topic_label": topic_label,
                })
                await websocket.send_json({"type": "transcript", "role": "ai", "text": ai_text})

            await persist_turn()

            await websocket.send_json({
                "type": "audio_done",
                "topic_label": topic_label,
                "is_done": is_done,
                "dev_mode_tts": False,
            })

            if is_done:
                evaluation = await finalize_interview()
                ctx["is_done"] = True
                await websocket.send_json({
                    "type": "interview_complete",
                    "score": evaluation.get("score") if evaluation else None,
                })

        elif event.type == "error":
            logger.error(f"Realtime error event: {event.error}")
            await websocket.send_json({"type": "error", "message": getattr(event.error, "message", str(event.error))})

    async def browser_reader(conn):
        while True:
            try:
                raw = await websocket.receive_text()
            except WebSocketDisconnect:
                return
            msg = json.loads(raw)
            mtype = msg.get("type")
            if mtype == "audio":
                await conn.input_audio_buffer.append(audio=msg["data"])
            elif mtype == "skip":
                await conn.conversation.item.create(item={
                    "type": "message",
                    "role": "user",
                    "content": [{"type": "input_text", "text": "(The candidate chose to skip this question.)"}],
                })
                await conn.response.create()
            elif mtype == "end":
                ctx["explicit_end"] = True
                return
            elif mtype == "violation":
                ctx["violation_reason"] = msg.get("reason", "left_interview_window")
                return

    async def azure_reader(conn):
        async for event in conn:
            await handle_azure_event(event, conn)
            if ctx["is_done"]:
                return

    try:
        client = _realtime_client()
        async with client.realtime.connect(model=settings.realtime_deployment_name) as conn:
            await conn.session.update(session=build_session_update(
                job_title, candidate_name, instructions_text, topics,
                ctx["current_topic_index"], ctx["turns_on_current_topic"], minutes_remaining(),
            ))

            async for event in conn:
                if event.type == "session.updated":
                    break
                if event.type == "error":
                    await websocket.send_json({"type": "error", "message": str(event.error)})
                    await websocket.close()
                    return

            is_fresh_start = not ctx["conversation_history"]

            for entry in ctx["conversation_history"]:
                await conn.conversation.item.create(item={
                    "type": "message",
                    "role": "assistant" if entry["role"] == "ai" else "user",
                    "content": [{
                        "type": "output_text" if entry["role"] == "ai" else "input_text",
                        "text": entry["content"],
                    }],
                })

            browser_task = asyncio.create_task(browser_reader(conn))
            azure_task = asyncio.create_task(azure_reader(conn))

            if is_fresh_start and topics:
                # The model speaks the opening greeting itself, live, over this
                # same connection — so its voice is identical to the rest of the
                # interview instead of switching from a separately-synthesized
                # (and different-sounding) legacy TTS greeting.
                greeting_session = build_session_update(
                    job_title, candidate_name, instructions_text, topics, 0, 0, minutes_remaining(),
                )
                greeting_session["instructions"] += "\n\n" + GREETING_INSTRUCTION.format(
                    candidate_name=candidate_name,
                    first_topic_label=topics[0]["label"],
                    first_seed_question=topics[0]["seed_question"],
                )
                await conn.session.update(session=greeting_session)
                await conn.response.create()

            try:
                await asyncio.wait_for(
                    asyncio.wait({browser_task, azure_task}, return_when=asyncio.FIRST_COMPLETED),
                    # A generous buffer above the job's configured limit — the
                    # in-instructions wrap-up nudge (see minutes_remaining()) is
                    # what should end the interview gracefully; this is only the
                    # backstop for a model that ignores the nudge.
                    timeout=interview_max_seconds + 120,
                )
            except asyncio.TimeoutError:
                logger.warning(f"Realtime session {session_id} hit max duration, force-ending")
                ctx["explicit_end"] = True

            for t in (browser_task, azure_task):
                if not t.done():
                    t.cancel()
            await asyncio.gather(browser_task, azure_task, return_exceptions=True)

    except Exception as e:
        logger.error(f"Realtime WS error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        if ctx["violation_reason"] and not ctx["is_done"]:
            try:
                await finalize_violation(ctx["violation_reason"])
                await websocket.send_json({"type": "terminated_violation"})
            except Exception as e:
                logger.error(f"Finalize-on-violation failed: {e}")
        elif ctx["explicit_end"] and not ctx["is_done"]:
            try:
                evaluation = await finalize_interview()
                await websocket.send_json({
                    "type": "interview_complete",
                    "score": evaluation.get("score") if evaluation else None,
                })
            except Exception as e:
                logger.error(f"Finalize-on-end failed: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
