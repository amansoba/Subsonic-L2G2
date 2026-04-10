"""Firestore-backed Event DAO."""

from __future__ import annotations

import logging
from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.event import Event, Pass

log = logging.getLogger("subsonic.firestore.events")


class FirestoreEventDAO:
    _collection = "events"

    def get_all(self) -> List[Event]:
        log.info("GET ALL events")
        docs = list(db.collection(self._collection).stream())
        log.info("  → %d events returned", len(docs))
        return [dict_to_dataclass(Event, doc.to_dict()) for doc in docs]

    def get_by_id(self, event_id: int) -> Optional[Event]:
        log.info("GET event id=%s", event_id)
        doc = db.collection(self._collection).document(str(event_id)).get()
        log.info("  → found=%s", doc.exists)
        return dict_to_dataclass(Event, doc.to_dict()) if doc.exists else None

    def create(self, data: dict) -> Event:
        eid = next_id(self._collection)
        passes = [
            Pass(id=p.get("id", i + 1), name=p["name"], price=p["price"], includes=p["includes"])
            for i, p in enumerate(data.get("passes", []))
        ]
        event = Event(
            id=eid,
            name=data["name"],
            date=data["date"],
            venue=data["venue"],
            city=data["city"],
            region=data["region"],
            desc=data.get("desc", ""),
            image=data.get("image", ""),
            artists=data.get("artists", []),
            passes=passes,
        )
        db.collection(self._collection).document(str(eid)).set(
            dataclass_to_dict(event)
        )
        log.info("CREATE event id=%s name=%s", eid, event.name)
        return event

    def update(self, event_id: int, data: dict) -> Optional[Event]:
        log.info("UPDATE event id=%s keys=%s", event_id, list(data.keys()))
        ref = db.collection(self._collection).document(str(event_id))
        doc = ref.get()
        if not doc.exists:
            return None
        updates = {}
        for k, v in data.items():
            if v is not None:
                if k == "passes" and isinstance(v, list):
                    updates[k] = [
                        dataclass_to_dict(Pass(**p)) if isinstance(p, dict) else dataclass_to_dict(p)
                        for p in v
                    ]
                else:
                    updates[k] = v
        if updates:
            ref.update(updates)
        return self.get_by_id(event_id)

    def delete(self, event_id: int) -> bool:
        log.info("DELETE event id=%s", event_id)
        ref = db.collection(self._collection).document(str(event_id))
        if not ref.get().exists:
            log.info("  → not found")
            return False
        ref.delete()
        log.info("  → deleted")
        return True
