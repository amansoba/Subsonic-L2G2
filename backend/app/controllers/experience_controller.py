from __future__ import annotations

from typing import List, Optional

from app.factory.dao_factory import factory
from app.models.experience import Experience


def get_all_experiences() -> List[Experience]:
    return factory.experiences.get_all()


def get_experience_by_id(exp_id: str) -> Optional[Experience]:
    return factory.experiences.get_by_id(exp_id)
