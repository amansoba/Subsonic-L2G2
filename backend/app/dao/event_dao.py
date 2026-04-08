from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

from app.models.event import Event, Pass

MOCKS_DIR = Path(__file__).resolve().parents[2] / "view" / "static" / "mocks"


def _pass_from_dict(d: dict) -> Pass:
    return Pass(id=d["id"], name=d["name"], price=d["price"], includes=d["includes"])


def _event_from_dict(d: dict) -> Event:
    return Event(
        id=d["id"],
        name=d["name"],
        date=d["date"],
        venue=d["venue"],
        city=d["city"],
        region=d["region"],
        desc=d.get("desc", ""),
        image=d.get("image", ""),
        artists=d.get("artists", []),
        passes=[_pass_from_dict(p) for p in d.get("passes", [])],
    )


class InMemoryEventDAO:
    def __init__(self) -> None:
        self._events: Dict[int, Event] = {}
        self._next_id: int = 1
        self._load_from_mock()

    def _load_from_mock(self) -> None:
        mock_file = MOCKS_DIR / "events.json"
        if not mock_file.exists():
            return
        with open(mock_file, encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            event = _event_from_dict(item)
            self._events[event.id] = event
        self._next_id = max(self._events.keys(), default=0) + 1

    def get_all(self) -> List[Event]:
        return list(self._events.values())

    def get_by_id(self, event_id: int) -> Optional[Event]:
        return self._events.get(event_id)

    def create(self, data: dict) -> Event:
        passes = [
            _pass_from_dict({**p, "id": p.get("id", i + 1)})
            for i, p in enumerate(data.get("passes", []))
        ]
        event = Event(
            id=self._next_id,
            name=data["name"],
            date=data["date"],
            venue=data["venue"],
            city=data["city"],
            region=data["region"],
            desc=data.get("desc", ""),
            image=data.get("image", ""),
            artists=data.get("artists", []),
            passes=passes,
        )
        self._events[event.id] = event
        self._next_id += 1
        return event

    def update(self, event_id: int, data: dict) -> Optional[Event]:
        event = self.get_by_id(event_id)
        if not event:
            return None
        for k, v in data.items():
            if v is not None and hasattr(event, k):
                if k == "passes":
                    setattr(event, k, [_pass_from_dict(p) if isinstance(p, dict) else p for p in v])
                else:
                    setattr(event, k, v)
        return event

    def delete(self, event_id: int) -> bool:
        return self._events.pop(event_id, None) is not None
