from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Ticket:
    id: int
    user_id: int
    event_id: int
    pass_id: int
    event_name: str
    pass_name: str
    pass_price: float
    purchase_date: str
    status: str = "active"
