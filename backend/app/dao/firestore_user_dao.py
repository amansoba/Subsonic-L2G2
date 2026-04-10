"""Firestore-backed User DAO."""

from __future__ import annotations

import logging
from datetime import date
from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.user import User

log = logging.getLogger("subsonic.firestore.users")


class FirestoreUserDAO:
    _collection = "users"

    def get_all(self) -> List[User]:
        log.info("GET ALL users")
        docs = list(db.collection(self._collection).stream())
        log.info("  → %d users returned", len(docs))
        return [dict_to_dataclass(User, doc.to_dict()) for doc in docs]

    def get_by_id(self, user_id: int) -> Optional[User]:
        log.info("GET user id=%s", user_id)
        doc = db.collection(self._collection).document(str(user_id)).get()
        log.info("  → found=%s", doc.exists)
        return dict_to_dataclass(User, doc.to_dict()) if doc.exists else None

    def get_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        log.info("GET user by firebase_uid=%s", firebase_uid)
        docs = (
            db.collection(self._collection)
            .where("firebase_uid", "==", firebase_uid)
            .limit(1)
            .stream()
        )
        for doc in docs:
            log.info("  → found")
            return dict_to_dataclass(User, doc.to_dict())
        log.info("  → not found")
        return None

    def get_by_email(self, email: str) -> Optional[User]:
        log.info("GET user by email=%s", email)
        docs = (
            db.collection(self._collection)
            .where("email", "==", email)
            .limit(1)
            .stream()
        )
        for doc in docs:
            log.info("  → found")
            return dict_to_dataclass(User, doc.to_dict())
        log.info("  → not found")
        return None

    def upsert_from_identity(
        self,
        *,
        firebase_uid: str,
        email: str,
        full_name: Optional[str],
        default_role: str = "client",
    ) -> User:
        log.info("UPSERT user firebase_uid=%s email=%s", firebase_uid, email)
        existing = self.get_by_firebase_uid(firebase_uid)
        if existing:
            log.info("  → updating existing user id=%s", existing.id)
            existing.email = email
            existing.full_name = full_name
            db.collection(self._collection).document(str(existing.id)).update(
                {"email": email, "full_name": full_name}
            )
            return existing

        uid = next_id(self._collection)
        user = User(
            id=uid,
            firebase_uid=firebase_uid,
            email=email,
            full_name=full_name,
            role=default_role,
            join_date=str(date.today()),
        )
        db.collection(self._collection).document(str(uid)).set(
            dataclass_to_dict(user)
        )
        log.info("  → created new user id=%s role=%s", uid, default_role)
        return user

    def update(self, user_id: int, **kwargs) -> Optional[User]:
        log.info("UPDATE user id=%s keys=%s", user_id, list(kwargs.keys()))
        ref = db.collection(self._collection).document(str(user_id))
        doc = ref.get()
        if not doc.exists:
            return None
        updates = {k: v for k, v in kwargs.items() if v is not None}
        if updates:
            ref.update(updates)
        return dict_to_dataclass(User, {**doc.to_dict(), **updates})

    def delete(self, user_id: int) -> bool:
        log.info("DELETE user id=%s", user_id)
        ref = db.collection(self._collection).document(str(user_id))
        if not ref.get().exists:
            log.info("  → not found")
            return False
        ref.delete()
        log.info("  → deleted")
        return True
