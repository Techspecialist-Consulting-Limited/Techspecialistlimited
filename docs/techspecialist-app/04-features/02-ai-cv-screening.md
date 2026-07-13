# AI CV Screening

## What it does

The moment a candidate submits an application, the backend has GPT-4o read the CV (and cover letter, if provided) against the job's `screening_instructions` and produce a score plus written feedback — before HR ever looks at it.

## Walkthrough

1. Triggered inline, synchronously, inside `POST /api/applications` (`backend/app/routers/applications.py`) — not a background job (see [07-deployment-and-operations.md](../07-deployment-and-operations.md) for why that matters operationally).
2. `backend/app/services/ai_screening.py` calls Azure OpenAI GPT-4o with a structured-JSON-response prompt built from the CV text, cover letter text, and the job's requirements/screening instructions.
3. The response is normalized into: `overall_score`, `strengths`, `concerns`, `evidence`, `recommendation`.
4. `backend/app/workers/tasks.py`'s `run_screening()` upserts an `AIScreeningResult` row linked to the application.
5. If the AI call errors for any reason, the system does **not** fail the application — it falls back to a neutral score of 50 with a "needs manual review" note, so a candidate is never silently lost because of an AI outage.

## Where to make changes

| Change | File |
|---|---|
| Scoring prompt / what the AI weighs | `backend/app/services/ai_screening.py` |
| Per-job screening emphasis | `job_postings.screening_instructions`, editable from `/hr/jobs/create` and `/hr/jobs/[jobId]` (edit) |
| Fallback behavior on AI failure | `backend/app/services/ai_screening.py` |
| Where the score/feedback surfaces to HR | `src/app/hr/applicants/[applicationId]/page.tsx`, `src/app/hr/jobs/[jobId]/applicants/page.tsx` |

## Things worth knowing

- This step runs **in the request path** of the candidate's submission — the candidate's browser waits for GPT-4o to respond before getting a success confirmation. A slow or degraded Azure OpenAI response directly slows down the application form for the candidate.
- The `raw_response` field is kept on `AIScreeningResult` specifically so a human can audit exactly what the AI said, even if the parsed `strengths`/`concerns` fields don't fully capture it.
