from __future__ import annotations

from app.dao.artist_dao import InMemoryArtistDAO
from app.dao.event_dao import InMemoryEventDAO
from app.dao.experience_dao import InMemoryExperienceDAO
from app.dao.order_dao import InMemoryOrderDAO
from app.dao.product_dao import InMemoryProductDAO
from app.dao.space_dao import InMemorySpaceDAO
from app.dao.ticket_dao import InMemoryTicketDAO
from app.dao.user_dao import InMemorySessionStore, InMemoryUserDAO


class DAOFactory:
    _instance: "DAOFactory | None" = None

    def __new__(cls) -> "DAOFactory":
        if cls._instance is None:
            inst = super().__new__(cls)
            inst._user_dao = InMemoryUserDAO()
            inst._session_store = InMemorySessionStore()
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
    def users(self) -> InMemoryUserDAO:
        return self._user_dao

    @property
    def sessions(self) -> InMemorySessionStore:
        return self._session_store

    @property
    def events(self) -> InMemoryEventDAO:
        return self._event_dao

    @property
    def artists(self) -> InMemoryArtistDAO:
        return self._artist_dao

    @property
    def products(self) -> InMemoryProductDAO:
        return self._product_dao

    @property
    def spaces(self) -> InMemorySpaceDAO:
        return self._space_dao

    @property
    def experiences(self) -> InMemoryExperienceDAO:
        return self._experience_dao

    @property
    def tickets(self) -> InMemoryTicketDAO:
        return self._ticket_dao

    @property
    def orders(self) -> InMemoryOrderDAO:
        return self._order_dao


# Singleton instance — import this instead of instantiating DAOFactory directly
factory = DAOFactory()
