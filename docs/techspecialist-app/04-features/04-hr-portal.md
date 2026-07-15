# HR Portal

## What it does

The internal back-office where HR staff post jobs, review AI-screened candidates, run the pipeline through to hire/reject, schedule and score final interviews, view analytics, and manage their own team's accounts.

## Access

Gated by `src/app/hr/layout.tsx`, which redirects to `/hr/login` unless `isHRAuthenticated()` (a client-side check of `localStorage['hr_token']`). See [06-security-and-known-gaps.md](../06-security-and-known-gaps.md) for the important caveat that this is a **UI-level** guard — the real enforcement is the backend's JWT check on each API call.

## Pages

| Route | Purpose |
|---|---|
| `/hr` | Dashboard — stat cards, active jobs, **Pending Team Decisions** (AI-summarized stage-2 results awaiting a human call — see below) |
| `/hr/login`, `/hr/reset-password` | Auth (the two pages exempted from the layout guard) |
| `/hr/jobs`, `/hr/jobs/create`, `/hr/jobs/history` | Create/manage/soft-delete/restore job postings, including AI screening config, interview topics, auto-advance, and interview timing |
| `/hr/jobs/[jobId]/applicants` | Applicants for one job — **Kanban board** (default) or cards view, bulk actions, archived filter |
| `/hr/applicants` | All applicants, searchable |
| `/hr/applicants/[applicationId]` | Full applicant detail: CV screening result, interview transcript/scores, approve/reject/hire, schedule interview, interviewer scorecards, resend assessment link, audit log, delete application |
| `/hr/interviews` | Interview calendar/list |
| `/hr/analytics` | Recruitment analytics — overview, pipeline funnel, interview stats, time-to-hire, trends |
| `/hr/documents` | View/download applicant CVs and cover letters |
| `/hr/settings` | Branding settings + HR team member management (invite, deactivate, delete) |

## The pipeline board (`/hr/jobs/[jobId]/applicants`)

A Kanban board (`src/components/recruitment/PipelineBoard.tsx`, native HTML5 drag-and-drop, no external DnD library) with six columns: New, Assessment Sent, Assessment Completed, Interview Scheduled, Hired, Rejected. Dragging a card to a valid destination column opens the matching action (a `ConfirmDialog` for approve/reject/hire, or `ScheduleInterviewModal` for interview scheduling); an invalid drop shows a dismissible banner instead of silently failing. A `viewMode` toggle (default `'board'`) switches to a flat `'cards'` list with checkboxes for bulk selection.

Cards (both board and cards view) show **stalled** and **duplicate** badges, computed client-side in `src/lib/applicant-flags.ts`:
- `isStalled(app)` — no status change in 7+ days, excluding terminal statuses (hired/rejected).
- `isDuplicate(app)` — `application_count_for_email > 1`, a field the backend computes by counting other applications sharing the same candidate email.

A `showArchived` checkbox toggles whether archived applicants are included (`fetchApplicants(jobId, includeArchived)` → `GET /api/hr/applications/{job_id}?include_archived=true`).

## Bulk actions

In cards view, selecting multiple applicants surfaces a toolbar for **Archive**, **Unarchive**, or **Reject**, each behind a `ConfirmDialog` (never a native `confirm()`). Calls `POST /api/hr/bulk-action` with `{application_ids: [...], action: "archive"|"unarchive"|"reject"}` — each application gets its own audit log entry, and `reject` also sends the rejection email per candidate.

## Interviewer scorecards

`src/components/recruitment/ScorecardPanel.tsx`, shown on the applicant detail page once `applicant.stage >= 2`: interviewer name, four 1–5 sliders (communication, technical, culture fit, problem solving), a recommendation button group (strong yes / yes / no / strong no), and free-text notes. Submits via `POST /api/hr/scorecards`; a list of previously-submitted scorecards for the application loads via `GET /api/hr/scorecards/by-application/{application_id}`. Multiple interviewers can each submit their own scorecard for the same application — see the `interview_scorecards` table in [02-data-model-and-storage.md](../02-data-model-and-storage.md).

## Scheduling a final interview — now with a calendar invite

`ScheduleInterviewModal.tsx` (shared between the board's drag-to-schedule flow and the applicant detail page) calls `createInterview()` → `POST /api/hr/interviews`, which now also builds and attaches a `.ics` calendar file (`backend/app/services/ics_service.py`, base64-encoded via Resend's `attachments` field) so the invitation email drops straight into the candidate's calendar app. The invitation email's "contact us" line and `Reply-To` header point at real monitored addresses (`applicant_reply_to_email`), not the sending address — see [03-configuration-and-integrations.md](../03-configuration-and-integrations.md).

## "Pending Team Decisions" (dashboard)

A section on `/hr` (`src/app/hr/page.tsx`) surfaces every application that just finished its stage-2 AI interview and is still sitting in limbo (not hired/rejected, not archived, job not deleted) — pulled from `GET /api/hr/pending-decisions`, which joins the application, its stage-2 `StageResult`, and the job. Each card shows the candidate, score, the AI's structured recommendation (color-coded badge), and a summary, linking straight to the applicant detail page. This is what fixed a real pre-existing bug: `StageResult.ai_feedback` is stored as a raw JSON *string* in the database, but the API was passing it straight through typed as `str | None` while the frontend expected a parsed object — silently rendering nothing for the granular scorecard fields. `_parse_ai_feedback()` in `hr_review.py` now JSON-decodes it before it leaves the backend.

