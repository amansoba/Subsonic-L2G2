from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.controllers import space_controller
from app.routes.deps import require_admin, require_provider
from app.schemas.space_schema import SpaceCreate, SpaceRead, SpaceUpdate

router = APIRouter(prefix="/api", tags=["spaces"])


def _to_space_read(space) -> SpaceRead:
    return SpaceRead(
        id=space.id,
        eventId=space.eventId,
        provider_id=space.provider_id,
        type=space.type,
        size=space.size,
        location=space.location,
        pricePerDay=space.pricePerDay,
        status=space.status,
        services=space.services,
        notes=space.notes,
    )


@router.get("/spaces", response_model=List[SpaceRead])
def list_spaces() -> List[SpaceRead]:
    return [_to_space_read(s) for s in space_controller.get_all_spaces()]


@router.get("/spaces/{space_id}", response_model=SpaceRead)
def get_space(space_id: int) -> SpaceRead:
    space = space_controller.get_space_by_id(space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return _to_space_read(space)


@router.post("/spaces", response_model=SpaceRead)
def create_space(data: SpaceCreate, provider=Depends(require_provider)) -> SpaceRead:
    data_dict = data.model_dump()
    data_dict["provider_id"] = provider.id  # Set provider_id to current user
    space = space_controller.create_space(data_dict)
    return _to_space_read(space)


@router.put("/spaces/{space_id}", response_model=SpaceRead)
def update_space(space_id: int, data: SpaceUpdate, provider=Depends(require_provider)) -> SpaceRead:
    space = space_controller.update_space(space_id, data.model_dump(exclude_none=True))
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return _to_space_read(space)


@router.get("/provider/spaces", response_model=List[SpaceRead])
def list_provider_spaces(provider=Depends(require_provider)) -> List[SpaceRead]:
    # Asumiendo que space_controller tiene un método para obtener espacios por provider
    return [_to_space_read(s) for s in space_controller.get_spaces_by_provider(provider.id)]
