import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt

RESET_TOKEN_TTL = timedelta(hours=1)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def generate_reset_token() -> tuple[str, str, datetime]:
    """Returns (raw_token_for_email_link, sha256_hash_to_store, expiry)."""
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    expires_at = datetime.now(timezone.utc) + RESET_TOKEN_TTL
    return raw_token, token_hash, expires_at


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
