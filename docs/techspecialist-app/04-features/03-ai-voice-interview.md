# AI Voice Interview (Stage 2)

## What it does

Once HR approves a candidate past the CV screen (or auto-advance does it for them — see below), the candidate gets an emailed magic link to a short AI-conducted voice interview: the AI asks questions on a set of topics, listens to spoken answers, and produces a scorecard.

## Two engines exist — the realtime engine is what candidates actually get

| | Realtime engine (primary) | Legacy engine (kept for rollback) |
|---|---|---|
| Mechanism | Azure OpenAI **Realtime API** (`gpt-realtime`) — true voice-to-voice, one persistent bidirectional WebSocket connection held open for the whole interview. | Candidate speaks → Whisper transcribes → GPT-4o decides the next turn → Azure TTS speaks the reply. Turn-based, three sequential API calls per turn. |
| Backend router | `backend/app/routers/assessment_realtime_ws.py` | `backend/app/routers/assessment.py` (HTTP) and `assessment_ws.py` (WebSocket variant, per-sentence streamed TTS) |
| Frontend component | `RealtimeAssessmentPortal.tsx` | `LegacyAssessmentPortal.tsx` |
| Feature flag | `realtime_interview_enabled` — **set to `True` in both local and production config**; this is not an experimental toggle, it's what's actually live | n/a — always reachable directly at `/api/assessment/{token}/ws`, but not what the flag routes candidates to |
| `conversation_sessions.engine` value | `"realtime"` | `"legacy"` |

`src/app/assessment/[token]/page.tsx` (`AssessmentPortalSwitcher`) fetches session metadata from `GET /api/recruitment/assessment/[token]` (which now also returns `interview_max_minutes`) and picks the engine based on what the backend reports. The legacy engine's code is deliberately left in place, untouched, as a fast rollback path if the realtime engine ever needs to be turned off — flip `realtime_interview_enabled` to `False` and restart, no code change needed.

## The realtime engine, in detail

### Turn detection: semantic VAD, not raw volume

Session config (`backend/app/services/realtime_interviewer.py`'s `build_session_update()`) sets:
- `turn_detection: {"type": "semantic_vad", "eagerness": settings.realtime_vad_eagerness}` — a model-based turn detector that judges whether the candidate has actually *finished their thought*, not just gone quiet. `eagerness: "low"` (the configured default) waits up to ~8 seconds before assuming they're done, so pauses like "let me think... okay, so..." don't get chopped into multiple fake "turns." This replaced a first version that used amplitude-based `server_vad` with a fixed 500ms silence timeout, which was too eager to interrupt candidates mid-thought and too sensitive to quiet non-speech sounds (a throat-clear was enough to trigger `speech_started` and cut the AI off).
- `noise_reduction: {"type": settings.realtime_noise_reduction_type}` — filters ambient audio (room noise, keyboard clicks) *before* it reaches VAD, further reducing false triggers. Default `far_field` (tuned for laptop/room microphones, since headphones aren't guaranteed even though they're recommended in the pre-interview setup screen).

### Session instructions are refreshed every turn

The model's system instructions (current topic index, turns-on-topic, time remaining) are re-sent via `conn.session.update(...)` **every turn** — specifically, right before the second `response.create()` call that produces the spoken reply (see "why two model responses per turn" below). This matters because a Realtime API session's instructions are otherwise sticky: sent once at connection time and never refreshed unless you explicitly do it again. An earlier version of this code only sent it once at connect, so the model was working from stale topic/turn state after the very first exchange — a real bug, now fixed.

### Why every candidate turn triggers two model responses

The interviewer is instructed to call a function tool (`advance_interview`, in `realtime_interviewer.py`) recording its decision (follow-up / next-topic / end-interview) *before* speaking its reply. The Realtime API's function-calling flow requires this to happen as two separate `response.create()` calls: one response containing only the function call, then (after the backend submits the function's output) a second response containing the actual spoken reply. This is inherent to how tool calls work in the API (mirrors standard chat-completions tool-call semantics) — it's not a bug, but it is real, unavoidable added latency per turn worth knowing about if the interview ever feels laggy.

### Graceful time-based wrap-up, not a silent cutoff

Each job has a configurable `interview_max_minutes` (default 20, set on `/hr/jobs/create`). As that soft limit approaches (`minutes_remaining <= 2`), the refreshed session instructions include a `WRAP_UP_NOTICE` telling the model to stop starting new topics, thank the candidate, and call `end_interview` — so the interview ends with an actual spoken closing statement instead of the connection just dying mid-question. A separate, backend-wide **hard safety cap** (`realtime_max_session_seconds`, default 2700s = 45 min) still exists underneath in case a model ignores the nudge; it force-ends the session via `asyncio.wait_for(...)` timing out, with no closing statement, as a last resort.

### The completion screen waits for the AI to actually finish talking

The frontend used to flip to the "Interview Ended" screen on a flat 1.5-second guessed delay after the final `audio_done` event — which cut off the AI's closing statement mid-sentence whenever it ran longer than that. It now computes the actual remaining scheduled-audio-buffer duration (`nextStartTimeRef` vs. `AudioContext.currentTime`) and only shows the completed screen once **both** the closing audio has genuinely finished playing **and** the final score has arrived from the backend (`maybeFinishInterview()` in `RealtimeAssessmentPortal.tsx`, gated on `audioFinishedRef` + `finalScoreReceivedRef`). A candidate clicking "End Interview" themselves skips the audio-wait (there's no closing statement to wait for in that path).

### Live captions track the audio, not just the final text block

