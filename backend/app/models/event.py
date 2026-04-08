from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass
class Pass:
    id: int
    name: str
    price: float
    includes: str


@dataclass
class Event:
    id: int
    name: str
    date: str
    venue: str
    city: str
    region: str
    desc: str
    image: str
    artists: List[int] = field(default_factory=list)
    passes: List[Pass] = field(default_factory=list)
