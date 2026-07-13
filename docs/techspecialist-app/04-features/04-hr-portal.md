# HR Portal

## What it does

The internal back-office where HR staff post jobs, review AI-screened candidates, approve/reject, schedule final interviews, view analytics, and manage their own team's accounts.

## Access

Gated by `src/app/hr/layout.tsx`, which redirects to `/hr/login` unless `isHRAuthenticated()` (a client-side check of `localStorage['hr_token']`). See [06-security-and-known-gaps.md](../06-security-and-known-gaps.md) for the important caveat that this is a **UI-level** guard — the real enforcement is the backend's JWT check on each API call.

## Pages

| Route | Purpose |
|---|---|
| `/hr` | Dashboard — stat cards, active jobs |
| `/hr/login`, `/hr/reset-password` | Auth (the two pages exempted from the layout guard) |
| `/hr/jobs`, `/hr/jobs/create`, `/hr/jobs/history` | Create/manage/soft-delete/restore job postings |
| `/hr/jobs/[jobId]/applicants` | Applicants for one job |
| `/hr/applicants` | All applicants, searchable |
| `/hr/applicants/[applicationId]` | Full applicant detail: CV screening result, interview transcript/scores, approve/reject, schedule interview, resend assessment link, audit log |
| `/hr/interviews` | Interview calendar/list |
| `/hr/analytics` | Recruitment analytics — overview, pipeline funnel, interview stats, time-to-hire, trends |
| `/hr/documents` | View/download applicant CVs and cover letters |
| `/hr/settings` | Branding settings + HR team member management (invite, deactivate, delete) |

## Walkthrough — reviewing and advancing a candidate

1. HR opens `/hr/applicants/[applicationId]`, which calls `fetchApplicantDetail()` → `GET /api/recruitment/hr/applicants/[applicationId]` → backend `GET /api/hr/applications/detail/{application_id}`.
2. The page renders the AI screening score/strengths/concerns, and, if a stage-2 interview has happened, the transcript and scorecard (`TranscriptViewer`, `ScoreCircle`, `ScoreBar` in `src/components/recruitment/`).
3. HR clicks approve or reject → `reviewApplication()`/`approveApplication()` → `POST /api/recruitment/hr/review|approve/[applicationId]` → backend `POST /api/hr/review/{id}` or `/api/hr/approve/{id}`. Approving past stage 1 generates a new `assessment_token`, sets `assessment_sent_at`/`assessment_expires_at`, and emails the candidate the stage-2 interview link. Rejecting sends a rejection email. Both write an `AuditLog` entry.
4. HR can resend the assessment link (`resendAssessment()` → `POST /api/recruitment/hr/resend/[applicationId]`) if the candidate's link expired.
5. After a successful stage-2 interview, HR schedules a final human interview (`createInterview()` → `POST /api/recruitment/hr/interviews`), which emails an invitation and sets `applications.status = 'interview_scheduled'`.

## Team management (`/hr/settings`)

- Inviting a new HR user creates an `HrUser` row with an unusable placeholder password and emails a set-password (reset-token) link.
- Deactivating or deleting the **last remaining active HR account is blocked** by the backend, to prevent HR from locking itself out entirely.

## Where to make changes

| Change | File |
|---|---|
| Dashboard stats | `backend/app/routers/hr_review.py` (`GET /api/hr/stats`) |
| Applicant list/detail data shape | `backend/app/routers/hr_review.py` |
| Approve/reject/interview email content | `backend/app/services/email_service.py` |
| Analytics calculations | `backend/app/routers/analytics.py` |
| Branding fields available in Settings | `backend/app/services/settings_service.py` (`OVERRIDABLE_KEYS`) |
| Team member invite/deactivate/delete rules | `backend/app/routers/hr_settings.py` |

## Things worth knowing

- Every mutating HR action (approve, reject, schedule interview, clear applications) writes to `audit_logs` — `/hr/applicants/[applicationId]` surfaces this per-applicant via `fetchAuditLogs()`.
- `POST /api/recruitment/hr/clear/[jobId]` bulk-deletes all applications (and cascading screening/stage/conversation/interview rows) for a job. This is destructive and irreversible — the UI confirms before calling it using the app's custom `ConfirmDialog` component, not the browser's native `confirm()`.
