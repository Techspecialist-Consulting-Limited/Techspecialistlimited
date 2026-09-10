import logging

from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# These placeholders exist so the app runs out of the box locally. They are published in
# source control, so treating them as usable credentials anywhere real is the same as
# having no credential at all. verify_startup_secrets() below refuses to start on them.
DEV_API_KEY = "dev-api-key-123"
DEV_JWT_SECRET = "dev-jwt-secret-456"
DEV_HR_PASSWORD = "admin123"


class Settings(BaseSettings):
    app_name: str = "Recruitment Platform"
    cors_origins: str = "http://localhost:3000,https://techspecialistlimited.com"

    # --- Mode ---
    dev_mode: bool = True

    # Azure OpenAI (for GPT-4o)
    azure_openai_endpoint: str = ""
    azure_openai_key: str = ""
    azure_openai_api_version: str = "2024-08-01-preview"
    gpt4o_deployment_name: str = "gpt-4o"

    # Whisper (can be a separate resource)
    azure_whisper_endpoint: str = ""
    azure_whisper_key: str = ""
    azure_whisper_api_version: str = "2024-06-01"
    whisper_deployment_name: str = "whisper"

    # Database (empty = SQLite for local dev)
    database_url: str = "sqlite+aiosqlite:///./recruitment.db"

    # Azure OpenAI TTS
    azure_tts_endpoint: str = ""
    azure_tts_key: str = ""
    azure_tts_api_version: str = "2024-08-01-preview"
    tts_deployment_name: str = "tts"
    tts_voice: str = "alloy"

    # Conversation settings
    topic_time_limit_seconds: int = 180
    max_turns_per_topic: int = 4

    # Azure OpenAI Realtime (gpt-realtime, GA protocol)
    azure_realtime_endpoint: str = ""
    azure_realtime_key: str = ""
    realtime_deployment_name: str = "gpt-realtime"
    realtime_voice: str = "alloy"
    # Semantic VAD uses a model (not just raw volume) to judge whether the candidate
    # has actually finished speaking, so it tolerates thinking pauses, filler words,
    # and quiet throat-clears far better than amplitude-based server_vad did.
    realtime_vad_eagerness: str = "low"  # low waits longer before responding (up to ~8s)
    realtime_noise_reduction_type: str = "far_field"  # far_field: laptop/room mics; near_field: headsets
    realtime_max_session_seconds: int = 2700  # hard safety cap above any per-job interview_max_minutes
    realtime_interview_enabled: bool = False

    # Redis (not needed in dev mode)
    redis_url: str = "redis://localhost:6379"

    # Azure Storage (local fallback in dev)
    azure_storage_connection_string: str = ""
    cvs_container_name: str = "cvs"
    assessments_container_name: str = "assessments"

    # Branding
    company_name: str = "TechSpecialist Limited"
    brand_color: str = "#4584ed"
    logo_url: str = "https://res.cloudinary.com/daqmbfctv/image/upload/v1772108889/WhatsApp_Image_2026-02-26_at_12.00.40-removebg-preview_qp8kjd.png"

    # Email (prints to console in dev)
    resend_api_key: str = ""
    sender_email: str = "recruitment@techspecialistlimited.com"
    sender_display_name: str = "TechSpecialist Limited Recruitment Team"
    hr_notification_email: str = ""  # comma-separated list; new-applicant alerts go here
    applicant_reply_to_email: str = ""  # comma-separated list; replies to applicant-facing emails land here

    # Auth
    api_key: str = DEV_API_KEY
    jwt_secret: str = DEV_JWT_SECRET
    hr_password: str = DEV_HR_PASSWORD

    # Frontend
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()


def _looks_like_production(s: Settings) -> bool:
    """Decide whether this process is serving real traffic.

    dev_mode is the intended signal, but it defaults to True, so a deployment that simply
    forgets to set DEV_MODE=False would skip every check below. Local development is
    always SQLite against a localhost frontend, so a real database plus a real frontend
    URL is treated as production regardless of what dev_mode claims.
    """
    if not s.dev_mode:
        return True
    on_real_database = not s.database_url.startswith("sqlite")
    on_real_frontend = not (
        "localhost" in s.frontend_url or "127.0.0.1" in s.frontend_url
    )
    return on_real_database and on_real_frontend


def verify_startup_secrets(s: Settings | None = None) -> list[str]:
    """Refuse to serve real traffic on the placeholder credentials in this file.

    Returns the names of settings still left at their published defaults. Raises in
    production rather than returning, so the failure is a refusal to start rather than a
    service that quietly accepts a known password.
    """
    s = s or settings

    at_default = [
        name
        for name, value, placeholder in (
            ("API_KEY", s.api_key, DEV_API_KEY),
            ("JWT_SECRET", s.jwt_secret, DEV_JWT_SECRET),
            ("HR_PASSWORD", s.hr_password, DEV_HR_PASSWORD),
        )
        if value == placeholder
    ]

    if not at_default:
        return []

    if _looks_like_production(s):
        raise RuntimeError(
            "Refusing to start: "
            + ", ".join(at_default)
            + " still hold the placeholder values published in app/config.py. "
            "Set them to real secrets in the environment. If this is a local machine, "
            "point DATABASE_URL at SQLite and FRONTEND_URL at localhost, or set DEV_MODE=True."
        )

    logger.warning(
        "Running with placeholder credentials for: %s. This is fine locally and must "
        "never reach a deployed environment.",
        ", ".join(at_default),
    )
    return at_default
