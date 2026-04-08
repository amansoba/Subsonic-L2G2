from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    size: Optional[str] = None


class OrderItemRead(BaseModel):
    product_id: int
    product_name: str
    price: float
    quantity: int
    size: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]


class OrderRead(BaseModel):
    id: int
    user_id: int
    items: List[OrderItemRead]
    total: float
    purchase_date: str
    status: str
