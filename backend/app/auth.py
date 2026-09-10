from fastapi import Depends, HTTPException, Header
from jose import JWTError, jwt

from app.config import settings


async def verify_hr_token(authorization: str | None = Header(default=None)):
    # Declared optional so a missing header is answered with 401 rather than FastAPI's
    # 422 validation error. Callers (and the HR portal's redirect-to-login) treat "not
    # signed in" and "session expired" the same way, so both must return 401.
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
