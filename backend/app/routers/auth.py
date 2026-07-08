from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import verify_hr_token
from app.config import settings
from app.database import get_db
from app.models.hr_user import HrUser
from app.services.email_service import send_password_reset_email
from app.services.hr_auth_service import (
    generate_reset_token,
    hash_password,
    hash_token,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(HrUser).where(func.lower(HrUser.email) == req.email.strip().lower())
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = jwt.encode(
        {"sub": user.email, "uid": str(user.id), "exp": datetime.utcnow() + timedelta(hours=8)},
        settings.jwt_secret,
        algorithm="HS256",
    )
    return {"token": token}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(HrUser).where(func.lower(HrUser.email) == req.email.strip().lower())
    )
    user = result.scalar_one_or_none()
    if user and user.is_active:
        raw_token, token_hash, expires_at = generate_reset_token()
        user.reset_token_hash = token_hash
        user.reset_token_expires_at = expires_at
        await db.commit()
        reset_link = f"{settings.frontend_url}/hr/reset-password?token={raw_token}"
        await send_password_reset_email(user.email, user.name, reset_link)

    return {"message": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_hash = hash_token(req.token)
    now = datetime.now(timezone.utc)
    result = await db.execute(select(HrUser).where(HrUser.reset_token_hash == token_hash))
    user = result.scalar_one_or_none()

    expires_at = user.reset_token_expires_at if user else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if not user or not expires_at or expires_at < now:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    user.password_hash = hash_password(req.new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    await db.commit()
    return {"message": "Password updated. You can now sign in."}


@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    payload: dict = Depends(verify_hr_token),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(HrUser).where(HrUser.email == payload["sub"]))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.password_hash = hash_password(req.new_password)
    await db.commit()
    return {"message": "Password updated"}
