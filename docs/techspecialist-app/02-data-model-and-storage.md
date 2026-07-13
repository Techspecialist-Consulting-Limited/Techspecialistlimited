# Data Model and Storage

## Summary

There are **two separate databases** and **two separate file-storage systems**, and they don't talk to each other:

1. **The Python backend's own database** — the primary, authoritative store for all recruitment data (jobs, applications, screening results, interviews, HR accounts). Postgres in production, SQLite locally.
2. **Supabase (Postgres)** — used by the Next.js frontend only as a fallback, holding a `jobs` table and an `applications` table that can drift out of sync with the backend's real tables.

This split exists because the frontend was built to degrade gracefully if the backend is briefly unreachable, but it means **an application submitted during a backend outage lands in Supabase, not the backend database, and never gets AI-screened or shows up in the HR portal.** This is the single most important storage fact to know about this system — see the callout at the bottom of this document.

## 1. Primary database (Python backend)

SQLAlchemy 2.0 async ORM. Dev default `sqlite+aiosqlite:///./recruitment.db` (file: `backend/recruitment.db`); production uses `postgresql+asyncpg://...` via the `DATABASE_URL` env var. Tables are created from the ORM models on startup (`Base.metadata.create_all`); schema patches since initial deployment are applied by hand-rolled `ALTER TABLE` statements in `backend/app/migrate.py` (there is **no Alembic migration history** despite the `backend/alembic/` directory existing — it's empty; see [07-deployment-and-operations.md](07-deployment-and-operations.md)).

All tables use a UUID primary key unless noted.

### `job_postings` (model: `JobPosting`, file: `backend/app/models/job_posting.py`)
A job listing HR has created.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `title` | string | |
| `description` | text | |
| `requirements` | text | |
| `department` | string(120) | |
| `location` | string(120) | |
| `type` | string(50) | default "Full-time" |
| `screening_instructions` | text | tells the AI what to weigh when scoring CVs for this role |
| `stage2_instructions` | text | system instructions for the AI voice interviewer |
| `stage2_questions` | text | JSON-encoded list of seed questions |
| `stage2_topic_labels` | text | JSON-encoded list of topic labels for the interview |
| `status` | string(20) | default "active" |
| `is_deleted` | bool | soft-delete flag |
| `is_closed` | bool | closed to new applications, but not deleted |
| `created_at` / `updated_at` | timestamp | |

Relationship: one `JobPosting` → many `applications`.

### `applications` (model: `Application`, file: `application.py`)
One candidate's application to one job. The central record of the recruitment pipeline.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `job_id` | UUID FK → `job_postings.id` | |
| `candidate_name`, `candidate_email` | string(255) | |
| `cv_url`, `cover_letter_url` | text | storage URL (see storage section below) |
| `cv_text`, `cover_letter_text` | text, nullable | extracted plain text used for AI screening |
| `status` | string(20) | `pending`, `approved`, `rejected`, `assessment_completed`, `assessment_flagged`, `interview_scheduled` |
| `stage` | int | default 1 (1 = CV screen, 2 = AI voice interview, 3 = human interview) |
| `assessment_token` | string(255), unique, nullable | magic-link token emailed to the candidate for stage 2 |
| `assessment_sent_at`, `assessment_expires_at` | timestamp, nullable | |
| `created_at` / `updated_at` | timestamp | |

Relationships: belongs to one `JobPosting`; has one `AIScreeningResult`; has many `StageResult`; has one `ConversationSession`; has many `Interview`.

### `ai_screening_results` (model: `AIScreeningResult`, file: `ai_result.py`)
The AI's stage-1 verdict on a CV, one per application.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `application_id` | UUID FK → `applications.id` | |
| `overall_score` | float | |
| `strengths`, `concerns`, `evidence` | text, nullable | |
| `raw_response` | text, nullable | the AI's raw output, kept for auditability |
| `created_at` | timestamp | |

### `stage_results` (model: `StageResult`, file: `stage.py`)
The outcome of a completed stage-2 AI voice interview session.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `application_id` | UUID FK | |
| `stage_number` | int | |
| `status` | string(20) | default "pending" |
| `audio_url` | text, nullable | |
| `transcript` | text, nullable | JSON-encoded conversation |
| `score` | float, nullable | |
| `ai_feedback` | text, nullable | JSON-encoded multi-dimension evaluation (communication, technical competency, confidence, problem-solving, relevance) |
| `created_at` / `updated_at` | timestamp | |

### `conversation_sessions` (model: `ConversationSession`, file: `conversation.py`)
The **live, in-progress** state of an AI voice interview — not the final result (that's `stage_results`).

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `application_id` | UUID FK | |
| `status` | text | default "in_progress"; also `completed`, `terminated_violation` |
| `conversation_history` | text | JSON list of `{role, content, topic_label}` |
| `current_topic_index`, `turns_on_current_topic` | int | interview state-machine bookkeeping |
| `topics` | text | JSON list of `{label, seed_question}`, copied from the job's `stage2_topic_labels`/`stage2_questions` at session start |
| `engine` | text | `"legacy"` (HTTP/WebSocket, Whisper+GPT-4o+TTS pipeline) or `"realtime"` (Azure OpenAI Realtime API, voice-to-voice) |
| `created_at` / `updated_at` | timestamp | |

### `interviews` (model: `Interview`, file: `interview.py`)
A **human-scheduled** final interview (stage 3) — distinct from the AI voice interview.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `application_id` | UUID FK | |
| `interview_type` | string(20) | `physical` or `virtual` |
| `scheduled_date`, `scheduled_time` | string | |
| `duration_minutes` | int | default 60 |
| `location`, `meeting_link`, `interviewer_name`, `notes` | nullable | |
| `status` | string(20) | default "scheduled" |
| `created_at` / `updated_at` | timestamp | |

### `audit_logs` (model: `AuditLog`, file: `audit_log.py`)
Compliance/history trail — every meaningful action taken on an application.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `application_id` | UUID, indexed (not a formal FK) | |
| `action` | string(50) | e.g. `assessment_approved`, `rejected`, `interview_scheduled`, `interview_terminated_violation`, `application_cleared` |
| `detail` | text, nullable | |
| `performed_by` | string(255), nullable | |
| `created_at` | timestamp | |

### `hr_users` (model: `HrUser`, file: `hr_user.py`)
HR staff accounts — this backend has its own login system, entirely separate from Supabase.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | string(255), unique | |
| `name` | string(255) | |
| `password_hash` | string(255) | bcrypt |
| `is_active` | bool | default true |
| `reset_token_hash`, `reset_token_expires_at` | nullable | forgot-password / invite-a-new-user flow |
| `created_at` / `updated_at` | timestamp | |

### `app_settings` (model: `AppSetting`, file: `app_setting.py`)
Runtime-editable key/value store for HR-configurable branding, overlaid onto the app's in-memory settings at startup and whenever HR edits `/hr/settings`.

| Field | Type | Notes |
|---|---|---|
| `key` | string(100) PK | `company_name`, `brand_color`, `logo_url`, `sender_display_name`, `hr_notification_email` |
| `value` | text | |
| `updated_at` | timestamp | |

### `ai_readiness_assessments` (model: `AiReadinessAssessment`, file: `ai_readiness_assessment.py`)
Lead-magnet quiz submissions. **Unrelated to the recruitment tables above** — no foreign keys connect them.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | string(255), indexed | |
| `company_name` | string(255) | default "Not provided" |
| `scores` | text | JSON dict, per-pillar scores |
| `total_score` | float | |
| `max_score` | float | default 75 |
| `level` | string(50) | e.g. "AI Explorer", "AI Builder", "AI Accelerator", "AI Leader" |
| `followed_up` | bool | default false — toggled from `/admin/assessments` |
| `created_at` | timestamp | |

## 2. Supabase (fallback database, used by the Next.js frontend)

Client: `src/lib/supabase.ts`, using the **anon key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) — no service-role key is used anywhere in the frontend. Only two tables are touched from `src/`:

- **`jobs`** — read by `/careers`, `/careers/[id]`, `/apply`, and `GET /api/recruitment/jobs`, as a fallback when the backend's `GET /api/jobs` fails. Also written by the HR jobs API fallback (`src/app/api/recruitment/hr/jobs/route.ts`) when the backend is unreachable.
- **`applications`** — written by the legacy `POST /api/apply` route and by `POST /api/recruitment/applications`'s fallback path, when the backend is unreachable.

**These are not guaranteed to have the same schema as the backend's `job_postings`/`applications` tables** — they were built independently as a resilience fallback, not as a replica. Nothing in this repository keeps them in sync. Treat any data that ends up here (rather than in the backend's own database) as a case that needs manual reconciliation.

