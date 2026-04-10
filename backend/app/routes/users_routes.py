from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.controllers import user_controller
from app.routes.deps import get_current_user, require_admin
from app.schemas.user_schema import UserRead, UserUpdate

router = APIRouter(prefix="/api", tags=["users"])


class LoginRequest(BaseModel):
    id_token: str


def _user_to_read(user) -> UserRead:
    return UserRead(
        id=user.id,
        name=user.full_name,
        email=user.email,
        role=user.role,
        joinDate=user.join_date,
    )


@router.post("/login", response_model=UserRead)
def login(payload: LoginRequest) -> UserRead:
    """Verify the Firebase ID token and return the user profile.

    The frontend is responsible for storing the Firebase token and sending
    it as ``Authorization: Bearer <token>`` on subsequent requests.
    """
    try:
        user = user_controller.login(payload.id_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ID token",
        )
    return _user_to_read(user)


@router.post("/logout", status_code=200)
def logout():
    """No-op — stateless auth.  The frontend simply discards its token."""
    return {"message": "Logged out"}


@router.get("/me", response_model=UserRead)
def get_me(user=Depends(get_current_user)) -> UserRead:
    return _user_to_read(user)


@router.put("/me", response_model=UserRead)
def update_me(data: UserUpdate, user=Depends(get_current_user)) -> UserRead:
    update_data = data.model_dump(exclude_none=True)
    if "name" in update_data:
        update_data["full_name"] = update_data.pop("name")
    updated = user_controller.update_user(user.id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_read(updated)


@router.get("/users", response_model=List[UserRead])
def list_users(admin=Depends(require_admin)) -> List[UserRead]:
    return [_user_to_read(u) for u in user_controller.get_all_users()]


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: int, admin=Depends(require_admin)) -> UserRead:
    user = user_controller.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_read(user)


@router.put("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, data: UserUpdate, admin=Depends(require_admin)) -> UserRead:
    update_data = data.model_dump(exclude_none=True)
    if "name" in update_data:
        update_data["full_name"] = update_data.pop("name")
    updated = user_controller.update_user(user_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_read(updated)


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, admin=Depends(require_admin)):
    if not user_controller.delete_user(user_id):
        raise HTTPException(status_code=404, detail="User not found")
