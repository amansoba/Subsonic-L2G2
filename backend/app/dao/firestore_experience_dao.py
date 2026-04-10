"""Firestore-backed Experience DAO."""

from __future__ import annotations

from typing import List, Optional

from app.dao.firestore_base import dict_to_dataclass
from app.firebase_config import db
from app.models.experience import Experience


class FirestoreExperienceDAO:
    _collection = "experiences"

    def get_all(self) -> List[Experience]:
        docs = db.collection(self._collection).stream()
        return [dict_to_dataclass(Experience, doc.to_dict()) for doc in docs]

    def get_by_id(self, exp_id: str) -> Optional[Experience]:
        doc = db.collection(self._collection).document(exp_id).get()
        return dict_to_dataclass(Experience, doc.to_dict()) if doc.exists else None
