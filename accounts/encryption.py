"""
Symmetric encryption for sensitive model fields (API keys, passwords).

Usage:
    from accounts.encryption import encrypt, decrypt
    db_value = encrypt('my-secret-password')
    plain    = decrypt(db_value)

The encryption key comes from settings.FIELD_ENCRYPTION_KEY (set as Railway env var).
If absent in DEBUG mode, a deterministic dev key is used so local development works
without setup. NEVER rely on the dev key in production.
"""
import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


def _get_fernet():
    key = getattr(settings, 'FIELD_ENCRYPTION_KEY', None)
    if not key:
        if settings.DEBUG:
            # Deterministic dev key — fine for local sqlite, not for prod
            key = base64.urlsafe_b64encode(
                hashlib.sha256(b'dev-only-key-do-not-use-in-prod').digest()
            ).decode()
        else:
            raise RuntimeError(
                'FIELD_ENCRYPTION_KEY environment variable is required in production.'
            )
    # Allow either a plain Fernet key or any string (we hash it to 32 bytes)
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except (ValueError, TypeError):
        derived = base64.urlsafe_b64encode(
            hashlib.sha256(key.encode() if isinstance(key, str) else key).digest()
        )
        return Fernet(derived)


def encrypt(plain: str) -> str:
    if not plain:
        return ''
    return _get_fernet().encrypt(plain.encode()).decode()


def decrypt(token: str) -> str:
    if not token:
        return ''
    try:
        return _get_fernet().decrypt(token.encode()).decode()
    except (InvalidToken, ValueError):
        return ''
