"""Firestore-backed Artist DAO."""

from __future__ import annotations

from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.artist import Artist


class FirestoreArtistDAO:
    _collection = "artists"

    def get_all(self) -> List[Artist]:
        docs = db.collection(self._collection).stream()
        return [dict_to_dataclass(Artist, doc.to_dict()) for doc in docs]

    def get_by_id(self, artist_id: int) -> Optional[Artist]:
        doc = db.collection(self._collection).document(str(artist_id)).get()
        return dict_to_dataclass(Artist, doc.to_dict()) if doc.exists else None

    def create(self, data: dict) -> Artist:
        aid = next_id(self._collection)
        artist = Artist(
            id=aid,
            name=data["name"],
            genre=data.get("genre", ""),
            bio=data.get("bio", ""),
            topTracks=data.get("topTracks", []),
            image=data.get("image", ""),
        )
        db.collection(self._collection).document(str(aid)).set(
            dataclass_to_dict(artist)
        )
        return artist

    def delete(self, artist_id: int) -> bool:
        ref = db.collection(self._collection).document(str(artist_id))
        if not ref.get().exists:
            return False
        ref.delete()
        return True
