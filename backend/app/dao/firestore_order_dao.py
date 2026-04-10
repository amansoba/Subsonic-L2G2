"""Firestore-backed Order DAO."""

from __future__ import annotations

import logging
from datetime import date
from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.order import Order, OrderItem

log = logging.getLogger("subsonic.firestore.orders")


class FirestoreOrderDAO:
    _collection = "orders"

    def get_all(self) -> List[Order]:
        log.info("GET ALL orders")
        docs = list(db.collection(self._collection).stream())
        log.info("  → %d orders returned", len(docs))
        return [dict_to_dataclass(Order, doc.to_dict()) for doc in docs]

    def get_by_id(self, order_id: int) -> Optional[Order]:
        log.info("GET order id=%s", order_id)
        doc = db.collection(self._collection).document(str(order_id)).get()
        log.info("  → found=%s", doc.exists)
        return dict_to_dataclass(Order, doc.to_dict()) if doc.exists else None

    def get_by_user(self, user_id: int) -> List[Order]:
        log.info("GET orders for user_id=%s", user_id)
        docs = (
            db.collection(self._collection)
            .where("user_id", "==", user_id)
            .stream()
        )
        result = [dict_to_dataclass(Order, doc.to_dict()) for doc in docs]
        log.info("  → %d orders returned", len(result))
        return result

    def create(self, data: dict) -> Order:
        oid = next_id(self._collection)
        items = [
            OrderItem(
                product_id=item["product_id"],
                product_name=item.get("product_name", ""),
                price=item.get("price", 0.0),
                quantity=item.get("quantity", 1),
                size=item.get("size"),
            )
            for item in data.get("items", [])
        ]
        total = sum(i.price * i.quantity for i in items)
        order = Order(
            id=oid,
            user_id=data["user_id"],
            items=items,
            total=data.get("total", total),
            purchase_date=data.get("purchase_date", str(date.today())),
            status=data.get("status", "completed"),
        )
        db.collection(self._collection).document(str(oid)).set(
            dataclass_to_dict(order)
        )
        log.info("CREATE order id=%s user_id=%s total=%.2f", oid, order.user_id, order.total)
        return order
