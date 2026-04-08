from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.controllers import event_controller
from app.routes.deps import require_admin
from app.schemas.event_schema import EventCreate, EventRead, EventUpdate, PassRead

router = APIRouter(prefix="/api", tags=["events"])


def _to_event_read(event) -> EventRead:
    return EventRead(
        id=event.id,
        name=event.name,
        date=event.date,
        venue=event.venue,
        city=event.city,
        region=event.region,
        desc=event.desc,
        image=event.image,
        artists=event.artists,
        passes=[PassRead(id=p.id, name=p.name, price=p.price, includes=p.includes) for p in event.passes],
    )


@router.get("/events", response_model=List[EventRead])
def list_events() -> List[EventRead]:
    return [_to_event_read(e) for e in event_controller.get_all_events()]


@router.get("/events/{event_id}")
def get_event(event_id: int):
    result = event_controller.get_event_with_artists(event_id)
    if not result:
        raise HTTPException(status_code=404, detail="Event not found")
    event = result["event"]
    full_artists = result["fullArtists"]
    event_data = _to_event_read(event).model_dump()
    event_data["fullArtists"] = [
        {
            "id": a.id,
            "name": a.name,
            "genre": a.genre,
            "bio": a.bio,
            "topTracks": a.topTracks,
            "image": a.image,
        }
        for a in full_artists
    ]
    return event_data


@router.post("/events", response_model=EventRead)
def create_event(data: EventCreate, admin=Depends(require_admin)) -> EventRead:
    event = event_controller.create_event(data.model_dump())
    return _to_event_read(event)


@router.put("/events/{event_id}", response_model=EventRead)
def update_event(event_id: int, data: EventUpdate, admin=Depends(require_admin)) -> EventRead:
    event = event_controller.update_event(event_id, data.model_dump(exclude_none=True))
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return _to_event_read(event)


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: int, admin=Depends(require_admin)):
    if not event_controller.delete_event(event_id):
        raise HTTPException(status_code=404, detail="Event not found")
