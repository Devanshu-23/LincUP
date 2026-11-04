
import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

# Keep the secret outside the source code.
SECRET_KEY = os.getenv("LINCUP_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "LINCUP_SECRET_KEY environment variable is not set"
    )

ALGO = "HS256"
Token_Validity = 30


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=Token_Validity
    )

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGO)


def verify_access_token(token: str) -> int:
    payload = jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGO],
    )

    user_id = payload.get("sub")

    if user_id is None:
        raise JWTError("Token has no user identity")

    try:
        return int(user_id)
    except (TypeError, ValueError) as exc:
        raise JWTError("Invalid user identity in token") from exc
