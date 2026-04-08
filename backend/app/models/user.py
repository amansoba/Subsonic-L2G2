from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional

UserRole = Literal["client", "provider", "admin"]


@dataclass
class User:
    id: int
    firebase_uid: str
    email: str
    full_name: Optional[str]
    role: UserRole = "client"
    join_date: str = ""


@dataclass
class Session:
    id: str
    user_id: int
    created_at: float
