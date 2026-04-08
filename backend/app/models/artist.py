from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass
class Artist:
    id: int
    name: str
    genre: str
    bio: str
    topTracks: List = field(default_factory=list)
    image: str = ""
