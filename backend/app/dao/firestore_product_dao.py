"""Firestore-backed Product DAO."""

from __future__ import annotations

from typing import List, Optional

from app.dao.firestore_base import dataclass_to_dict, dict_to_dataclass, next_id
from app.firebase_config import db
from app.models.product import Product


class FirestoreProductDAO:
    _collection = "products"

    def get_all(self) -> List[Product]:
        docs = db.collection(self._collection).stream()
        return [dict_to_dataclass(Product, doc.to_dict()) for doc in docs]

    def get_by_id(self, product_id: int) -> Optional[Product]:
        doc = db.collection(self._collection).document(str(product_id)).get()
        return dict_to_dataclass(Product, doc.to_dict()) if doc.exists else None

    def create(self, data: dict) -> Product:
        pid = next_id(self._collection)
        product = Product(
            id=pid,
            name=data["name"],
            price=data["price"],
            category=data.get("category", ""),
            gender=data.get("gender", ""),
            sizes=data.get("sizes", []),
            desc=data.get("desc", ""),
            images=data.get("images", []),
        )
        db.collection(self._collection).document(str(pid)).set(
            dataclass_to_dict(product)
        )
        return product

    def update(self, product_id: int, data: dict) -> Optional[Product]:
        ref = db.collection(self._collection).document(str(product_id))
        doc = ref.get()
        if not doc.exists:
            return None
        updates = {k: v for k, v in data.items() if v is not None}
        if updates:
            ref.update(updates)
        return self.get_by_id(product_id)

    def delete(self, product_id: int) -> bool:
        ref = db.collection(self._collection).document(str(product_id))
        if not ref.get().exists:
            return False
        ref.delete()
        return True
