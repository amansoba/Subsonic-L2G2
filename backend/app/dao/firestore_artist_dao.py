"""Firestore-backed Artist DAO."""

from __future__ import annotations

import logging
from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.artist import Artist

log = logging.getLogger("subsonic.firestore.artists")


class FirestoreArtistDAO:
    _collection = "artists"

    def get_all(self) -> List[Artist]:
        log.info("GET ALL artists")
        docs = list(db.collection(self._collection).stream())
        log.info("  → %d artists returned", len(docs))
        return [dict_to_dataclass(Artist, doc.to_dict()) for doc in docs]

    def get_by_id(self, artist_id: int) -> Optional[Artist]:
        log.info("GET artist id=%s", artist_id)
        doc = db.collection(self._collection).document(str(artist_id)).get()
        log.info("  → found=%s", doc.exists)
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
            spotifyTracks=data.get("spotifyTracks", []),
            spotifyTrackId=data.get("spotifyTrackId"),
            spotifyTrackName=data.get("spotifyTrackName"),
        )
        db.collection(self._collection).document(str(aid)).set(
            dataclass_to_dict(artist)
        )
        log.info("CREATE artist id=%s name=%s", aid, artist.name)
        return artist

    def delete(self, artist_id: int) -> bool:
        log.info("DELETE artist id=%s", artist_id)
        ref = db.collection(self._collection).document(str(artist_id))
        if not ref.get().exists:
            log.info("  → not found")
            return False
        ref.delete()
        log.info("  → deleted")
        return True
