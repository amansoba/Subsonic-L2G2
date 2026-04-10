"""Firestore-backed Space DAO."""

from __future__ import annotations

import logging
from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.space import Space

log = logging.getLogger("subsonic.firestore.spaces")


class FirestoreSpaceDAO:
    _collection = "spaces"

    def get_all(self) -> List[Space]:
        log.info("GET ALL spaces")
        docs = list(db.collection(self._collection).stream())
        log.info("  → %d spaces returned", len(docs))
        return [dict_to_dataclass(Space, doc.to_dict()) for doc in docs]

    def get_by_id(self, space_id: int) -> Optional[Space]:
        log.info("GET space id=%s", space_id)
        doc = db.collection(self._collection).document(str(space_id)).get()
        log.info("  → found=%s", doc.exists)
        return dict_to_dataclass(Space, doc.to_dict()) if doc.exists else None

    def create(self, data: dict) -> Space:
        sid = next_id(self._collection)
        space = Space(
            id=sid,
            eventId=data["eventId"],
            type=data["type"],
            size=data["size"],
            location=data["location"],
            pricePerDay=data["pricePerDay"],
            status=data.get("status", "Disponible"),
            services=data.get("services", ""),
            notes=data.get("notes", ""),
        )
        db.collection(self._collection).document(str(sid)).set(
            dataclass_to_dict(space)
        )
        log.info("CREATE space id=%s type=%s", sid, space.type)
        return space

    def update(self, space_id: int, data: dict) -> Optional[Space]:
        log.info("UPDATE space id=%s", space_id)
        ref = db.collection(self._collection).document(str(space_id))
        doc = ref.get()
        if not doc.exists:
            return None
        updates = {k: v for k, v in data.items() if v is not None}
        if updates:
            ref.update(updates)
        return self.get_by_id(space_id)

    def delete(self, space_id: int) -> bool:
        log.info("DELETE space id=%s", space_id)
        ref = db.collection(self._collection).document(str(space_id))
        if not ref.get().exists:
            log.info("  → not found")
            return False
        ref.delete()
        log.info("  → deleted")
        return True
