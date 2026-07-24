# Deployment and Operations

## Summary

The frontend has a clear CI/CD path to Azure Web App. The backend does not — it has a `Dockerfile` but no CI workflow in this repository; it's deployed **manually**, by a human running two Azure CLI commands (documented below). There's also declared-but-unused infrastructure (Celery/Redis) worth knowing about before assuming background job processing exists.

## Running locally

**Frontend:**
```
npm install
npm run dev0      # next dev — note: not the default "dev" script name
```
Requires `.env.local` with, at minimum, `RECRUITMENT_API_URL=http://localhost:8000` and the Supabase keys for the fallback paths to work.

**Backend:**
```
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Requires `backend/.env` (see `backend/.env.example` for the full list). With no `DATABASE_URL` override, it defaults to a local SQLite file (`backend/recruitment.db`) and `dev_mode`, which also switches file storage to local disk and email sending to console-logging instead of calling Resend.

On every startup (`app/main.py`'s lifespan hook), the backend:
1. Creates any missing tables (`Base.metadata.create_all`).
2. Runs `run_migrations()` — hand-rolled `ALTER TABLE` statements for columns added after initial deployment (see below).
3. Runs `seed_defaults()` — creates a default HR account (`hr@company.com`, password from `HR_PASSWORD`) and default `app_settings` rows if they don't exist.

## Deployment

**Frontend:** confirmed as of 2026-07-24 — **Vercel** (project `techspecialistlimited`) is the live, authoritative deployment of `techspecialistlimited.com`, deployed via `vercel --prod` from the repo root (or a git-triggered Vercel build). A `.github/workflows/main_techspecialist-limited.yml` workflow also exists, building and deploying to an **Azure Web App** named `Techspecialist-Limited` on every push to `main` — this pipeline still runs but is **not** what serves live traffic; don't assume it is during an incident. `RECRUITMENT_API_URL` and `NEXT_PUBLIC_ASSESSMENT_WS_URL` (the backend URLs — the latter baked in at build time since it's used client-side) are set in Vercel's project environment variables, not GitHub Actions secrets.

**Backend:** has a `Dockerfile` (`python:3.12-slim`, installs `requirements.txt`, runs `uvicorn app.main:app --host 0.0.0.0 --port 8000`), and no matching GitHub Actions workflow exists in `.github/workflows/` — deployment is entirely manual. Confirmed live setup as of 2026-07-24:

- **Where it runs:** Azure Web App for Containers, name `techspecialist-api-eastus2`, resource group `techspecialist`, region `eastus2`. URL: `https://techspecialist-api-eastus2.azurewebsites.net`. Deliberately co-located with the Realtime (`taofeeq-4580-resource`) and Whisper (`taofe-mqjku99p-eastus2`) AI resources, both also in East US 2 — the backend previously ran in Canada Central, which added a real cross-region network hop to every frame of the live voice interview that local testing never had, and was a genuine contributor to production-only interview reliability issues. See [[project_backend-region-migration]] in memory for the full story.
  - A prior Web App, `techspecialist-api` (Canada Central), is kept temporarily as a rollback target (through roughly 2026-07-31) — kept in sync with identical app settings and the same deployed image, but not receiving live traffic. Confirm it still exists before relying on it as a rollback; it may have been decommissioned since.
- **Image registry:** Azure Container Registry `techspecialistacr`, image `recruitment-api:latest` (registry itself did not move regions).
- **Deploy sequence** (run from the repo root, needs the Azure CLI logged in with access to the `techspecialist` resource group):
  ```bash
  az acr build --registry techspecialistacr --image recruitment-api:latest ./backend
  az webapp restart --name techspecialist-api-eastus2 --resource-group techspecialist
  ```
  **Config vars added locally must also be set on the live Web App(s)** — updating `backend/.env`/`.env.example` does not propagate to Azure automatically. This was missed for a full session once (`APPLICANT_REPLY_TO_EMAIL`), silently disabling a shipped feature in production while it worked fine locally. Use `az webapp config appsettings set --name techspecialist-api-eastus2 --resource-group techspecialist --settings KEY=value` for any new var.
  `az acr build` uploads and builds from the **local `backend/` directory on disk** — not from git — so uncommitted local changes get deployed too if the working tree isn't clean when you run it. Check `git status backend/` first if that matters to you.