## Candidate self-service status page (public, not HR-gated)

`/application-status/[applicationId]` — a public page where a candidate enters the email they applied with and sees a friendly status label (no login, no token). Backed by `GET /api/applications/{application_id}/status?email=...`, which validates the email matches case-insensitively and 404s otherwise (deliberately vague to avoid leaking whether an application ID is valid). A link to this page is included in the "application received" confirmation email.

## Single-application delete ("Danger Zone")

The applicant detail page has a destructive "Delete Application" action, behind a `ConfirmDialog`, calling `DELETE /api/hr/applications/{application_id}`. Unlike the bulk archive/reject actions, this is a hard, cascading delete — it removes the `AIScreeningResult`, all `StageResult` rows, the `ConversationSession`, all `Interview` rows, and the `AuditLog` history for that application, then the `Application` itself. There is no undo.

## Auto-advance configuration (job creation)

On `/hr/jobs/create`, a "Stage 2 Invitation Flow" section lets HR pick Manual Review (default — HR clicks approve) or Auto-Advance (candidates who clear a configured CV-screening pass mark get the stage-2 invite automatically after a configurable delay, no click needed). See [03-ai-voice-interview.md](03-ai-voice-interview.md) for how the delay/override window works, and the same page's "Maximum Interview Duration" field for per-job interview timing.

## Walkthrough — reviewing and advancing a candidate

1. HR opens `/hr/applicants/[applicationId]`, which calls `fetchApplicantDetail()` → `GET /api/recruitment/hr/applicants/[applicationId]` → backend `GET /api/hr/applications/detail/{application_id}`.
2. The page renders the AI screening score/strengths/concerns, and, if a stage-2 interview has happened, the transcript and scorecard (`TranscriptViewer`, `ScoreCircle`, `ScoreBar` in `src/components/recruitment/`).
3. HR clicks approve, reject, or **hire** → `reviewApplication()`/`approveApplication()` → `POST /api/recruitment/hr/review|approve/[applicationId]` → backend `POST /api/hr/review/{id}` or `/api/hr/approve/{id}`. Approving past stage 1 generates a new `assessment_token`, sets `assessment_sent_at`/`assessment_expires_at`, and emails the candidate the stage-2 interview link. Rejecting sends a rejection email. Hiring sends a congratulations email and sets `status = "hired"`. All three write an `AuditLog` entry.
4. HR can resend the assessment link (`resendAssessment()` → `POST /api/recruitment/hr/resend/[applicationId]`) if the candidate's link expired.
5. After a successful stage-2 interview, HR schedules a final human interview (`createInterview()` → `POST /api/recruitment/hr/interviews`), which emails an invitation (with calendar invite attached) and sets `applications.status = 'interview_scheduled'`. One or more interviewers can then submit a scorecard.
6. HR marks the application hired or rejected, or archives it if it's gone stale.

## Team management (`/hr/settings`)

- Inviting a new HR user creates an `HrUser` row with an unusable placeholder password and emails a set-password (reset-token) link.
- Deactivating or deleting the **last remaining active HR account is blocked** by the backend, to prevent HR from locking itself out entirely.

## Where to make changes

| Change | File |
|---|---|
| Dashboard stats / pending decisions | `backend/app/routers/hr_review.py` (`GET /api/hr/stats`, `GET /api/hr/pending-decisions`) |
| Applicant list/detail data shape, bulk action, delete | `backend/app/routers/hr_review.py` |
| Pipeline board UI, drag-and-drop rules | `src/components/recruitment/PipelineBoard.tsx` |
| Stalled/duplicate detection logic | `src/lib/applicant-flags.ts` |
| Scorecard form / list | `src/components/recruitment/ScorecardPanel.tsx`, `backend/app/routers/scorecards.py` |
| Calendar invite generation | `backend/app/services/ics_service.py` |
| Approve/reject/hire/interview email content | `backend/app/services/email_service.py` |
| Analytics calculations | `backend/app/routers/analytics.py` |
| Branding fields available in Settings | `backend/app/services/settings_service.py` (`OVERRIDABLE_KEYS`) |
| Team member invite/deactivate/delete rules | `backend/app/routers/hr_settings.py` |
| Candidate status page | `src/app/application-status/[applicationId]/page.tsx`, `backend/app/routers/applications.py` (`GET /{id}/status`) |

## Things worth knowing

- Every mutating HR action (approve, reject, hire, schedule interview, bulk action, delete, scorecard submission, clear applications) writes to `audit_logs` — `/hr/applicants/[applicationId]` surfaces this per-applicant via `fetchAuditLogs()`. Deleting an application deletes its audit history too (the cascading delete above); bulk-clearing a job's applications does not preserve audit history either.
- `POST /api/recruitment/hr/clear/[jobId]` bulk-deletes all applications (and cascading screening/stage/conversation/interview rows) for a job. This is destructive and irreversible — the UI confirms before calling it using the app's custom `ConfirmDialog` component, not the browser's native `confirm()`. The single-application delete above is the same pattern, scoped to one applicant.
- No system modals (`confirm()`/`alert()`/`prompt()`) are used anywhere in the HR portal — every destructive or blocking action goes through `ConfirmDialog` or a purpose-built modal component. If you find a native browser dialog anywhere in this codebase, it's a bug, not a design choice.
