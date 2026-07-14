import logging

from sqlalchemy import select, text

from app.config import settings
from app.database import async_session, engine
from app.services.hr_auth_service import hash_password

logger = logging.getLogger(__name__)


async def run_migrations():
    dialect = engine.dialect.name
    logger.info(f"Running migrations for dialect: {dialect}")

    async with engine.connect() as conn:
        if dialect == "sqlite":
            result = await conn.execute(
                text("SELECT sql FROM sqlite_master WHERE type='table' AND name='job_postings'")
            )
            row = result.fetchone()
            if row and row[0] and "is_deleted" not in row[0]:
                logger.info("Adding is_deleted column to job_postings")
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN is_deleted BOOLEAN DEFAULT 0"))
            if row and row[0] and "is_closed" not in row[0]:
                logger.info("Adding is_closed column to job_postings")
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN is_closed BOOLEAN DEFAULT 0"))
            if row and row[0] and "department" not in row[0]:
                logger.info("Adding department column to job_postings")
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN department TEXT DEFAULT ''"))
            if row and row[0] and "location" not in row[0]:
                logger.info("Adding location column to job_postings")
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN location TEXT DEFAULT ''"))
            if row and row[0] and "type" not in row[0]:
                logger.info("Adding type column to job_postings")
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN type TEXT DEFAULT 'Full-time'"))
            if row and row[0] and "auto_advance_enabled" not in row[0]:
                logger.info("Adding auto_advance_enabled column to job_postings")
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN auto_advance_enabled BOOLEAN DEFAULT 0"))
            if row and row[0] and "auto_advance_pass_mark" not in row[0]:
                logger.info("Adding auto_advance_pass_mark column to job_postings")
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN auto_advance_pass_mark REAL DEFAULT 70.0"))
            if row and row[0] and "auto_advance_delay_minutes" not in row[0]:
                logger.info("Adding auto_advance_delay_minutes column to job_postings")
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN auto_advance_delay_minutes INTEGER DEFAULT 5"))

            result2 = await conn.execute(
                text("SELECT sql FROM sqlite_master WHERE type='table' AND name='applications'")
            )
            row2 = result2.fetchone()
            if row2 and row2[0] and "is_archived" not in row2[0]:
                logger.info("Adding is_archived column to applications")
                await conn.execute(text("ALTER TABLE applications ADD COLUMN is_archived BOOLEAN DEFAULT 0"))
            if row2 and row2[0] and "assessment_sent_at" not in row2[0]:
                logger.info("Adding assessment_sent_at column to applications")
                await conn.execute(text("ALTER TABLE applications ADD COLUMN assessment_sent_at TIMESTAMP"))
            if row2 and row2[0] and "assessment_expires_at" not in row2[0]:
                logger.info("Adding assessment_expires_at column to applications")
                await conn.execute(text("ALTER TABLE applications ADD COLUMN assessment_expires_at TIMESTAMP"))

            result3 = await conn.execute(
                text("SELECT sql FROM sqlite_master WHERE type='table' AND name='conversation_sessions'")
            )
            row3 = result3.fetchone()
            if row3 and row3[0] and "engine" not in row3[0]:
                logger.info("Adding engine column to conversation_sessions")
                await conn.execute(text("ALTER TABLE conversation_sessions ADD COLUMN engine TEXT DEFAULT 'legacy'"))
        else:
            try:
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE"))
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE"))
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS department TEXT DEFAULT ''"))
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS location TEXT DEFAULT ''"))
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Full-time'"))
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS auto_advance_enabled BOOLEAN DEFAULT FALSE"))
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS auto_advance_pass_mark DOUBLE PRECISION DEFAULT 70.0"))
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS auto_advance_delay_minutes INTEGER DEFAULT 5"))
                await conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE"))
                await conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS assessment_sent_at TIMESTAMP"))
                await conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS assessment_expires_at TIMESTAMP"))
                await conn.execute(text("ALTER TABLE conversation_sessions ADD COLUMN IF NOT EXISTS engine TEXT DEFAULT 'legacy'"))
            except Exception as e:
                logger.warning(f"Migration error (may be harmless): {e}")

        await conn.commit()

    logger.info("Migrations complete")


async def seed_defaults():
    """Idempotent seed: the original hardcoded HR account (so login keeps working
    after the multi-user migration) and app_settings defaults from env config."""
    from app.models.hr_user import HrUser
    from app.models.app_setting import AppSetting

    async with async_session() as session:
        result = await session.execute(select(HrUser))
        if result.first() is None:
            logger.info("Seeding initial HR account from HR_PASSWORD env var")
            session.add(HrUser(
                email="hr@company.com",
                name="HR Admin",
                password_hash=hash_password(settings.hr_password),
            ))

        defaults = {
            "company_name": settings.company_name,
            "brand_color": settings.brand_color,
            "logo_url": settings.logo_url,
            "sender_display_name": settings.sender_display_name,
            "hr_notification_email": settings.hr_notification_email,
        }
        for key, value in defaults.items():
            existing = await session.get(AppSetting, key)
            if existing is None:
                session.add(AppSetting(key=key, value=value or ""))

        await session.commit()

    # Overlay any already-saved DB settings onto the runtime singleton immediately,
    # so a fresh restart reflects prior HR edits without needing the first API call.
    from app.services.settings_service import load_dynamic_settings
    async with async_session() as session:
        await load_dynamic_settings(session)