from app.routers.analytics import router as analytics_router
from app.routers.applications import router as applications_router
from app.routers.jobs import router as jobs_router
from app.routers.hr_review import router as hr_review_router
from app.routers.assessment import router as assessment_router
from app.routers.assessment_ws import router as assessment_ws_router
from app.routers.auth import router as auth_router
from app.routers.interviews import router as interviews_router

__all__ = [
    "analytics_router",
    "applications_router",
    "jobs_router",
    "hr_review_router",
    "assessment_router",
    "assessment_ws_router",
    "auth_router",
    "interviews_router",
]
