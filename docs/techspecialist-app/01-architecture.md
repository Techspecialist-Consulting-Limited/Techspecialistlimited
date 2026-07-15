# Architecture

## Summary

This is a **two-application system**, not one. A Next.js frontend serves everything a browser talks to; a separate Python (FastAPI) backend owns the recruitment database and runs the AI logic. The frontend calls the backend over HTTP and WebSocket. For two specific recruitment flows, the frontend also has a direct fallback to Supabase, so it can keep working (in a degraded way) if the Python backend is down.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                             │
│  (visitor / candidate / HR staff)                                    │
└───────────────┬────────────────────────────────────────────────────┘
                 │  HTTPS (pages, same-origin API calls)
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Next.js 15 app (src/)                                               │
│  - Public pages (marketing, careers, AI readiness quiz)              │
│  - /hr/* pages (HR back-office UI)                                   │
│  - /admin/assessments (leads dashboard)                              │
│  - /api/** route handlers — mostly thin proxies to the backend       │
│                                                                        │
│  Deployed: Azure Web App "Techspecialist-Limited"                    │
│  (GitHub Actions, .github/workflows/main_techspecialist-limited.yml, │
│  triggers on push to `main`). A `.vercel/` project link also exists  │
│  in the repo — confirm with whoever manages hosting which target is  │
│  actually authoritative before assuming Azure is the only one live.  │
└───────┬───────────────────────────────────────┬─────────────────────┘
        │ server-side fetch()                   │ direct client SDK calls
        │ (proxyToBackend, RECRUITMENT_API_URL)  │ (NEXT_PUBLIC_SUPABASE_*)
        ▼                                        ▼
┌──────────────────────────────────┐   ┌──────────────────────────────┐
│  Python backend (backend/)       │   │  Supabase (Postgres + Storage)│
│  FastAPI + SQLAlchemy (async)    │   │  Tables: jobs, applications    │
│                                   │   │  Storage bucket: applications  │
│  - Job postings, applications    │   │                                │
│  - AI CV screening (GPT-4o)      │   │  Used as a FALLBACK only, for: │
│  - AI voice interview (Azure     │   │  - listing jobs                │
│    Realtime API, primary; legacy │   │  - submitting an application   │
│    Whisper/GPT-4o/TTS, fallback) │   │                                 │
│  - HR auth, analytics, settings  │   │  when the Python backend       │
│  - Own database: Postgres (prod) │   │  returns unreachable (502).    │
│    / SQLite (dev)                │   │  See 02-data-model-and-        │
│                                   │   │  storage.md for why this       │
│  Deployed: Azure Web App for     │   │  creates two sources of truth. │
│  Containers "techspecialist-api" │   └──────────────────────────────┘
│  (resource group                 │
│  "techspecialist"). Image built  │
│  + pushed via Azure Container    │
│  Registry "techspecialistacr";   │
│  deployed manually               │
│  (az acr build + az webapp       │
│  restart) — no CI workflow.      │
└───────┬───────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  External AI / infra services                                        │
│  - Azure OpenAI (GPT-4o chat, Whisper transcription, TTS, Realtime)   │
│  - Azure Blob Storage (CVs, interview audio) — or local disk in dev   │
│  - Resend (recruitment transactional email)                          │
│  - Anthropic Claude + Groq (AI Readiness report generation, frontend) │
│  - EmailJS (marketing lead-notification email, frontend, client-side) │
└─────────────────────────────────────────────────────────────────────┘
```

## Why two applications instead of one

The Next.js app could theoretically do everything (Next.js supports API routes). Instead, all the AI-heavy, stateful recruitment logic — CV screening, the voice-interview engine, HR auth, analytics — lives in a separate Python backend with its own database. The Next.js `api/recruitment/**` routes are, almost without exception, **thin proxies**: they forward the request to the Python backend and return its response. The one shared helper for this is `src/app/api/recruitment/proxy.ts` (`proxyToBackend()`).

This split matters for anyone maintaining the system:
- **Recruitment business logic changes happen in `backend/`, not `src/`.** If you need to change how CV screening scores, how the interview state machine works, or how HR permissions are enforced, look in `backend/app/services/` and `backend/app/routers/`, not the Next.js API routes.
- **The Next.js layer's main jobs are:** rendering UI, proxying requests, and providing a Supabase-backed fallback for two specific write paths (job listing, application submission) so the public careers page degrades gracefully instead of hard-failing if the backend is briefly down.
- **The AI Readiness Assessment is entirely separate** from the recruitment platform's AI — it lives in the Next.js layer (`src/lib/ai-report.ts`, calling Anthropic/Groq directly) and in one backend router (`ai_readiness.py`) purely for storing lead submissions. It does not touch the recruitment database's core tables.

## Request flow examples

**A visitor loads the careers page:**
`GET /careers` → `src/app/careers/page.tsx` → `fetchJobs()` → `GET /api/recruitment/jobs` → `proxyToBackend()` → backend `GET /api/jobs`. If that fails, the Next.js route handler falls back to querying Supabase's `jobs` table directly.

**A candidate submits an application:**
Browser → `POST /api/recruitment/applications` → proxied to backend `POST /api/applications` (protected by a shared `x-api-key` secret, not a user login) → backend extracts CV text, uploads files to storage, runs AI screening **synchronously in the same request** (see [07-deployment-and-operations.md](07-deployment-and-operations.md) for why this is worth knowing), writes the `Application` + `AIScreeningResult` rows, sends notification emails. If the backend call fails, the Next.js layer falls back to writing directly into Supabase's `applications` table and storage bucket instead — meaning that application would **never get AI-screened** (see [06-security-and-known-gaps.md](06-security-and-known-gaps.md)).

**A candidate takes the AI voice interview:**
Browser → `wss://.../api/assessment/{token}/realtime-ws` → backend holds one persistent `gpt-realtime` session open for the whole interview (voice-to-voice, semantic VAD turn detection) → on completion, backend scores the conversation and writes a `StageResult` row. The legacy HTTP/WebSocket (Whisper/GPT-4o/TTS) engine still exists and is reachable at `/api/assessment/{token}/ws`, but is not what candidates get today — see [04-features/03-ai-voice-interview.md](04-features/03-ai-voice-interview.md).

## Environments

| Environment | Frontend | Backend | Backend DB |
|---|---|---|---|
| Local dev | `npm run dev0` (`next dev`) | `uvicorn app.main:app --reload`, `RECRUITMENT_API_URL=http://localhost:8000` | SQLite (`backend/recruitment.db`), `dev_mode` true, local-disk file storage under `backend/storage/` |
| Production | Azure Web App (Node/Next.js), per CI workflow | Azure Web App for Containers `techspecialist-api` (resource group `techspecialist`), image `techspecialistacr.azurecr.io/recruitment-api:latest` | Postgres (per `backend/.env.example`), Azure Blob Storage |

**Gap worth flagging:** there is no CI/CD workflow in `.github/workflows/` for the `backend/` service, and no `docker-compose.yml` tying frontend and backend together. The backend has a `Dockerfile` (`python:3.12-slim`, exposes port 8000), and deployment is a **manual, human-run process**: `az acr build --registry techspecialistacr --image recruitment-api:latest ./backend` (rebuilds and pushes the image from the local `backend/` directory — not from git, so uncommitted local changes get deployed too if you're not careful), then `az webapp restart --name techspecialist-api --resource-group techspecialist`. See [07-deployment-and-operations.md](07-deployment-and-operations.md) for the full sequence and a real operational quirk (the first restart after a build sometimes still serves the old cached image — verify a field/behavior only the new code has before declaring the deploy done, don't just trust `/health`).

A stray `out/` directory exists at the repo root (looks like a static export from `next export`/`output: 'export'` at some point), but the current `next.config.mjs` has no `output: 'export'` setting and `package.json`'s `build` script is plain `next build`. Treat `out/` as a stale build artifact unless someone confirms otherwise — it's not part of the live build pipeline.
