from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.controllers import ticket_controller
from app.routes.deps import get_current_user
from app.schemas.ticket_schema import TicketCreate, TicketRead

router = APIRouter(prefix="/api", tags=["tickets"])


def _to_ticket_read(ticket) -> TicketRead:
    return TicketRead(
        id=ticket.id,
        user_id=ticket.user_id,
        event_id=ticket.event_id,
        pass_id=ticket.pass_id,
        event_name=ticket.event_name,
        pass_name=ticket.pass_name,
        pass_price=ticket.pass_price,
        purchase_date=ticket.purchase_date,
        status=ticket.status,
    )


@router.get("/tickets", response_model=List[TicketRead])
def list_tickets(user=Depends(get_current_user)) -> List[TicketRead]:
    return [_to_ticket_read(t) for t in ticket_controller.get_user_tickets(user.id)]


@router.get("/tickets/{ticket_id}", response_model=TicketRead)
def get_ticket(ticket_id: int, user=Depends(get_current_user)) -> TicketRead:
    ticket = ticket_controller.get_ticket_by_id(ticket_id)
    if not ticket or ticket.user_id != user.id:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _to_ticket_read(ticket)


@router.post("/tickets", response_model=TicketRead)
def create_ticket(data: TicketCreate, user=Depends(get_current_user)) -> TicketRead:
    try:
        ticket = ticket_controller.create_ticket(user.id, data.event_id, data.pass_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _to_ticket_read(ticket)
