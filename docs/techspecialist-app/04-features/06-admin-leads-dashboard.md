# Admin Leads Dashboard

## What it does

`/admin/assessments` lists everyone who has completed the AI Readiness Assessment quiz, so marketing/sales can follow up. Supports filtering by readiness level, CSV export, marking a lead as "followed up," and deleting a lead.

## Walkthrough

1. On mount, `src/app/admin/assessments/page.tsx` calls `GET /api/admin/assessments` (`src/app/api/admin/assessments/route.ts`), which proxies to backend `GET /api/ai-readiness/results`.
2. The table shows each lead's email, company, score, level (`AI Explorer` / `AI Builder` / `AI Accelerator` / `AI Leader`), and follow-up status.
3. **Filter by level** — client-side.
4. **CSV export** — built client-side from the already-fetched data (a `Blob`), no separate export endpoint.
5. **Toggle followed-up** — `PATCH /api/admin/assessments` → backend `PATCH /api/ai-readiness/results/{id}`.
6. **Delete** — confirmed via the app's `ConfirmDialog` component, then `DELETE /api/admin/assessments` → backend `DELETE /api/ai-readiness/results/{id}`.

## Where to make changes

| Change | File |
|---|---|
| Table columns / filters | `src/app/admin/assessments/page.tsx` |
| CSV export format | same file |
| Lead list/update/delete logic | `backend/app/routers/ai_readiness.py` |

## This is the most important thing to know about this feature

**There is no authentication or authorization anywhere in this path.** No `layout.tsx` or guard component wraps `/admin`, `src/app/api/admin/assessments/route.ts` performs no auth check before proxying, and the backend's `/api/ai-readiness/*` router requires no auth either. Anyone who discovers the URL can view, export, or delete every captured lead.

A `ADMIN_SECRET_TOKEN` environment variable exists in `.env.local`, suggesting access control was planned, but it is not referenced anywhere in the codebase — it does nothing today.

**If this dashboard holds real, current lead data, treat closing this gap as a priority** — see [06-security-and-known-gaps.md](../06-security-and-known-gaps.md) for the fix options.
