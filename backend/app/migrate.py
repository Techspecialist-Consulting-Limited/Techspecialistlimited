import logging

from sqlalchemy import text

from app.database import engine

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

            result2 = await conn.execute(
                text("SELECT sql FROM sqlite_master WHERE type='table' AND name='applications'")
            )
            row2 = result2.fetchone()
            if row2 and row2[0] and "is_archived" not in row2[0]:
                logger.info("Adding is_archived column to applications")
                await conn.execute(text("ALTER TABLE applications ADD COLUMN is_archived BOOLEAN DEFAULT 0"))
        else:
            try:
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE"))
                await conn.execute(text("ALTER TABLE job_postings ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE"))
                await conn.execute(text("ALTER TABLE applications ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE"))
            except Exception as e:
                logger.warning(f"Migration error (may be harmless): {e}")

        await conn.commit()

    logger.info("Migrations complete")