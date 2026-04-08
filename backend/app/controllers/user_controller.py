from __future__ import annotations

from typing import List, Optional

from app.dao.user_dao import fake_verify_with_firebase
from app.factory.dao_factory import factory
from app.models.user import Session, User


def login(id_token: str) -> tuple[User, Session]:
    claims = fake_verify_with_firebase(id_token)
    user = factory.users.upsert_from_identity(
        firebase_uid=claims["uid"],
        email=claims["email"],
        full_name=claims.get("name"),
    )
    session = factory.sessions.create(user)
    return user, session


def get_current_user(session_id: str) -> Optional[User]:
    session = factory.sessions.get(session_id)
    if not session:
        return None
    return factory.users.get_by_id(session.user_id)


def get_all_users() -> List[User]:
    return factory.users.get_all()


def get_user_by_id(user_id: int) -> Optional[User]:
    return factory.users.get_by_id(user_id)


def update_user(user_id: int, data: dict) -> Optional[User]:
    return factory.users.update(user_id, **data)


def delete_user(user_id: int) -> bool:
    return factory.users.delete(user_id)
