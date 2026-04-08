from __future__ import annotations

from typing import List

from pydantic import BaseModel


class ExperienceRead(BaseModel):
    id: str
    title: str
    badge: str
    description: str
    features: List[str]
    link: str
    linkLabel: str
    featured: bool = False
    premium: bool = False