### Supabase Storage

One bucket, **`applications`**, holding:
- `resumes/<uuid>.<ext>` — candidate CVs uploaded via the fallback path
- `cover-letters/<uuid>.<ext>` — candidate cover letters uploaded via the fallback path

## 3. Backend file storage (CVs, interview audio)

Independent of Supabase Storage. Controlled by `backend/app/services/storage.py`:

- **Local dev / no Azure Storage configured:** files are written to `backend/storage/<container>/` on local disk, referenced in the database as a `file://<path>` URL. Confirmed present: `backend/storage/cvs/` (candidate CV/cover-letter text extracts, UUID-named `.txt` files).
- **Production (Azure Storage connection string configured):** files go to Azure Blob Storage, in containers named by `cvs_container_name` (default `cvs`) and `assessments_container_name` (for interview-answer audio).

## The two-database problem — read this before changing anything

Because the Next.js frontend has an independent Supabase fallback for `jobs` and `applications`, **the backend's Postgres/SQLite database is not guaranteed to be the single source of truth** for those two entities. Concretely:

- A job created via `/hr/jobs/create` while the backend is reachable goes into the backend's `job_postings` table (correct, full-featured).
- A job listed on `/careers` when the backend happens to be down for that one request is read from Supabase's `jobs` table instead — which may be stale or missing rows the backend has.
- An application submitted while the backend is down goes into Supabase's `applications` table, **skips AI screening entirely**, and will not appear anywhere in the HR portal (which only reads from the backend database) until someone notices and manually moves it over.

If you're troubleshooting "a candidate says they applied but HR can't see them," check Supabase's `applications` table, not just the backend database. This is documented further in [06-security-and-known-gaps.md](06-security-and-known-gaps.md).
