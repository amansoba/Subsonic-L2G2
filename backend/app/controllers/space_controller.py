from __future__ import annotations

from typing import List, Optional

from app.factory.dao_factory import factory
from app.models.space import Space


def get_all_spaces() -> List[Space]:
    return factory.spaces.get_all()


def get_space_by_id(space_id: int) -> Optional[Space]:
    return factory.spaces.get_by_id(space_id)


def create_space(data: dict) -> Space:
    return factory.spaces.create(data)


def update_space(space_id: int, data: dict) -> Optional[Space]:
    return factory.spaces.update(space_id, data)


def delete_space(space_id: int) -> bool:
    return factory.spaces.delete(space_id)
