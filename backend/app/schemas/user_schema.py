from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class UserRead(BaseModel):
    id: int
    name: Optional[str] = None
    email: str
    role: str
    joinDate: Optional[str] = None


class UserCreate(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: str = "client"


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
