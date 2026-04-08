from __future__ import annotations

from datetime import date
from typing import Dict, List, Optional

from app.models.ticket import Ticket


class InMemoryTicketDAO:
    def __init__(self) -> None:
        self._tickets: Dict[int, Ticket] = {}
        self._next_id: int = 1

    def get_all(self) -> List[Ticket]:
        return list(self._tickets.values())

    def get_by_id(self, ticket_id: int) -> Optional[Ticket]:
        return self._tickets.get(ticket_id)

    def get_by_user(self, user_id: int) -> List[Ticket]:
        return [t for t in self._tickets.values() if t.user_id == user_id]

    def create(self, data: dict) -> Ticket:
        ticket = Ticket(
            id=self._next_id,
            user_id=data["user_id"],
            event_id=data["event_id"],
            pass_id=data["pass_id"],
            event_name=data.get("event_name", ""),
            pass_name=data.get("pass_name", ""),
            pass_price=data.get("pass_price", 0.0),
            purchase_date=data.get("purchase_date", str(date.today())),
            status=data.get("status", "active"),
        )
        self._tickets[ticket.id] = ticket
        self._next_id += 1
        return ticket
