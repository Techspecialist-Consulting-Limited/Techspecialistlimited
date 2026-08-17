import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog

# Used when an action is genuinely automatic rather than staff-initiated, so that a null
# performed_by never has to be read as "we don't know who did this".
SYSTEM_ACTOR = "system"


def actor_label(payload: dict | None, fallback: str = SYSTEM_ACTOR) -> str:
    """Turn a decoded HR token into the identity recorded against an audit entry.

    Prefers the email in `sub` because that is what HR staff recognise in the timeline;
    falls back to the user id when a token predates that claim.
    """
    if not payload:
        return fallback
    return payload.get("sub") or payload.get("uid") or fallback


async def log_action(
    db: AsyncSession,
    application_id: str | uuid.UUID,
    action: str,
    detail: str | None = None,
    performed_by: str | None = None,
) -> AuditLog:
    if isinstance(application_id, str):
        application_id = uuid.UUID(application_id)
    log = AuditLog(
        application_id=application_id,
        action=action,
        detail=detail,
        performed_by=performed_by,
    )
    db.add(log)
    await db.commit()
    return log


async def get_audit_logs(
    db: AsyncSession,
    application_id: str | uuid.UUID,
    limit: int = 50,
) -> list[AuditLog]:
    from sqlalchemy import select

    if isinstance(application_id, str):
        application_id = uuid.UUID(application_id)

    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.application_id == application_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
