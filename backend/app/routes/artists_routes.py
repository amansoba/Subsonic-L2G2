from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.controllers import artist_controller
from app.routes.deps import require_admin
from app.schemas.artist_schema import ArtistCreate, ArtistRead

router = APIRouter(prefix="/api", tags=["artists"])


def _to_artist_read(artist) -> ArtistRead:
    return ArtistRead(
        id=artist.id,
        name=artist.name,
        genre=artist.genre,
        bio=artist.bio,
        topTracks=artist.topTracks,
        image=artist.image,
    )


@router.get("/artists", response_model=List[ArtistRead])
def list_artists() -> List[ArtistRead]:
    return [_to_artist_read(a) for a in artist_controller.get_all_artists()]


@router.get("/artists/{artist_id}", response_model=ArtistRead)
def get_artist(artist_id: int) -> ArtistRead:
    artist = artist_controller.get_artist_by_id(artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return _to_artist_read(artist)


@router.post("/artists", response_model=ArtistRead)
def create_artist(data: ArtistCreate, admin=Depends(require_admin)) -> ArtistRead:
    artist = artist_controller.create_artist(data.model_dump())
    return _to_artist_read(artist)


@router.delete("/artists/{artist_id}", status_code=204)
def delete_artist(artist_id: int, admin=Depends(require_admin)):
    if not artist_controller.delete_artist(artist_id):
        raise HTTPException(status_code=404, detail="Artist not found")
