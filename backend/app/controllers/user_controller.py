from __future__ import annotations

from typing import List, Optional

from app.dao.user_dao import verify_firebase_token
from app.factory.dao_factory import factory
from app.models.user import User


def login(id_token: str, role: Optional[str] = None) -> User:
    """Verify the Firebase ID token and upsert the user.

    Returns the authenticated ``User``.  Session management is no longer
    needed — every request carries its own Bearer token.
    """
    claims = verify_firebase_token(id_token)
    email = claims.get("email", "unknown")
    print(f"[DEBUG] Processing login/register for {email} with requested_role={role}")
    
    user = factory.users.upsert_from_identity(
        firebase_uid=claims["uid"],
        email=email,
        full_name=claims.get("name"),
        requested_role=role,
    )
    print(f"[DEBUG] User {email} resolved to role: {user.role}")
    return user


def get_all_users() -> List[User]:
    return factory.users.get_all()


def get_user_by_id(user_id: int) -> Optional[User]:
    return factory.users.get_by_id(user_id)


def update_user(user_id: int, data: dict) -> Optional[User]:
    return factory.users.update(user_id, **data)


def delete_user(user_id: int) -> bool:
    return factory.users.delete(user_id)
