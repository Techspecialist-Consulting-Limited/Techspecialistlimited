# API Reference

## How to read this

The frontend (`src/app/api/**`) and backend (`backend/app/routers/**`) each expose their own routes. Almost every frontend recruitment route is a thin proxy to a backend route via `proxyToBackend()` (`src/app/api/recruitment/proxy.ts`), forwarding the `Authorization` header and any body/query params as-is. Where a frontend route also has a Supabase fallback, it's noted — those fallbacks are the ones without a backend-equivalent auth check (see [06-security-and-known-gaps.md](06-security-and-known-gaps.md)).

Auth column values: **none** (public), **api-key** (`x-api-key` shared secret), **HR JWT** (backend `verify_hr_token`), **token** (candidate magic-link token).

## Frontend routes (`src/app/api/**`)

| Route | Backend target | Fallback | Auth (as enforced) |
|---|---|---|---|
| `POST /api/apply` | — (legacy, Supabase-only) | n/a — this *is* the fallback | none |
| `GET/PATCH/DELETE /api/admin/assessments` | `/api/ai-readiness/results[/{id}]` | none | **none** |
| `POST /api/assessment` | `/api/ai-readiness/submit` | none | none |
| `POST /api/assessment/send-report` | — (calls Anthropic/Groq + Resend directly) | none | none |
| `GET/POST /api/recruitment/jobs`, `GET /api/recruitment/jobs/[jobId]` | `/api/jobs[/{id}]` | Supabase `jobs` (GET only) | none |
| `POST /api/recruitment/applications` | `/api/applications` | Supabase `applications` insert + storage upload | api-key (backend only; **fallback has none**) |
| `GET/POST /api/recruitment/assessment/[token]` | `/api/assessment/{token}[/{action}]` | none | token |
| `POST /api/recruitment/hr/auth` | `/api/auth/login` | hardcoded `HR_EMAIL`/`HR_PASSWORD` check | none (this route *issues* the JWT) |
| `POST /api/recruitment/hr/auth/change-password` | `/api/auth/change-password` | none | HR JWT |
| `POST /api/recruitment/hr/auth/forgot-password` | `/api/auth/forgot-password` | none | none (by design — must work pre-login) |
| `POST /api/recruitment/hr/auth/reset-password` | `/api/auth/reset-password` | none | reset token |
| `GET/POST /api/recruitment/hr/jobs`, `GET/PUT /api/recruitment/hr/jobs/[jobId]` | `/api/jobs` (POST/PUT) | Supabase `jobs` read/write | HR JWT (backend only; **fallback has none**) |
| `PUT /api/recruitment/hr/jobs/[jobId]/soft-delete`, `/restore` | `/api/jobs/{id}/soft-delete`, `/restore` | none | HR JWT |
| `GET /api/recruitment/hr/jobs/history` | `/api/jobs/history` | none | HR JWT |
| `GET /api/recruitment/hr/applications/[jobId]` | `/api/hr/applications/{job_id}` | none | HR JWT |
| `GET /api/recruitment/hr/applicants/[applicationId]` | `/api/hr/applications/detail/{id}` | none | HR JWT |
| `GET /api/recruitment/hr/applicants/[applicationId]/document` | `/api/hr/applications/{id}/document` | none | HR JWT |
| `POST /api/recruitment/hr/review/[applicationId]` | `/api/hr/review/{id}` | none | HR JWT |
| `POST /api/recruitment/hr/approve/[applicationId]` | `/api/hr/approve/{id}` | none | HR JWT |
| `POST /api/recruitment/hr/resend/[applicationId]` | `/api/hr/resend/{id}` | none | HR JWT |
| `POST /api/recruitment/hr/clear/[jobId]` | `/api/hr/clear/{job_id}` | none | HR JWT |
| `GET /api/recruitment/hr/audit-logs/[applicationId]` | `/api/hr/audit-logs/{id}` | none | HR JWT |
| `GET /api/recruitment/hr/stats` | `/api/hr/stats` | none | HR JWT |
| `GET /api/recruitment/hr/analytics/{overview,interviews,pipeline,time-to-hire,trends}` | `/api/hr/analytics/*` | none | HR JWT |
| `GET/POST /api/recruitment/hr/interviews`, `GET/PUT /api/recruitment/hr/interviews/[interviewId]` | `/api/hr/interviews[/{id}]` | none | HR JWT |
| `GET /api/recruitment/hr/interviews/{all,upcoming}` | `/api/hr/interviews/{all,upcoming}` | none | HR JWT |
| `GET /api/recruitment/hr/interviews/by-application/[applicationId]` | `/api/hr/interviews/by-application/{id}` | none | HR JWT |
| `GET/PUT/POST /api/recruitment/hr/settings` | `/api/hr/settings` | none | HR JWT |
| `GET/POST /api/recruitment/hr/users`, `PATCH/DELETE /api/recruitment/hr/users/[userId]` | `/api/hr/users[/{id}]` | none | HR JWT |

