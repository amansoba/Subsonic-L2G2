from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Artist:
    id: int
    name: str
    genre: str
    bio: str
    topTracks: List = field(default_factory=list)
    image: str = ""
    spotifyTracks: List = field(default_factory=list)
    spotifyTrackId: Optional[str] = None
    spotifyTrackName: Optional[str] = None
