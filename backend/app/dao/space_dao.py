from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

from app.models.space import Space

MOCKS_DIR = Path(__file__).resolve().parents[2] / "view" / "static" / "mocks"


class InMemorySpaceDAO:
    def __init__(self) -> None:
        self._spaces: Dict[int, Space] = {}
        self._next_id: int = 1
        self._load_from_mock()

    def _load_from_mock(self) -> None:
        mock_file = MOCKS_DIR / "spaces.json"
        if not mock_file.exists():
            return
        with open(mock_file, encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            space = Space(
                id=item["id"],
                eventId=item["eventId"],
                type=item["type"],
                size=item["size"],
                location=item["location"],
                pricePerDay=item["pricePerDay"],
                status=item["status"],
                services=item["services"],
                notes=item["notes"],
            )
            self._spaces[space.id] = space
        self._next_id = max(self._spaces.keys(), default=0) + 1

    def get_all(self) -> List[Space]:
        return list(self._spaces.values())

    def get_by_id(self, space_id: int) -> Optional[Space]:
        return self._spaces.get(space_id)

    def create(self, data: dict) -> Space:
        space = Space(
            id=self._next_id,
            eventId=data["eventId"],
            type=data["type"],
            size=data["size"],
            location=data["location"],
            pricePerDay=data["pricePerDay"],
            status=data.get("status", "Disponible"),
            services=data.get("services", ""),
            notes=data.get("notes", ""),
        )
        self._spaces[space.id] = space
        self._next_id += 1
        return space

    def update(self, space_id: int, data: dict) -> Optional[Space]:
        space = self.get_by_id(space_id)
        if not space:
            return None
        for k, v in data.items():
            if v is not None and hasattr(space, k):
                setattr(space, k, v)
        return space

    def delete(self, space_id: int) -> bool:
        return self._spaces.pop(space_id, None) is not None
