# AI Voice Interview (Stage 2)

## What it does

Once HR approves a candidate past the CV screen, the candidate gets an emailed magic link to a short AI-conducted voice interview: the AI asks questions on a set of topics, listens to spoken answers, and produces a scorecard.

## Two engines exist — know which one is active

| | Legacy engine | Realtime engine |
|---|---|---|
| Mechanism | Candidate speaks → Whisper transcribes → GPT-4o decides the next turn → Azure TTS speaks the reply. Turn-based. | Azure OpenAI **Realtime API** — true voice-to-voice, bidirectional streaming over WebSocket. |
| Backend router | `backend/app/routers/assessment.py` (HTTP) and `assessment_ws.py` (WebSocket variant, per-sentence streamed TTS) | `backend/app/routers/assessment_realtime_ws.py` |
| Frontend component | `LegacyAssessmentPortal.tsx` | `RealtimeAssessmentPortal.tsx` |
| Feature flag | Always available | Gated by backend config `realtime_interview_enabled` |
| `conversation_sessions.engine` value | `"legacy"` | `"realtime"` |

`src/app/assessment/[token]/page.tsx` (`AssessmentPortalSwitcher`) fetches session metadata from `GET /api/recruitment/assessment/[token]` and picks the engine based on what the backend reports.

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
5. On completion, `backend/app/services/conversation.py`'s `evaluate_full_conversation()` (legacy) or the realtime engine's equivalent produces a multi-dimension score (communication, technical competency, confidence, problem-solving, relevance, per-topic breakdown, recommendation), written to a new `StageResult` row.
6. The interview auto-finalizes if it hits `realtime_max_session_seconds` (realtime engine) without an explicit end.

## Where to make changes

| Change | File |
|---|---|
| Interview state machine (topic advance rules) | `backend/app/services/realtime_interviewer.py` (`advance_topic()`) — has a real unit test, change it with matching test updates |
| Legacy engine conversation logic / prompts | `backend/app/services/conversation.py` |
| Realtime engine session config, system instructions, prompt-injection defenses | `backend/app/services/realtime_interviewer.py` |
| Speech-to-text | `backend/app/services/audio_evaluation.py` (`transcribe_audio`) |
| Text-to-speech | `backend/app/services/tts.py` |
| Per-job interview topics/questions | `job_postings.stage2_topic_labels` / `stage2_questions`, editable from `/hr/jobs/create` |
| Interview timing limits | backend config: `topic_time_limit_seconds`, `max_turns_per_topic`, `realtime_max_session_seconds` |

## Things worth knowing

- The realtime engine's system instructions explicitly include prompt-injection/jailbreak defenses (`realtime_interviewer.py`) — worth reviewing before changing that prompt, since it's the one place actively defending against a candidate trying to manipulate the interviewer.
- `audio_evaluation.py`'s standalone `evaluate_transcript()` function appears to be legacy/unused — current routers call `conversation.py`'s full-conversation evaluator instead. Confirm before relying on it.
- Interview audio is uploaded to the `assessments` storage container (Azure Blob in prod, local disk in dev) — uploads appear to be best-effort/non-fatal if they fail, so don't assume every session has a recoverable audio file.
