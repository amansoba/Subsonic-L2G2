from __future__ import annotations

import json
import os
import time
import uuid
from datetime import date
from pathlib import Path
from typing import Dict, List, Optional

from app.models.user import Session, User

MOCKS_DIR = Path(__file__).resolve().parents[2] / "view" / "static" / "mocks"

_USE_FAKE_AUTH = os.getenv("SUBSONIC_USE_FAKE_AUTH", "true").lower() == "true"


def _is_admin_email(email: str) -> bool:
    """Return True if *email* is listed in SUBSONIC_ADMIN_EMAILS."""
    raw = os.getenv("SUBSONIC_ADMIN_EMAILS", "")
    if not raw.strip():
        return False
    admin_emails = [e.strip().lower() for e in raw.split(",") if e.strip()]
    return email.strip().lower() in admin_emails


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token.

    When ``SUBSONIC_USE_FAKE_AUTH=true`` (the default) the token is parsed
    using the legacy fake format ``uid:email:name`` so that development
    without a real Firebase project keeps working.

    When ``SUBSONIC_USE_FAKE_AUTH=false`` the token is verified against
    Firebase Auth using ``firebase_admin``.
    """
    if _USE_FAKE_AUTH:
        return _fake_verify(id_token)

    from firebase_admin import auth  # type: ignore

    decoded = auth.verify_id_token(id_token, clock_skew_seconds=5)
    return {
        "uid": decoded["uid"],
        "email": decoded.get("email", ""),
        "name": decoded.get("name"),
    }


def _fake_verify(id_token: str) -> dict:
    """Accept 'uid:email:name' tokens for testing, or the env demo token."""
    demo_token = os.getenv("SUBSONIC_DEMO_IDTOKEN", "demo-token")
    if id_token == demo_token:
        return {"uid": "firebase-demo-uid", "email": "demo@subsonic.test", "name": "Demo User"}
    parts = id_token.split(":")
    if len(parts) < 2:
        raise ValueError("Invalid token format")
    return {
        "uid": parts[0],
        "email": parts[1],
        "name": parts[2] if len(parts) > 2 else None,
    }



class InMemoryUserDAO:
    def __init__(self) -> None:
        self._users_by_id: Dict[int, User] = {}
        self._users_by_firebase_uid: Dict[str, User] = {}
        self._users_by_email: Dict[str, User] = {}
        self._next_id: int = 1
        self._load_from_mock()

    def _load_from_mock(self) -> None:
        mock_file = MOCKS_DIR / "users.json"
        if not mock_file.exists():
            return
        with open(mock_file, encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            uid = f"mock-{item['id']}"
            user = User(
                id=item["id"],
                firebase_uid=uid,
                email=item["email"],
                full_name=item.get("name"),
                role=item.get("role", "client"),
                join_date=item.get("joinDate", str(date.today())),
            )
            self._users_by_id[user.id] = user
            self._users_by_firebase_uid[user.firebase_uid] = user
            self._users_by_email[user.email] = user
        self._next_id = max(self._users_by_id.keys(), default=0) + 1

    def get_all(self) -> List[User]:
        return list(self._users_by_id.values())

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self._users_by_id.get(user_id)

    def get_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        return self._users_by_firebase_uid.get(firebase_uid)

    def get_by_email(self, email: str) -> Optional[User]:
        return self._users_by_email.get(email)

    def upsert_from_identity(
        self,
        *,
        firebase_uid: str,
        email: str,
        full_name: Optional[str],
        requested_role: Optional[str] = None,
        default_role: str = "client",
    ) -> User:
        # Determine effective role: admin whitelist takes priority
        # If requested_role is provided, use it, otherwise use existing or default
        base_role = requested_role or default_role
        effective_role = "admin" if _is_admin_email(email) else base_role

        existing = self.get_by_firebase_uid(firebase_uid)
        if existing:
            existing.email = email
            # Only update full_name if provided
            if full_name:
                existing.full_name = full_name
            
            # Only update role if explicitly requested (registration)
            # or if the user is an admin
            if requested_role or effective_role == "admin":
                existing.role = effective_role
            
            self._users_by_email[email] = existing
            return existing
        user = User(
            id=self._next_id,
            firebase_uid=firebase_uid,
            email=email,
            full_name=full_name,
            role=effective_role,
            join_date=str(date.today()),
        )
        self._users_by_id[user.id] = user
        self._users_by_firebase_uid[user.firebase_uid] = user
        self._users_by_email[user.email] = user
        self._next_id += 1
        return user

    def update(self, user_id: int, **kwargs) -> Optional[User]:
        user = self.get_by_id(user_id)
        if not user:
            return None
        for k, v in kwargs.items():
            if hasattr(user, k) and v is not None:
                setattr(user, k, v)
        return user

    def delete(self, user_id: int) -> bool:
        user = self._users_by_id.pop(user_id, None)
        if not user:
            return False
        self._users_by_firebase_uid.pop(user.firebase_uid, None)
        self._users_by_email.pop(user.email, None)
        return True


class InMemorySessionStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, Session] = {}

    def create(self, user: User) -> Session:
        sid = uuid.uuid4().hex
        session = Session(id=sid, user_id=user.id, created_at=time.time())
        self._sessions[sid] = session
        return session

    def get(self, session_id: str) -> Optional[Session]:
        return self._sessions.get(session_id)

    def delete(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
