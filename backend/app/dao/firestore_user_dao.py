"""Firestore-backed User DAO."""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.user import User


class FirestoreUserDAO:
    _collection = "users"

    def get_all(self) -> List[User]:
        docs = db.collection(self._collection).stream()
        return [dict_to_dataclass(User, doc.to_dict()) for doc in docs]

    def get_by_id(self, user_id: int) -> Optional[User]:
        doc = db.collection(self._collection).document(str(user_id)).get()
        return dict_to_dataclass(User, doc.to_dict()) if doc.exists else None

    def get_by_firebase_uid(self, firebase_uid: str) -> Optional[User]:
        docs = (
            db.collection(self._collection)
            .where("firebase_uid", "==", firebase_uid)
            .limit(1)
            .stream()
        )
        for doc in docs:
            return dict_to_dataclass(User, doc.to_dict())
        return None

    def get_by_email(self, email: str) -> Optional[User]:
        docs = (
            db.collection(self._collection)
            .where("email", "==", email)
            .limit(1)
            .stream()
        )
        for doc in docs:
            return dict_to_dataclass(User, doc.to_dict())
        return None

    def upsert_from_identity(
        self,
        *,
        firebase_uid: str,
        email: str,
        full_name: Optional[str],
        default_role: str = "client",
    ) -> User:
        existing = self.get_by_firebase_uid(firebase_uid)
        if existing:
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
        return user

    def update(self, user_id: int, **kwargs) -> Optional[User]:
        ref = db.collection(self._collection).document(str(user_id))
        doc = ref.get()
        if not doc.exists:
            return None
        updates = {k: v for k, v in kwargs.items() if v is not None}
        if updates:
            ref.update(updates)
        return dict_to_dataclass(User, {**doc.to_dict(), **updates})

    def delete(self, user_id: int) -> bool:
        ref = db.collection(self._collection).document(str(user_id))
        if not ref.get().exists:
            return False
        ref.delete()
        return True
