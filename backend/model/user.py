from __future__ import annotations

import os
import time
import uuid
from dataclasses import dataclass
from typing import Dict, Literal, Optional


UserRole = Literal["client", "provider", "admin"]


@dataclass
class User:
    id: int
    firebase_uid: str
    email: str
    full_name: str | None
    role: UserRole = "client"


class InMemoryUserDAO:
    def __init__(self) -> None:
        self._users_by_id: Dict[int, User] = {}
        self._users_by_firebase_uid: Dict[str, User] = {}
        self._next_id: int = 1

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self._users_by_id.get(user_id)

    def get_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        return self._users_by_firebase_uid.get(firebase_uid)

    def upsert_from_identity(
        self,
        *,
        firebase_uid: str,
        email: str,
        full_name: str | None,
        default_role: UserRole = "client",
    ) -> User:
        existing = self.get_by_firebase_uid(firebase_uid)
        if existing:
            existing.email = email
            existing.full_name = full_name
            return existing

        user = User(
            id=self._next_id,
            firebase_uid=firebase_uid,
            email=email,
            full_name=full_name,
            role=default_role,
        )
        self._users_by_id[user.id] = user
        self._users_by_firebase_uid[user.firebase_uid] = user
        self._next_id += 1
        return user


user_dao = InMemoryUserDAO()


@dataclass
class Session:
    id: str
    user_id: int
    created_at: float


class SessionStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, Session] = {}

    def create(self, user: User) -> Session:
        sid = uuid.uuid4().hex
        session = Session(id=sid, user_id=user.id, created_at=time.time())
        self._sessions[sid] = session
        return session

    def get(self, session_id: str) -> Optional[Session]:
        return self._sessions.get(session_id)


session_store = SessionStore()


def fake_verify_with_firebase(id_token: str) -> Dict[str, str]:
    demo_token = os.getenv("SUBSONIC_DEMO_IDTOKEN", "demo-token")
    if id_token != demo_token:
        raise ValueError("Invalid ID token")

    return {
        "uid": "firebase-demo-uid",
        "email": "demo@subsonic.test",
        "name": "Demo User",
    }

