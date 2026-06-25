from fastapi import Depends, HTTPException, Header
from jose import JWTError, jwt

from app.config import settings


async def verify_hr_token(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
