"""Firestore-backed Experience DAO."""

from __future__ import annotations

import logging
from typing import List, Optional

from app.dao.firestore_base import dict_to_dataclass
from app.firebase_config import db
from app.models.experience import Experience

log = logging.getLogger("subsonic.firestore.experiences")


class FirestoreExperienceDAO:
    _collection = "experiences"

    def get_all(self) -> List[Experience]:
        log.info("GET ALL experiences")
        docs = list(db.collection(self._collection).stream())
        log.info("  → %d experiences returned", len(docs))
        return [dict_to_dataclass(Experience, doc.to_dict()) for doc in docs]

    def get_by_id(self, exp_id: str) -> Optional[Experience]:
        log.info("GET experience id=%s", exp_id)
        doc = db.collection(self._collection).document(exp_id).get()
        log.info("  → found=%s", doc.exists)
        return dict_to_dataclass(Experience, doc.to_dict()) if doc.exists else None
