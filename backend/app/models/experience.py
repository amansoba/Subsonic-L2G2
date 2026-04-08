from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass
class Experience:
    id: str
    title: str
    badge: str
    description: str
    features: List[str] = field(default_factory=list)
    link: str = ""
    linkLabel: str = ""
    featured: bool = False
    premium: bool = False
