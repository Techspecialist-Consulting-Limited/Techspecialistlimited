from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(req: LoginRequest):
    if req.email == "hr@company.com" and req.password == settings.hr_password:
        token = jwt.encode(
            {"sub": req.email, "exp": datetime.utcnow() + timedelta(hours=8)},
            settings.jwt_secret,
            algorithm="HS256",
        )
        return {"token": token}
    raise HTTPException(status_code=401, detail="Invalid credentials")
