# Configuration and Integrations

## Summary

The system depends on roughly a dozen third-party services split across the frontend and backend: Supabase, Azure OpenAI (four different capabilities), Azure Blob Storage, Resend, Anthropic, Groq, and EmailJS. Every credential is environment-variable-driven except EmailJS's, which are hardcoded in source. This document lists every variable, what it's for, and where it's read — **values are intentionally not reproduced here**; find them in each environment's actual `.env` file or secrets manager.

## Frontend environment variables (`.env.local`, or platform secrets in production)

| Variable | Purpose | Read in |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `src/lib/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key — no service-role key is used | `src/lib/supabase.ts` |
| `RECRUITMENT_API_URL` | Base URL of the Python backend (default `http://localhost:8000`) | `src/app/api/recruitment/proxy.ts` and all recruitment API routes |
| `RECRUITMENT_API_KEY` / `API_KEY` | Shared secret sent as `x-api-key` when proxying the public application-submit call | `src/app/api/recruitment/applications/route.ts` |
| `HR_EMAIL`, `HR_PASSWORD` | **Fallback** HR login credentials used only if the backend is unreachable during login (see [06-security-and-known-gaps.md](06-security-and-known-gaps.md)) | `src/app/api/recruitment/hr/auth/route.ts` |
| `JWT_SECRET` | Used only by the fallback token-minting path above — not real HMAC signing, string concatenation only | same file |
| `GROQ_API_KEY` | Fallback AI provider for AI Readiness report generation | `src/lib/ai-report.ts` |
| `ANTHROPIC_API_KEY` | Primary AI provider for AI Readiness report generation (Claude) | `src/lib/ai-report.ts` |
| `RESEND_API_KEY` | Sends the AI Readiness PDF report email | `src/app/api/assessment/send-report/route.ts` |
| `NEXT_PUBLIC_ASSESSMENT_WS_URL` | WebSocket URL for the AI voice-interview portals (default `ws://localhost:8000`) | `RealtimeAssessmentPortal.tsx`, `LegacyAssessmentPortal.tsx` |

Present in `.env.local` but **not referenced anywhere in `src/`** — confirmed dead/unused:
- `ADMIN_SECRET_TOKEN` — appears to be a vestige of a planned-but-never-implemented `/admin` auth check. If you're asked "is `/admin/assessments` protected by this token," the answer is no — see [06-security-and-known-gaps.md](06-security-and-known-gaps.md).
- `VERCEL_OIDC_TOKEN` — Vercel-platform-injected, unrelated to app code.

**Not environment-driven:** `src/lib/emailjs.ts` hardcodes its public key, service ID, and template ID as string literals rather than reading them from env vars. This is lower-risk than it sounds (EmailJS's "public key" is designed to be exposed client-side), but it does mean rotating these values requires a code change, not a config change.

## Backend environment variables (`backend/.env`, documented with placeholders in `backend/.env.example`)

Defined in `backend/app/config.py` (Pydantic settings, loaded from `.env`).

| Group | Variables | Purpose |
|---|---|---|
| App | `app_name`, `cors_origins`, `dev_mode` | `dev_mode` toggles local-disk storage, console-logged emails, and silent TTS instead of hitting real Azure endpoints |
| Database | `database_url` | Postgres in prod, SQLite locally |
| Azure OpenAI — chat | `azure_openai_endpoint`, `azure_openai_key`, `azure_openai_api_version`, `gpt4o_deployment_name` | Powers CV screening and the "legacy" interview engine's conversation logic |
| Azure OpenAI — Whisper | `azure_whisper_endpoint`, `azure_whisper_key`, `azure_whisper_api_version`, `whisper_deployment_name` | Speech-to-text for the legacy voice interview engine |
| Azure OpenAI — TTS | `azure_tts_endpoint`, `azure_tts_key`, `azure_tts_api_version`, `tts_deployment_name`, `tts_voice` | Text-to-speech for the legacy voice interview engine |
| Azure OpenAI — Realtime | `azure_realtime_endpoint`, `azure_realtime_key`, `realtime_deployment_name`, `realtime_voice`, `realtime_vad_threshold`, `realtime_vad_prefix_padding_ms`, `realtime_vad_silence_duration_ms`, `realtime_max_session_seconds`, `realtime_interview_enabled` | Voice-to-voice interview engine (newer, feature-flagged by `realtime_interview_enabled`) |
| Interview tuning | `topic_time_limit_seconds`, `max_turns_per_topic` | Shared by both interview engines' state machines |
| Redis | `redis_url` | **Declared but unused** — see [07-deployment-and-operations.md](07-deployment-and-operations.md); no Celery task or worker process actually exists |
| Storage | `azure_storage_connection_string`, `cvs_container_name`, `assessments_container_name` | Azure Blob Storage; falls back to local disk if unset |
| Branding | `company_name`, `brand_color`, `logo_url` | Defaults, overridden at runtime by the `app_settings` DB table |
| Email | `resend_api_key`, `sender_email`, `sender_display_name`, `hr_notification_email` | All recruitment transactional email |
| Auth | `api_key`, `jwt_secret`, `hr_password` | `api_key` gates the public application-submit endpoint; `jwt_secret` signs real HR login JWTs (HS256); `hr_password` seeds the default HR account on first run |
| Frontend | `frontend_url` | Used to build links in outgoing emails (e.g. "review this candidate" links) |

## Third-party services — what each one is for

| Service | Used by | Purpose |
|---|---|---|
| **Supabase** | Frontend | Fallback datastore for `jobs`/`applications` (see [02-data-model-and-storage.md](02-data-model-and-storage.md)); anon key only, no auth usage |
| **Azure OpenAI (GPT-4o)** | Backend | CV screening scoring, legacy interview conversation logic |
| **Azure OpenAI (Whisper)** | Backend | Speech-to-text for the legacy voice interview |
| **Azure OpenAI (TTS)** | Backend | Text-to-speech for the legacy voice interview |
| **Azure OpenAI (Realtime API)** | Backend | Voice-to-voice AI interview engine (the newer of the two interview engines) |
| **Azure Blob Storage** | Backend | Production file storage for CVs and interview audio |
| **Resend** | Both | Backend: all recruitment transactional email (approvals, rejections, invites, password resets). Frontend: AI Readiness Assessment PDF report delivery |
| **Anthropic (Claude)** | Frontend | Primary generator of AI Readiness Assessment report content (model: `claude-sonnet-4-6`, structured JSON output) |
| **Groq** | Frontend | Fallback generator for the same report if Anthropic isn't configured (model: `llama-3.3-70b-versatile`) |
| **EmailJS** | Frontend | Client-side-only marketing lead notifications (discovery call requests, AI Readiness quiz leads) — does not touch the backend at all |

Two separate AI systems are in play and are easy to conflate: **Azure OpenAI** does all recruitment AI work (screening, interviews); **Anthropic/Groq** only generate the AI Readiness Assessment's marketing report. They share no code path.

## Auth secrets — where they live and what they protect

See [06-security-and-known-gaps.md](06-security-and-known-gaps.md) for the full picture, but as a configuration reference:

- Backend HR JWTs are signed with `jwt_secret` (backend env) — this is the **real** auth mechanism.
- The frontend's `JWT_SECRET`/`HR_EMAIL`/`HR_PASSWORD` are a **separate, weaker fallback** that only activates if the frontend can't reach the backend during login. Keep these two sets of credentials in sync deliberately if you rotate one — they are not the same secret and rotating only one will not fully lock out the fallback path.
