
from pwdlib import PasswordHash

# Password hashing using Argon2
password_hash = PasswordHash.recommended()
def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    return password_hash.verify(password, stored_hash)