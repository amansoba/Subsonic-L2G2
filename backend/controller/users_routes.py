from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel

from model.user import fake_verify_with_firebase, session_store, user_dao


class LoginRequest(BaseModel):
    id_token: str


class UserRead(BaseModel):
    id: int
    firebase_uid: str
    email: str
    full_name: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


router = APIRouter(prefix="/api", tags=["users"])


@router.post("/login", response_model=UserRead)
def login_with_identity_token(response: Response, payload: LoginRequest) -> UserRead:
    try:
        claims = fake_verify_with_firebase(payload.id_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ID token",
        )

    user = user_dao.upsert_from_identity(
        firebase_uid=claims["uid"],
        email=claims["email"],
        full_name=claims.get("name"),
    )

    session = session_store.create(user)
    response.set_cookie(
        key="session",
        value=session.id,
        httponly=True,
        secure=False,
        samesite="lax",
    )

    return UserRead.model_validate(user)


def _require_session(session: Optional[str] = Cookie(default=None)):
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing session cookie",
        )

    s = session_store.get(session)
    if not s:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )
    return s


@router.get("/me", response_model=UserRead)
def get_current_user(session=Depends(_require_session)) -> UserRead:
    user = user_dao.get_by_id(session.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserRead.model_validate(user)

