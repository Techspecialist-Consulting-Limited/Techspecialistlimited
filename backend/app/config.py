from pydantic_settings import BaseSettings


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
    realtime_vad_threshold: float = 0.5
    realtime_vad_prefix_padding_ms: int = 300
    realtime_vad_silence_duration_ms: int = 500
    realtime_max_session_seconds: int = 1800
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
    sender_email: str = "noreply@techspecialistlimited.com"
    sender_display_name: str = "TechSpecialist Limited Recruitment Team"
    hr_notification_email: str = ""  # comma-separated list; new-applicant alerts go here

    # Auth
    api_key: str = "dev-api-key-123"
    jwt_secret: str = "dev-jwt-secret-456"
    hr_password: str = "admin123"

    # Frontend
    frontend_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
