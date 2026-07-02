# Recruitment Automation Platform — Implementation Summary

## Architecture

```
Frontend (Next.js 15, React 19, Tailwind CSS 4, TypeScript)
  Port 3000
  API proxy: /api/recruitment/* -> http://localhost:8000/api/*
  Auth: JWT in localStorage (hr_token)

Backend (FastAPI, Python 3.14, SQLAlchemy async, SQLite)
  Port 8000
  Auth: JWT via Bearer token, verified by verify_hr_token dependency
  DB: SQLite file in backend/ (auto-created by SQLAlchemy)
  Email: prints to console in dev mode (settings.dev_mode = True)
  File storage: file:///path in dev mode (storage/ directory)
```

## Files Created/Modified Across All Phases

### Phase 1 — Email Branding, Link Expiration, Assessment Config

| File | Type | Purpose |
|------|------|---------|
| `backend/app/config.py` | Modified | Added `company_name`, `brand_color`, `logo_url`, `sender_display_name` |
| `backend/app/services/email_service.py` | Modified | Branded HTML templates (logo, colors, footer); `send_stage2_invitation_email()`, `send_expired_link_notification()`, `send_interview_invitation_email()` |
| `backend/app/models/application.py` | Modified | Added `assessment_sent_at`, `assessment_expires_at` columns |
| `backend/app/routers/hr_review.py` | Modified | `review`/`approve` endpoints accept `expiration_days`; new standalone `POST /api/hr/approve/{id}` and `POST /api/hr/resend/{id}` endpoints |
| `backend/app/routers/assessment.py` | Modified | All endpoints check `assessment_expires_at` and return HTTP 410 if expired |
| `src/app/assessment/[token]/page.tsx` | Modified | Handles `expired` state with dedicated UI |
| `src/app/hr/applicants/[applicationId]/page.tsx` | Modified | Expiration period selector (3d/5d/1w/2w/30d), assessment status card, resend/send-new buttons, success banner |

### Phase 2 — Enhanced Scorecard, Timeline, Analytics

| File | Type | Purpose |
|------|------|---------|
| `backend/app/services/conversation.py` | Modified | Enhanced `EVALUATION_PROMPT` for granular 5-dimension scores + recommendation |
| `backend/app/routers/analytics.py` | Created | 5 endpoints: overview, interviews, pipeline, time-to-hire, trends |
| `backend/app/routers/hr_review.py` | Modified | Added `created_at` to `ScreeningDetail`/`StageResultDetail` models |
| `src/lib/recruitment-api.ts` | Modified | Added analytics interfaces/functions, granular score fields to `StageResult` |
| `src/app/hr/applicants/[applicationId]/page.tsx` | Modified | Combined scorecard (Stage 1 + Stage 2 side-by-side), granular dimension bars, 6-step recruitment timeline |
| `src/app/hr/analytics/page.tsx` | Created | Full analytics dashboard: stat cards, per-job chart, pipeline funnel, trends, top performers, time-to-hire |
| `src/components/hr/SidebarNav.tsx` | Modified | Added Analytics nav link |
| `src/app/api/recruitment/hr/analytics/*` (5 routes) | Created | Next.js proxy routes for analytics endpoints |

### Phase 3 — Documents, Interviews

| File | Type | Purpose |
|------|------|---------|
| `backend/app/models/interview.py` | Created | `Interview` ORM model (application_id, type, date, time, duration, location, link, interviewer, notes, status) |
| `backend/app/routers/interviews.py` | Created | 5 endpoints: create (auto-sends email), get-by-application, upcoming, all, update |
| `backend/app/routers/hr_review.py` | Modified | Added `cv_url`/`cover_letter_url` to response models; `GET /api/hr/applications/{id}/document` file-serving endpoint |
| `src/app/hr/documents/page.tsx` | Created | Document management: job selector, search/filter, applicant list, inline PDF preview, download |
| `src/app/hr/interviews/page.tsx` | Created | Interview scheduling: stat cards, date filter, schedule list with status dropdown, create modal |
| `src/app/hr/applicants/[applicationId]/page.tsx` | Modified | Schedule Interview button + modal in sidebar |
| `src/components/hr/SidebarNav.tsx` | Modified | Added Documents + Interviews nav links |
| `src/lib/recruitment-api.ts` | Modified | Added Interview types, CRUD functions, `fetchDocumentUrl()` |
| `src/app/api/recruitment/hr/interviews/**/route.ts` (5 routes) | Created | Next.js proxy routes |
| `src/app/api/recruitment/hr/applicants/[applicationId]/document/route.ts` | Created | Next.js proxy for document serving |

