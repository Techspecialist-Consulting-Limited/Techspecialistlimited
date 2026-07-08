from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.app_setting import AppSetting

# Fields the HR settings page can edit. Values live in app_settings (DB) and are
# overlaid onto the `settings` singleton so the rest of the app (email templates,
# notification recipients) keeps reading `settings.<field>` unchanged.
OVERRIDABLE_KEYS = [
    "company_name",
    "brand_color",
    "logo_url",
    "sender_display_name",
    "hr_notification_email",
]


async def load_dynamic_settings(db: AsyncSession) -> None:
    result = await db.execute(select(AppSetting).where(AppSetting.key.in_(OVERRIDABLE_KEYS)))
    for row in result.scalars().all():
        setattr(settings, row.key, row.value)


def get_settings_snapshot() -> dict[str, str]:
    return {key: getattr(settings, key) for key in OVERRIDABLE_KEYS}


async def update_settings(db: AsyncSession, updates: dict[str, str]) -> dict[str, str]:
    for key, value in updates.items():
        if key not in OVERRIDABLE_KEYS:
            continue
        existing = await db.get(AppSetting, key)
        if existing:
            existing.value = value
        else:
            db.add(AppSetting(key=key, value=value))
        setattr(settings, key, value)
    await db.commit()
    return get_settings_snapshot()
