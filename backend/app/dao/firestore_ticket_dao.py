"""Firestore-backed Ticket DAO."""

from __future__ import annotations

import logging
from datetime import date
from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.ticket import Ticket

log = logging.getLogger("subsonic.firestore.tickets")


class FirestoreTicketDAO:
    _collection = "tickets"

    def get_all(self) -> List[Ticket]:
        log.info("GET ALL tickets")
        docs = list(db.collection(self._collection).stream())
        log.info("  → %d tickets returned", len(docs))
        return [dict_to_dataclass(Ticket, doc.to_dict()) for doc in docs]

    def get_by_id(self, ticket_id: int) -> Optional[Ticket]:
        log.info("GET ticket id=%s", ticket_id)
        doc = db.collection(self._collection).document(str(ticket_id)).get()
        log.info("  → found=%s", doc.exists)
        return dict_to_dataclass(Ticket, doc.to_dict()) if doc.exists else None

    def get_by_user(self, user_id: int) -> List[Ticket]:
        log.info("GET tickets for user_id=%s", user_id)
        docs = (
            db.collection(self._collection)
            .where("user_id", "==", user_id)
            .stream()
        )
        result = [dict_to_dataclass(Ticket, doc.to_dict()) for doc in docs]
        log.info("  → %d tickets returned", len(result))
        return result

    def create(self, data: dict) -> Ticket:
        tid = next_id(self._collection)
        ticket = Ticket(
            id=tid,
            user_id=data["user_id"],
            event_id=data["event_id"],
            pass_id=data["pass_id"],
            event_name=data.get("event_name", ""),
            pass_name=data.get("pass_name", ""),
            pass_price=data.get("pass_price", 0.0),
            purchase_date=data.get("purchase_date", str(date.today())),
            status=data.get("status", "active"),
        )
        db.collection(self._collection).document(str(tid)).set(
            dataclass_to_dict(ticket)
        )
        log.info("CREATE ticket id=%s user=%s event=%s", tid, ticket.user_id, ticket.event_id)
        return ticket