### Phase 4 — Audit Trail

| File | Type | Purpose |
|------|------|---------|
| `backend/app/models/audit_log.py` | Created | `AuditLog` ORM model (application_id, action, detail, performed_by) |
| `backend/app/services/audit_service.py` | Created | `log_action()` and `get_audit_logs()` helpers |
| `backend/app/routers/hr_review.py` | Modified | Audit logging on approve/reject/resend/clear; `GET /api/hr/audit-logs/{id}` endpoint |
| `backend/app/routers/interviews.py` | Modified | Audit logging on create/update interview |
| `src/app/api/recruitment/hr/audit-logs/[applicationId]/route.ts` | Created | Next.js proxy for audit logs |
| `src/lib/recruitment-api.ts` | Modified | Added `AuditLogEntry` type and `fetchAuditLogs()` |
| `src/app/hr/applicants/[applicationId]/page.tsx` | Modified | Audit Timeline card in left column |

## How to Run

```bash
# Terminal 1 — Backend
cd backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
npx next dev -p 3000
```

## Key API Endpoints

### HR Endpoints (prefix: /api/hr, auth: Bearer token)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/hr/auth/login` | HR login |
| GET | `/api/hr/stats` | Dashboard stats |
| POST | `/api/hr/review/{id}` | Approve or reject (with optional expiration_days) |
| POST | `/api/hr/approve/{id}` | Approve with expiration_days |
| POST | `/api/hr/resend/{id}` | Resend assessment link |
| POST | `/api/hr/clear/{job_id}` | Delete all apps for job |
| GET | `/api/hr/applications/{job_id}` | List apps with screening |
| GET | `/api/hr/applications/detail/{id}` | Applicant detail |
| GET | `/api/hr/applications/{id}/document` | Serve CV file |
| GET | `/api/hr/audit-logs/{id}` | Audit trail for applicant |
| GET | `/api/hr/analytics/overview` | Analytics overview |
| GET | `/api/hr/analytics/interviews` | Interview analytics |
| GET | `/api/hr/analytics/pipeline` | Pipeline funnel |
| GET | `/api/hr/analytics/time-to-hire` | Time-to-hire data |
| GET | `/api/hr/analytics/trends` | Daily application trends |

### Interview Endpoints (prefix: /api/hr/interviews, auth: Bearer token)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `` | Create interview (auto-sends email) |
| GET | `/by-application/{id}` | Get interviews for applicant |
| GET | `/upcoming` | Upcoming interviews |
| GET | `/all` | All interviews |
| PUT | `/{id}` | Update interview (status, date, etc.) |

### Assessment Endpoints (prefix: /api/assessment, no auth — uses token)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/{token}` | Get assessment meta (checks expiry — 410 if expired) |
| POST | `/{token}/start` | Start assessment (checks expiry) |
| POST | `/{token}/respond` | Respond to topic (checks expiry) |
| POST | `/{token}/end` | End assessment (checks expiry) |

## Data Model

```
JobPosting (id, title, description, requirements, department, location, type, status + screening/stage2 config)
  └── Application (id, job_id, candidate_name/email, cv_url, cv_text, cover_letter_url/text, status, stage, assessment_token, assessment_sent_at, assessment_expires_at)
        ├── AIScreeningResult (id, application_id, overall_score, strengths, concerns, evidence) — 1:1
        ├── StageResult (id, application_id, stage_number, score, ai_feedback, transcript) — 1:N
        ├── ConversationSession (id, application_id, status, conversation_history, current_topic_index) — 1:1
        ├── Interview (id, application_id, type, date, time, duration, location/link, interviewer, notes, status) — 1:N
        └── AuditLog (id, application_id, action, detail, performed_by) — 1:N (kept after deletion)
```

## Status Flow

```
pending -> (AIScreeningResult created) -> approved (stage 2, assessment sent) -> assessment_completed -> interview_scheduled -> completed/rejected
```

## Known Behaviors

- DB migrations run automatically on backend startup via lifespan event in `main.py`
- Email: `settings.dev_mode = True` prints to console; set to False + configure ACS to send real emails
- File storage: `settings.dev_mode` uses local `storage/cvs/` directory; production uses Azure Blob
- Assessment expiration: HTTP 410 (Gone) for expired tokens, checked on every assessment endpoint
- All Python f-strings use plain `{var}` syntax (no escaped double braces in non-format-string templates)
- Screened applications are sorted by AI score descending in the list endpoint
- Analytics show zeros until recruitment data flows through (fresh database)

## Verification

- TypeScript: `npx tsc --noEmit` — 0 errors
- Python: All models and routers import successfully
