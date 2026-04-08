from __future__ import annotations

from dataclasses import dataclass, field
from typing import List


@dataclass
class Product:
    id: int
    name: str
    price: float
    category: str
    gender: str
    sizes: List[str] = field(default_factory=list)
    desc: str = ""
    images: List[str] = field(default_factory=list)
