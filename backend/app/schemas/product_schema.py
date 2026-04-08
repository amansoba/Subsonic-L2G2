from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class ProductRead(BaseModel):
    id: int
    name: str
    price: float
    category: str
    gender: str
    sizes: List[str]
    desc: str
    images: List[str]


class ProductCreate(BaseModel):
    name: str
    price: float
    category: str = ""
    gender: str = ""
    sizes: List[str] = []
    desc: str = ""
    images: List[str] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    gender: Optional[str] = None
    sizes: Optional[List[str]] = None
    desc: Optional[str] = None
    images: Optional[List[str]] = None
