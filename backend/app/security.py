import hashlib
import secrets
from pwdlib import PasswordHash

# Password hashing using Argon2
password_hash = PasswordHash.recommended()
def hash_password(password: str) -> str:
    """Convert a plain-text password into a secure hash."""
    return password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    """Check a password against its stored hash."""
    return password_hash.verify(password, stored_hash)


def generate_verification_token() -> str:
    """Generate a secure random token for email verification."""
    return secrets.token_urlsafe(32)


def hash_verification_token(token: str) -> str:
    """Hash the verification token before storing it in the database."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
