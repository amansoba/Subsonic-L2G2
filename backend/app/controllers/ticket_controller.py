from __future__ import annotations

from typing import List, Optional

from app.factory.dao_factory import factory
from app.models.ticket import Ticket


def get_user_tickets(user_id: int) -> List[Ticket]:
    return factory.tickets.get_by_user(user_id)


def get_ticket_by_id(ticket_id: int) -> Optional[Ticket]:
    return factory.tickets.get_by_id(ticket_id)


def create_ticket(user_id: int, event_id: int, pass_id: int) -> Ticket:
    event = factory.events.get_by_id(event_id)
    if not event:
        raise ValueError(f"Event {event_id} not found")
    pass_obj = next((p for p in event.passes if p.id == pass_id), None)
    if not pass_obj:
        raise ValueError(f"Pass {pass_id} not found in event {event_id}")
    return factory.tickets.create({
        "user_id": user_id,
        "event_id": event_id,
        "pass_id": pass_id,
        "event_name": event.name,
        "pass_name": pass_obj.name,
        "pass_price": pass_obj.price,
    })
