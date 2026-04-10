"""Firestore-backed Space DAO."""

from __future__ import annotations

from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.space import Space


class FirestoreSpaceDAO:
    _collection = "spaces"

    def get_all(self) -> List[Space]:
        docs = db.collection(self._collection).stream()
        return [dict_to_dataclass(Space, doc.to_dict()) for doc in docs]

    def get_by_id(self, space_id: int) -> Optional[Space]:
        doc = db.collection(self._collection).document(str(space_id)).get()
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
        return space

    def update(self, space_id: int, data: dict) -> Optional[Space]:
        ref = db.collection(self._collection).document(str(space_id))
        doc = ref.get()
        if not doc.exists:
            return None
        updates = {k: v for k, v in data.items() if v is not None}
        if updates:
            ref.update(updates)
        return self.get_by_id(space_id)

    def delete(self, space_id: int) -> bool:
        ref = db.collection(self._collection).document(str(space_id))
        if not ref.get().exists:
            return False
        ref.delete()
        return True
