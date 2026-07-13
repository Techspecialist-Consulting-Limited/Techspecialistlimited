# Security, Auth, and Known Gaps

## Summary for non-technical readers

There are two separate login systems in this application (one for HR staff, effectively none for the AI-readiness leads admin panel), and neither uses Supabase or Firebase's built-in authentication — both are custom-built. The HR system is reasonably solid when the Python backend is reachable, but has a **weaker fallback path** that activates during backend outages. The leads admin panel currently has **no access control at all**. This document lists what's verified true in the code today, so decisions about what to fix (and in what order) can be made with facts rather than assumptions.

## How HR authentication actually works

1. **Real path (backend reachable):** `POST /api/recruitment/hr/auth` proxies to backend `POST /api/auth/login`, which checks the submitted password against a bcrypt hash in the `hr_users` table and, on success, issues a genuine JWT (HS256, signed with the backend's `jwt_secret`, 8-hour expiry). Every subsequent HR-scoped backend endpoint validates this JWT via `verify_hr_token()` (`backend/app/auth.py`).
2. **Fallback path (backend unreachable — HTTP 502):** `src/app/api/recruitment/hr/auth/route.ts` checks the submitted credentials against the frontend's own `HR_EMAIL`/`HR_PASSWORD` env vars (defaults `hr@company.com` / `admin123` if unset — **check these are actually set to non-default values in production**), and mints a token that **looks like a JWT but isn't**: `signature = base64url(JWT_SECRET + header + payload)`, i.e. string concatenation encoded, not HMAC-SHA256. This token would not pass a real JWT signature check, but nothing in the frontend re-validates it either — the frontend simply trusts it exists.
3. `src/lib/auth.ts` stores whichever token was issued in `localStorage['hr_token']` and attaches it as `Authorization: Bearer <token>` to every subsequent HR API call (`recruitment-api.ts`'s `authHeaders()`).
4. **The `/hr/*` page guard (`src/app/hr/layout.tsx`) only checks that *some* token exists in `localStorage`** — it does not verify it's valid. It is a UI-rendering guard, not a security boundary. The actual security boundary is the backend's `verify_hr_token()` on each API call.

### The gap this creates

When a mutating HR route has a Supabase fallback (currently: `POST/PUT /api/recruitment/hr/jobs*`), that fallback code path performs **no auth check whatsoever** before writing to Supabase — it doesn't even look at the `Authorization` header. In practice, this means: if the backend is down, anyone who can reach `/api/recruitment/hr/jobs` (not just logged-in HR staff) can create or modify a job posting. This is a narrower gap than it sounds, because it only matters during a specific failure mode (backend down), but it's real and worth fixing — either by having those fallback routes also check for a valid token, or by removing the write fallback and simply failing the request when the backend is unreachable.

## The AI Readiness leads admin panel has no auth at all

`/admin/assessments`, `src/app/api/admin/assessments/route.ts`, and backend `backend/app/routers/ai_readiness.py`'s `/api/ai-readiness/*` endpoints have **zero authentication or authorization** at any layer. Anyone who discovers the URL can:
- View every captured lead (email, company name, score)
- Export all of it as CSV
- Mark leads as followed up
- **Delete leads permanently**

An `ADMIN_SECRET_TOKEN` env var exists in `.env.local`, which strongly suggests this was meant to be protected and the wiring was never finished. This is the single highest-priority finding in this documentation set if the leads data is real and current.

**Straightforward fix options** (not yet implemented — for whoever picks this up):
- Reuse the existing HR JWT mechanism: require the same `Authorization: Bearer` header and `verify_hr_token()` check on the backend's `/api/ai-readiness/*` routes, and add the same `layout.tsx`-style client guard to `/admin`.
- Or, simplest: check `ADMIN_SECRET_TOKEN` as a shared secret (like the recruitment `x-api-key` pattern) if a full login isn't wanted for this one panel.

## Other verified auth mechanisms (working as designed)

- **Public application submission** (`POST /api/applications`): a static shared secret via `x-api-key`, checked against backend `settings.api_key`. This isn't candidate authentication — it's a bot/abuse gate on a public form, and that's an appropriate use for a shared secret.
- **Candidate voice interview** (`/api/assessment/{token}/...`): a single-use-context magic-link token (`secrets.token_urlsafe(32)`), no password. Appropriate for a one-shot, emailed, time-limited flow — just be aware anyone who has the email link has the interview access, so link expiry (`assessment_expires_at`) is the only real time boundary.
- **Password reset** (`POST /api/auth/forgot-password`): always returns a generic success message regardless of whether the email exists, correctly avoiding user enumeration.

## Data-integrity gap: the Supabase fallback and AI screening

Covered in depth in [02-data-model-and-storage.md](02-data-model-and-storage.md), but worth restating here because it's a data-integrity issue with a security-adjacent cause (an unauthenticated-by-design fallback path): an application submitted while the backend is down lands in Supabase, **skips AI screening**, and is invisible to the HR portal until manually reconciled. This isn't a confidentiality/access problem, but it is a silent-data-loss-shaped problem worth the same level of attention.

## What is *not* a gap (confirmed by code, not assumption)

- No Supabase Auth or Firebase Auth is used anywhere for HR or admin — this is intentional custom auth, not a misconfigured integration.
- The Supabase client only ever uses the anon key; no service-role key is exposed anywhere in `src/`.
- Password reset tokens are hashed (SHA-256) before storage (`hr_auth_service.py`) with a 1-hour TTL — not stored in plaintext.
- HR passwords are bcrypt-hashed, not plaintext, in the `hr_users` table.

## Recommended priority order

1. **Add auth to `/admin/assessments` and its API routes** — currently fully open, highest exposure for the least effort to fix.
2. **Close or auth-gate the Supabase fallback write paths for HR jobs** — narrower exposure (only during backend outages) but touches production job data.
3. **Confirm `HR_EMAIL`/`HR_PASSWORD` are not left at their code-level defaults** (`hr@company.com` / `admin123`) in whatever environment serves production traffic.
4. **Decide whether the fallback JWT-like token minting is acceptable long-term**, or whether the frontend should simply fail login when the backend is unreachable rather than issuing a weaker credential.
