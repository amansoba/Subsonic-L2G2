from __future__ import annotations

from typing import List, Optional

from app.factory.dao_factory import factory
from app.models.event import Event


def get_all_events() -> List[Event]:
    return factory.events.get_all()


def get_event_by_id(event_id: int) -> Optional[Event]:
    return factory.events.get_by_id(event_id)


def get_event_with_artists(event_id: int) -> Optional[dict]:
    event = factory.events.get_by_id(event_id)
    if not event:
        return None
    artist_map = {a.id: a for a in factory.artists.get_all()}
    full_artists = [artist_map[aid] for aid in event.artists if aid in artist_map]
    return {"event": event, "fullArtists": full_artists}


def create_event(data: dict) -> Event:
    return factory.events.create(data)


def update_event(event_id: int, data: dict) -> Optional[Event]:
    return factory.events.update(event_id, data)


def delete_event(event_id: int) -> bool:
    return factory.events.delete(event_id)
