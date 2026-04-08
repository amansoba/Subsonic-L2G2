from __future__ import annotations

from typing import List

from pydantic import BaseModel


class ArtistRead(BaseModel):
    id: int
    name: str
    genre: str
    bio: str
    topTracks: List = []
    image: str = ""


class ArtistCreate(BaseModel):
    name: str
    genre: str = ""
    bio: str = ""
    topTracks: List = []
    image: str = ""
