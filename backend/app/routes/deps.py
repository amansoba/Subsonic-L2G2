from __future__ import annotations

from typing import Optional

from fastapi import Cookie, Depends, HTTPException, status

from app.factory.dao_factory import factory
from app.models.user import Session, User


def get_session(session: Optional[str] = Cookie(default=None)) -> Session:
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing session cookie",
        )
    s = factory.sessions.get(session)
    if not s:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )
    return s


def get_current_user(s: Session = Depends(get_session)) -> User:
    user = factory.users.get_by_id(s.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
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
    if user.role not in ("admin", "provider"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Provider or admin access required",
        )
    return user
