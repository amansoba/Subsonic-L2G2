from __future__ import annotations

from typing import List

from fastapi import APIRouter

from app.controllers import experience_controller
from app.schemas.experience_schema import ExperienceRead

router = APIRouter(prefix="/api", tags=["experiences"])


@router.get("/experiences", response_model=List[ExperienceRead])
def list_experiences() -> List[ExperienceRead]:
    return [
        ExperienceRead(
            id=e.id,
            title=e.title,
            badge=e.badge,
            description=e.description,
            features=e.features,
            link=e.link,
            linkLabel=e.linkLabel,
            featured=e.featured,
            premium=e.premium,
        )
        for e in experience_controller.get_all_experiences()
    ]
