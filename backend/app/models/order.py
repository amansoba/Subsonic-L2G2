from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class OrderItem:
    product_id: int
    product_name: str
    price: float
    quantity: int
    size: Optional[str] = None


@dataclass
class Order:
    id: int
    user_id: int
    items: List[OrderItem]
    total: float
    purchase_date: str
    status: str = "completed"
