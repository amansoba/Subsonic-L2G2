from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Space:
    id: int
    eventId: int
    type: str
    size: str
    location: str
    pricePerDay: float
    status: str
    services: str
    notes: str
