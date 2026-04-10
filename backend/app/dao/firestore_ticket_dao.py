"""Firestore-backed Ticket DAO."""

from __future__ import annotations

from datetime import date
from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.ticket import Ticket


class FirestoreTicketDAO:
    _collection = "tickets"

    def get_all(self) -> List[Ticket]:
        docs = db.collection(self._collection).stream()
        return [dict_to_dataclass(Ticket, doc.to_dict()) for doc in docs]

    def get_by_id(self, ticket_id: int) -> Optional[Ticket]:
        doc = db.collection(self._collection).document(str(ticket_id)).get()
        return dict_to_dataclass(Ticket, doc.to_dict()) if doc.exists else None

    def get_by_user(self, user_id: int) -> List[Ticket]:
        docs = (
            db.collection(self._collection)
            .where("user_id", "==", user_id)
            .stream()
        )
        return [dict_to_dataclass(Ticket, doc.to_dict()) for doc in docs]

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
        return ticket
