from __future__ import annotations

from typing import List, Optional

from app.factory.dao_factory import factory
from app.models.product import Product


def get_all_products() -> List[Product]:
    return factory.products.get_all()


def get_product_by_id(product_id: int) -> Optional[Product]:
    return factory.products.get_by_id(product_id)


def create_product(data: dict) -> Product:
    return factory.products.create(data)


def update_product(product_id: int, data: dict) -> Optional[Product]:
    return factory.products.update(product_id, data)


def delete_product(product_id: int) -> bool:
    return factory.products.delete(product_id)
