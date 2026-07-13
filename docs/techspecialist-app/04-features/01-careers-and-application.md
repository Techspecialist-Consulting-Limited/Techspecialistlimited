# Careers Board and Application Form

## What it does

Lets any visitor browse open roles and apply with a CV and optional cover letter — no account required.

## Walkthrough

1. **`/careers`** (`src/app/careers/page.tsx`) loads the job list via `fetchJobs()` (`src/lib/recruitment-api.ts`), which calls `GET /api/recruitment/jobs`. That route proxies to the backend's `GET /api/jobs`; if the backend is unreachable, it falls back to reading Supabase's `jobs` table directly. Only jobs with `status === 'active' && !is_closed` are shown.
2. **`/careers/[id]`** (`CareerDetailClient.tsx`) shows one job's full description and requirements, with a link to `/apply?id=<jobId>`.
3. **`/apply`** (`src/app/apply/page.tsx`, component `ApplyForm`) fetches the specific job (`fetchJob(jobId)`), then renders a 3-step form: candidate details → document upload (`src/components/recruitment/FileUploadZone.tsx`) → review.
4. On submit, `submitApplication(jobId, formData)` tries, in order:
   - `POST /api/recruitment/applications` → proxied to the backend's `POST /api/applications` (protected by the `x-api-key` shared secret, not a login) → backend extracts CV text, uploads files to storage, **runs AI screening synchronously**, writes `Application` + `AIScreeningResult` rows, sends confirmation/notification emails.
   - If that whole path throws, it falls back to the legacy `POST /api/apply` route — a pure Supabase insert with **no AI screening at all**.

## Where to make changes

| Change | File |
|---|---|
| Job board filtering/sorting | `src/app/careers/page.tsx` |
| Application form fields/steps | `src/app/apply/page.tsx` |
| What happens when an application is submitted (validation, storage, screening trigger) | `backend/app/routers/applications.py` |
| CV text extraction (PDF/DOCX parsing) | `backend/app/routers/applications.py` (uses `PyMuPDF`/`python-docx`) |
| Confirmation/notification email content | `backend/app/services/email_service.py` (`send_application_received_email`, `send_new_application_notification`) |

## Things worth knowing

- The `x-api-key` protecting `POST /api/applications` is a single shared secret, not per-user — it exists to keep the endpoint from being hit by arbitrary bots, not to authenticate the applicant.
- If the backend is down at submission time, the candidate's application is silently accepted into Supabase instead, and will **not** be AI-screened or visible in the HR portal. See [02-data-model-and-storage.md](../02-data-model-and-storage.md) and [06-security-and-known-gaps.md](../06-security-and-known-gaps.md).