- **Two operational quirks worth knowing before you trust a "successful" deploy:**
  1. On Windows, `az acr build`'s local log streaming can crash mid-build with `UnicodeEncodeError: 'charmap' codec can't encode characters` (a `colorama`/`cp1252` console issue) — this is cosmetic, the remote build usually keeps running fine. Don't treat a crashed local stream as a failed build; check the real status with `az acr task list-runs --registry techspecialistacr --top 1 --query "[0].status" -o tsv` instead.
  2. **A single `az webapp restart` doesn't reliably pull the new image.** `/health` can return `200 OK` while the container is still silently serving the *previous* cached image (the App Service host doesn't always force a fresh `docker pull` on a plain restart when the tag name — `latest` — hasn't changed). After restarting, verify a field or behavior that only exists in the new code (e.g. `curl .../api/jobs` and check for a newly-added response field) before declaring the deploy done — don't just trust the health check. If the new code isn't there yet, restart again.
- **Database migrations** run automatically on backend startup (see below), so a fresh Postgres column added in this deploy takes effect on the same restart — no separate migration step needed.

## Database migrations — read before touching the schema

Despite a `backend/alembic/` directory existing, **it is completely empty** — no `alembic.ini`, no `env.py`, no versioned migration files, and no Alembic import anywhere in the code. This project does **not** use Alembic in practice.

The actual mechanism is `backend/app/migrate.py`, run automatically on every app startup:
- New tables are created automatically from the SQLAlchemy models.
- New *columns* on existing tables are added via dialect-aware `ALTER TABLE` statements hardcoded in `run_migrations()` (a separate SQLite branch and Postgres branch). As of this writing, these patch in: `job_postings.is_deleted/is_closed/department/location/type/auto_advance_enabled/auto_advance_pass_mark/auto_advance_delay_minutes/interview_max_minutes`, `applications.is_archived/assessment_sent_at/assessment_expires_at`, `conversation_sessions.engine`. The `interview_scorecards` table itself is new but created wholesale from the ORM model (`Base.metadata.create_all`), not via a hand-rolled `ALTER TABLE` — only *added columns on existing tables* need the manual migration step.

**Practical implication:** if you need to add a new column to an existing table, you add it to the model *and* add a matching `ALTER TABLE ... ADD COLUMN` line to `run_migrations()` — there's no `alembic revision --autogenerate` workflow to lean on. If you need to drop a column, rename a column, or do anything more complex than "add a nullable column," this hand-rolled approach won't help you and you'll need to write the migration by hand (and probably introduce real Alembic at that point).

## Background jobs: declared but not implemented

`requirements.txt` lists `celery[redis]` and `redis`, and `config.py` defines `redis_url`. **No Celery app, task decorator, beat schedule, or worker process exists anywhere in the codebase.** The one function that looks like a background task — `backend/app/workers/tasks.py`'s `run_screening()` — is called directly and synchronously (`await run_screening(...)`) inline inside `POST /api/applications`, blocking that HTTP request until the GPT-4o call completes.

**Practical implications:**
- Don't assume there's a job queue you can push work onto — there isn't one yet, despite the dependency being present.
- CV screening latency is directly the candidate's page-load latency for the application form. If Azure OpenAI is slow, the application form is slow.
- If a real queue is ever introduced (there's a clear future use case here — moving AI screening off the request path), it would need actual Celery/RQ/similar wiring added, not just relying on the currently-listed dependencies.

## Testing

There is no `pytest`/CI-wired test suite for the backend. What exists:
- `backend/test_api.py`, `test_full_flow.py`, `test_submit.py` — standalone scripts that exercise a *running* server (job creation → application submission → screening → approval), useful as manual smoke tests or as a reference for the request/response shapes, but they don't run in CI.
- `backend/tests/test_realtime_advance_topic.py` — the one genuine unit test (no pytest framework, run via `python tests/test_realtime_advance_topic.py`), covering the interview topic/turn-count state machine (`advance_topic()` in `realtime_interviewer.py`). If you change interview-flow logic, run this and consider extending it.

No frontend test suite was found either (`npm run test` in the CI workflow is a no-op — `--if-present` and no `test` script exists in `package.json`).

## Known operational debt, summarized

| Item | Risk if ignored |
|---|---|
| No Alembic, hand-rolled column migrations | Schema changes beyond "add a nullable column" require manual work and are easy to get wrong across SQLite/Postgres |
| Celery/Redis declared but unused | AI screening runs in-request; a slow AI provider directly slows down the public application form |
| No backend CI/CD workflow found | Production backend deployment process is undocumented — confirm and record it |
| No automated test suite (backend or frontend) | Regressions in the interview state machine or screening logic won't be caught before production |
| Two Supabase/backend data stores for jobs & applications | See [02-data-model-and-storage.md](02-data-model-and-storage.md) — silent data loss during backend outages |
