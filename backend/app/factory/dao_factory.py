from __future__ import annotations

import os


def _use_firestore() -> bool:
    return os.getenv("SUBSONIC_DAO_BACKEND", "memory").lower() == "firestore"


class DAOFactory:
    _instance: "DAOFactory | None" = None

    def __new__(cls) -> "DAOFactory":
        if cls._instance is None:
            inst = super().__new__(cls)

            if _use_firestore():
                from app.dao.firestore_artist_dao import FirestoreArtistDAO
                from app.dao.firestore_event_dao import FirestoreEventDAO
                from app.dao.firestore_experience_dao import FirestoreExperienceDAO
                from app.dao.firestore_order_dao import FirestoreOrderDAO
                from app.dao.firestore_product_dao import FirestoreProductDAO
                from app.dao.firestore_space_dao import FirestoreSpaceDAO
                from app.dao.firestore_ticket_dao import FirestoreTicketDAO
                from app.dao.firestore_user_dao import FirestoreUserDAO

                inst._user_dao = FirestoreUserDAO()
                inst._event_dao = FirestoreEventDAO()
                inst._artist_dao = FirestoreArtistDAO()
                inst._product_dao = FirestoreProductDAO()
                inst._space_dao = FirestoreSpaceDAO()
                inst._experience_dao = FirestoreExperienceDAO()
                inst._ticket_dao = FirestoreTicketDAO()
                inst._order_dao = FirestoreOrderDAO()
            else:
                from app.dao.artist_dao import InMemoryArtistDAO
                from app.dao.event_dao import InMemoryEventDAO
                from app.dao.experience_dao import InMemoryExperienceDAO
                from app.dao.order_dao import InMemoryOrderDAO
                from app.dao.product_dao import InMemoryProductDAO
                from app.dao.space_dao import InMemorySpaceDAO
                from app.dao.ticket_dao import InMemoryTicketDAO
                from app.dao.user_dao import InMemoryUserDAO

                inst._user_dao = InMemoryUserDAO()
                inst._event_dao = InMemoryEventDAO()
                inst._artist_dao = InMemoryArtistDAO()
                inst._product_dao = InMemoryProductDAO()
                inst._space_dao = InMemorySpaceDAO()
                inst._experience_dao = InMemoryExperienceDAO()
                inst._ticket_dao = InMemoryTicketDAO()
                inst._order_dao = InMemoryOrderDAO()

            cls._instance = inst
        return cls._instance

    @property
    def users(self):
        return self._user_dao

    @property
    def events(self):
        return self._event_dao

    @property
    def artists(self):
        return self._artist_dao

    @property
    def products(self):
        return self._product_dao

    @property
    def spaces(self):
        return self._space_dao

    @property
    def experiences(self):
        return self._experience_dao

    @property
    def tickets(self):
        return self._ticket_dao

    @property
    def orders(self):
        return self._order_dao


# Singleton instance — import this instead of instantiating DAOFactory directly
factory = DAOFactory()