`response.output_audio_transcript.delta` events are forwarded to the frontend as `transcript_delta` messages and appended to the on-screen caption as they arrive, instead of the frontend only receiving one full text block after the entire reply finished generating (which visibly desynced from the audio that had already started playing). The final `transcript` message (sent at `response.done`) still arrives as a resync safety net in case any deltas were dropped.

### Candidate-facing countdown timer

The "conversing" screen's top bar shows a live `mm:ss` countdown against the job's `interview_max_minutes`, turning amber under 2 minutes remaining. Purely informational — the actual enforcement is server-side (the wrap-up nudge and hard cap above).

## Walkthrough (both engines, conceptually)

1. Candidate opens the emailed link: `/assessment/{token}`. The token is `Application.assessment_token`, a `secrets.token_urlsafe(32)` string — the sole credential for this flow, no login. It can expire (`assessment_expires_at`); an expired link returns HTTP 410 and the candidate sees an "expired" state.
2. A `ConversationSession` row is created (or resumed), seeded with `topics` copied from the job's `stage2_topic_labels`/`stage2_questions`.
3. The interview proceeds topic-by-topic. State machine rules (verified by `backend/tests/test_realtime_advance_topic.py`, the one real unit test in the backend):
   - A "follow-up" response stays on the current topic.
   - "Next topic" advances and resets the turn counter.
   - Hitting `max_turns_per_topic` forces a topic advance even if the model wanted a follow-up.
   - Advancing past the last topic marks the interview done.
   - An explicit "end interview" signal always ends it, regardless of topic position.
4. **Violation detection** (realtime engine only): if the candidate appears to leave the browser tab mid-interview, the session is flagged, the application status becomes `assessment_flagged`, and an audit log entry is written.
5. On completion, `backend/app/services/conversation.py`'s `evaluate_full_conversation()` (shared by both engines) produces a multi-dimension score (communication, technical competency, confidence, problem-solving, relevance, per-topic breakdown, recommendation), written to a new `StageResult` row. This is also what powers the HR dashboard's "Pending Team Decisions" AI-summary widget — see [04-hr-portal.md](04-hr-portal.md).
6. The interview auto-finalizes gracefully as `interview_max_minutes` approaches (realtime engine), with `realtime_max_session_seconds` as the hard backstop if the graceful path is ever skipped.

## Two ways a candidate reaches stage 2

- **Manual HR approval** (default): HR reviews the CV screening result and clicks approve.
- **Auto-advance** (opt-in per job, configured on `/hr/jobs/create`): if `job_postings.auto_advance_enabled` is true and the candidate's CV screening score meets `auto_advance_pass_mark`, the stage-2 invite is scheduled automatically via a FastAPI `BackgroundTasks` job (`_auto_advance_after_delay` in `backend/app/routers/applications.py`), sent after `auto_advance_delay_minutes` (default 5) — giving HR a window to intervene manually first. The background task re-checks the application is still `pending` before acting, so a manual HR decision made during the delay window wins.

## Where to make changes

| Change | File |
|---|---|
| Interview state machine (topic advance rules) | `backend/app/services/realtime_interviewer.py` (`advance_topic()`) — has a real unit test, change it with matching test updates |
| Realtime engine session config, turn detection, wrap-up nudge, system instructions, prompt-injection defenses | `backend/app/services/realtime_interviewer.py` |
| Realtime WebSocket proxy / event handling / timing enforcement | `backend/app/routers/assessment_realtime_ws.py` |
| Legacy engine conversation logic / prompts | `backend/app/services/conversation.py` |
| Speech-to-text (legacy engine only — realtime does STT natively) | `backend/app/services/audio_evaluation.py` (`transcribe_audio`) |
| Text-to-speech (legacy engine only — realtime does TTS natively) | `backend/app/services/tts.py` |
| Per-job interview topics/questions | `job_postings.stage2_topic_labels` / `stage2_questions`, editable from `/hr/jobs/create` |
| Per-job interview timing | `job_postings.interview_max_minutes`, editable from `/hr/jobs/create` |
| Auto-advance config | `job_postings.auto_advance_enabled` / `auto_advance_pass_mark` / `auto_advance_delay_minutes`, editable from `/hr/jobs/create` |
| Global interview timing/tuning | backend config: `topic_time_limit_seconds`, `max_turns_per_topic`, `realtime_max_session_seconds`, `realtime_vad_eagerness`, `realtime_noise_reduction_type` |
| Live caption sync, completion timing, countdown timer | `src/app/assessment/[token]/RealtimeAssessmentPortal.tsx` |

## Things worth knowing

- The realtime engine's system instructions explicitly include prompt-injection/jailbreak defenses (`realtime_interviewer.py`) — worth reviewing before changing that prompt, since it's the one place actively defending against a candidate trying to manipulate the interviewer.
- `audio_evaluation.py`'s standalone `evaluate_transcript()` function appears to be legacy/unused — current routers call `conversation.py`'s full-conversation evaluator instead. Confirm before relying on it.
- Interview audio is uploaded to the `assessments` storage container (Azure Blob in prod, local disk in dev) — uploads appear to be best-effort/non-fatal if they fail, so don't assume every session has a recoverable audio file.
- Two full model responses per candidate turn (function-call, then spoken reply) is a known, real latency cost inherent to the current function-calling design — if the interview ever needs to feel snappier than it does today, decoupling the topic-bookkeeping decision from the blocking tool call (e.g. making it a non-blocking background classification instead of a pre-reply gate) is the next lever, not something already done.
