from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status

from app.dao.user_dao import verify_firebase_token
from app.factory.dao_factory import factory
from app.models.user import User


def _extract_bearer(request: Request) -> str:
    """Return the raw token from ``Authorization: Bearer <token>``."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )
    return auth[7:]


def get_current_user(request: Request) -> User:
    """Verify the Bearer token and return the corresponding ``User``.

    On the first request for a given Firebase UID the user is created via
    ``upsert_from_identity``.
    """
    token = _extract_bearer(request)
    try:
        claims = verify_firebase_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user = factory.users.upsert_from_identity(
        firebase_uid=claims["uid"],
        email=claims["email"],
        full_name=claims.get("name"),
    )
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


def require_provider(user: User = Depends(get_current_user)) -> User:
    if user.role != "provider":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Provider access required",
        )
    return user


def require_provider(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "provider"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Provider or admin access required",
        )
    return user
