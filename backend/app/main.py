from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings, verify_startup_secrets
from app.database import engine, Base
from app.routers import (
    analytics_router,
    applications_router,
    jobs_router,
    hr_review_router,
    assessment_router,
    assessment_ws_router,
    assessment_realtime_ws_router,
    auth_router,
    interviews_router,
    hr_settings_router,
    ai_readiness_router,
    scorecards_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    verify_startup_secrets()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    from app.migrate import run_migrations, seed_defaults
    await run_migrations()
    await seed_defaults()
    yield
    await engine.dispose()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Topic-Label", "X-Conversation-Id", "X-Interview-Done", "X-AI-Text"],
)

app.include_router(analytics_router)
app.include_router(applications_router)
app.include_router(jobs_router)
app.include_router(hr_review_router)
app.include_router(assessment_router)
app.include_router(assessment_ws_router)
app.include_router(assessment_realtime_ws_router)
app.include_router(auth_router)
app.include_router(interviews_router)
app.include_router(hr_settings_router)
app.include_router(ai_readiness_router)
app.include_router(scorecards_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
