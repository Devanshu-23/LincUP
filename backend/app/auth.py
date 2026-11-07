
import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

#from fastapi tut documentation
SECRET_KEY = os.getenv("LINCUP_KEY")
if not SECRET_KEY:
    raise RuntimeError("lincup_key environment variable is not set")

ALGO = "HS256"
TOKEN_VALIDITY = 30


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_VALIDITY)
    payload = {
        "sub": str(user_id),
        "exp": expires_at,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGO)


def verify_access_token(token: str) -> int:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGO])
    user_id = payload.get("sub")

    if user_id is None:
        raise JWTError("Token has no user identity")

    try:
        return int(user_id)
    except (TypeError, ValueError) as exc:
        raise JWTError("Invalid user identity in token") from exc
