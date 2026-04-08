from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

from app.models.artist import Artist

MOCKS_DIR = Path(__file__).resolve().parents[2] / "view" / "static" / "mocks"


class InMemoryArtistDAO:
    def __init__(self) -> None:
        self._artists: Dict[int, Artist] = {}
        self._next_id: int = 1
        self._load_from_mock()

    def _load_from_mock(self) -> None:
        mock_file = MOCKS_DIR / "artists.json"
        if not mock_file.exists():
            return
        with open(mock_file, encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            artist = Artist(
                id=item["id"],
                name=item["name"],
                genre=item.get("genre", ""),
                bio=item.get("bio", ""),
                topTracks=item.get("topTracks", []),
                image=item.get("image", ""),
            )
            self._artists[artist.id] = artist
        self._next_id = max(self._artists.keys(), default=0) + 1

    def get_all(self) -> List[Artist]:
        return list(self._artists.values())

    def get_by_id(self, artist_id: int) -> Optional[Artist]:
        return self._artists.get(artist_id)

    def create(self, data: dict) -> Artist:
        artist = Artist(
            id=self._next_id,
            name=data["name"],
            genre=data.get("genre", ""),
            bio=data.get("bio", ""),
            topTracks=data.get("topTracks", []),
            image=data.get("image", ""),
        )
        self._artists[artist.id] = artist
        self._next_id += 1
        return artist

    def delete(self, artist_id: int) -> bool:
        return self._artists.pop(artist_id, None) is not None
