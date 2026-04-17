from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class SpaceRead(BaseModel):
    id: int
    eventId: int
    provider_id: int
    type: str
    size: str
    location: str
    pricePerDay: float
    status: str
    services: str
    notes: str


class SpaceCreate(BaseModel):
    eventId: int
    provider_id: int
    type: str
    size: str
    location: str
    pricePerDay: float
    status: str = "Disponible"
    services: str = ""
    notes: str = ""


class SpaceUpdate(BaseModel):
    type: Optional[str] = None
    size: Optional[str] = None
    location: Optional[str] = None
    pricePerDay: Optional[float] = None
    status: Optional[str] = None
    services: Optional[str] = None
    notes: Optional[str] = None
