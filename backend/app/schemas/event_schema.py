from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class PassRead(BaseModel):
    id: int
    name: str
    price: float
    includes: str


class PassCreate(BaseModel):
    name: str
    price: float
    includes: str


class EventRead(BaseModel):
    id: int
    name: str
    date: str
    venue: str
    city: str
    region: str
    desc: str
    image: str
    artists: List[int]
    passes: List[PassRead]


class EventCreate(BaseModel):
    name: str
    date: str
    venue: str
    city: str
    region: str
    desc: str = ""
    image: str = ""
    artists: List[int] = []
    passes: List[PassCreate] = []


class EventUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    desc: Optional[str] = None
    image: Optional[str] = None
    artists: Optional[List[int]] = None
    passes: Optional[List[PassCreate]] = None
