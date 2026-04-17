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
    spotifyTracks: List = []
    spotifyTrackId: str | None = None
    spotifyTrackName: str | None = None


class ArtistCreate(BaseModel):
    name: str
    genre: str = ""
    bio: str = ""
    topTracks: List = []
    image: str = ""
    spotifyTracks: List = []
    spotifyTrackId: str | None = None
    spotifyTrackName: str | None = None
