from __future__ import annotations

from pydantic import BaseModel


class TicketRead(BaseModel):
    id: int
    user_id: int
    event_id: int
    pass_id: int
    event_name: str
    pass_name: str
    pass_price: float
    purchase_date: str
    status: str


class TicketCreate(BaseModel):
    event_id: int
    pass_id: int
