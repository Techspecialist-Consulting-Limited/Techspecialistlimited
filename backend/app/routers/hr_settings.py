import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_hr_token
from app.config import settings
from app.database import get_db
from app.models.hr_user import HrUser
from app.services.email_service import send_hr_invite_email
from app.services.hr_auth_service import generate_reset_token, hash_password
from app.services.settings_service import get_settings_snapshot, load_dynamic_settings, update_settings

router = APIRouter(prefix="/api/hr", tags=["hr-settings"])


# ── App settings (branding + notifications) ──

class SettingsResponse(BaseModel):
    company_name: str
    brand_color: str
    logo_url: str
    sender_display_name: str
    notification_emails: list[str]


class SettingsUpdateRequest(BaseModel):
    company_name: str
    brand_color: str
    logo_url: str
    sender_display_name: str
    notification_emails: list[str]


def _to_response(snapshot: dict[str, str]) -> SettingsResponse:
    emails = [e.strip() for e in snapshot["hr_notification_email"].split(",") if e.strip()]
    return SettingsResponse(
        company_name=snapshot["company_name"],
        brand_color=snapshot["brand_color"],
        logo_url=snapshot["logo_url"],
        sender_display_name=snapshot["sender_display_name"],
        notification_emails=emails,
    )


@router.get("/settings", response_model=SettingsResponse)
async def get_settings(
    _: dict = Depends(verify_hr_token), db: AsyncSession = Depends(get_db)
):
    await load_dynamic_settings(db)
    return _to_response(get_settings_snapshot())


@router.put("/settings", response_model=SettingsResponse)
async def put_settings(
    req: SettingsUpdateRequest,
    _: dict = Depends(verify_hr_token),
    db: AsyncSession = Depends(get_db),
):
    snapshot = await update_settings(db, {
        "company_name": req.company_name.strip(),
        "brand_color": req.brand_color.strip(),
        "logo_url": req.logo_url.strip(),
        "sender_display_name": req.sender_display_name.strip(),
        "hr_notification_email": ",".join(e.strip() for e in req.notification_emails if e.strip()),
    })
    return _to_response(snapshot)


# ── HR user accounts ──

class HrUserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    is_active: bool

    model_config = {"from_attributes": True}


class InviteHrUserRequest(BaseModel):
    name: str
    email: str


class UpdateHrUserRequest(BaseModel):
    is_active: bool


@router.get("/users", response_model=list[HrUserResponse])
async def list_hr_users(
    _: dict = Depends(verify_hr_token), db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(HrUser).order_by(HrUser.created_at))
    return result.scalars().all()


@router.post("/users", response_model=HrUserResponse, status_code=201)
async def invite_hr_user(
    req: InviteHrUserRequest,
    _: dict = Depends(verify_hr_token),
    db: AsyncSession = Depends(get_db),
):
    email = req.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=400, detail="Please enter a valid email address")

    existing = await db.execute(select(HrUser).where(func.lower(HrUser.email) == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An HR account with this email already exists")

    raw_token, token_hash, expires_at = generate_reset_token()
    user = HrUser(
        name=req.name.strip(),
        email=email,
        password_hash=hash_password(uuid.uuid4().hex),  # unusable placeholder until set-password link is used
        reset_token_hash=token_hash,
        reset_token_expires_at=expires_at,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    set_password_link = f"{settings.frontend_url}/hr/reset-password?token={raw_token}"
    await send_hr_invite_email(user.email, user.name, set_password_link)
    return user


@router.patch("/users/{user_id}", response_model=HrUserResponse)
async def update_hr_user(
    user_id: uuid.UUID,
    req: UpdateHrUserRequest,
    _: dict = Depends(verify_hr_token),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(HrUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="HR account not found")

    if not req.is_active:
        active_count = await db.execute(
            select(func.count()).select_from(HrUser).where(HrUser.is_active.is_(True))
        )
        if active_count.scalar_one() <= 1 and user.is_active:
            raise HTTPException(status_code=400, detail="Cannot deactivate the last active HR account")

    user.is_active = req.is_active
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}")
async def delete_hr_user(
    user_id: uuid.UUID,
    _: dict = Depends(verify_hr_token),
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(HrUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="HR account not found")

    total_count = await db.execute(select(func.count()).select_from(HrUser))
    if total_count.scalar_one() <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last remaining HR account")

    await db.delete(user)
    await db.commit()
    return {"message": "HR account removed"}