## Backend routes (`backend/app/routers/**`)

### `jobs.py` — prefix `/api/jobs`
- `POST /api/jobs` — create a job posting (HR JWT)
- `GET /api/jobs` — list jobs (public; `show_all`/`deleted` query flags)
- `GET /api/jobs/history` — soft-deleted jobs (public)
- `GET /api/jobs/{job_id}` — one job + applicant count (public)
- `PUT /api/jobs/{job_id}` — update status/department/location/type/is_closed (HR JWT)
- `PUT /api/jobs/{job_id}/soft-delete` / `/restore` (HR JWT)

### `applications.py` — prefix `/api/applications`
- `POST /api/applications` — candidate submits (multipart: job_id, name, email, cv, optional cover letter; requires `x-api-key`)
- `GET /api/applications/{application_id}` — fetch one (public)

### `hr_review.py` — prefix `/api/hr`
- `GET /api/hr/stats` — dashboard counts (HR JWT)
- `GET /api/hr/applications/{job_id}` — applicants for a job, sorted by score (HR JWT)
- `GET /api/hr/applications/detail/{application_id}` — full applicant detail (HR JWT)
- `POST /api/hr/approve/{application_id}` — advance stage, send assessment invite (HR JWT)
- `POST /api/hr/review/{application_id}` — approve or reject (HR JWT)
- `POST /api/hr/resend/{application_id}` — regenerate/resend assessment link (HR JWT)
- `POST /api/hr/clear/{job_id}` — bulk-delete a job's applications and related rows (HR JWT)
- `GET /api/hr/applications/{application_id}/document` — stream CV/cover letter (HR JWT)
- `GET /api/hr/audit-logs/{application_id}` — audit trail (HR JWT)

### `analytics.py` — prefix `/api/hr/analytics` (all HR JWT)
- `GET /overview`, `/interviews`, `/pipeline`, `/time-to-hire`, `/trends`

### `interviews.py` — prefix `/api/hr/interviews` (stage-3 human interviews, all HR JWT)
- `POST /` — schedule, sends invitation email, logs audit
- `GET /by-application/{application_id}`, `/upcoming`, `/all`
- `PUT /{interview_id}` — update, logs audit

### `assessment.py` — prefix `/api/assessment` (legacy HTTP engine, token auth)
- `GET /{token}` — session metadata (410 if expired)
- `POST /{token}/start` — begin/resume, returns streamed TTS audio
- `POST /{token}/respond` — candidate audio in, transcribe → next AI turn → streamed TTS reply
- `POST /{token}/end` — force-end and score

### `assessment_ws.py` — prefix `/api/assessment` (legacy engine, WebSocket)
- `WS /{token}/ws` — bidirectional streaming audio, per-sentence TTS

### `assessment_realtime_ws.py` — prefix `/api/assessment` (Realtime engine)
- `WS /{token}/realtime-ws` — live voice-to-voice proxy to Azure OpenAI Realtime API, gated by `realtime_interview_enabled`

### `auth.py` — prefix `/api/auth` (HR login)
- `POST /login` — returns JWT (HS256, 8h)
- `POST /forgot-password` — always returns a generic success message (avoids user enumeration)
- `POST /reset-password` — consumes reset token
- `POST /change-password` (HR JWT)

### `hr_settings.py` — prefix `/api/hr`
- `GET/PUT /settings` — branding/notification config (HR JWT)
- `GET/POST /users` — list / invite HR accounts (HR JWT)
- `PATCH/DELETE /users/{user_id}` — activate/deactivate/delete, blocks removing the last active account (HR JWT)

### `ai_readiness.py` — prefix `/api/ai-readiness` (**no auth on any of these**)
- `POST /submit` — public quiz submission
- `GET /results` — list all submissions
- `PATCH /results/{assessment_id}` — mark followed up
- `DELETE /results/{assessment_id}`

### Misc
- `GET /health` — liveness check, returns `{"status": "ok"}`
