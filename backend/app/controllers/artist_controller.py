from __future__ import annotations

from typing import List, Optional

from app.factory.dao_factory import factory
from app.models.artist import Artist


def get_all_artists() -> List[Artist]:
    return factory.artists.get_all()


def get_artist_by_id(artist_id: int) -> Optional[Artist]:
    return factory.artists.get_by_id(artist_id)


def create_artist(data: dict) -> Artist:
    return factory.artists.create(data)


def delete_artist(artist_id: int) -> bool:
    return factory.artists.delete(artist_id)
