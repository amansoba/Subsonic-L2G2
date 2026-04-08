from __future__ import annotations

from typing import List, Optional

from app.factory.dao_factory import factory
from app.models.order import Order


def get_user_orders(user_id: int) -> List[Order]:
    return factory.orders.get_by_user(user_id)


def get_order_by_id(order_id: int) -> Optional[Order]:
    return factory.orders.get_by_id(order_id)


def create_order(user_id: int, items: list) -> Order:
    enriched_items = []
    for item in items:
        product = factory.products.get_by_id(item.product_id)
        if not product:
            raise ValueError(f"Product {item.product_id} not found")
        enriched_items.append({
            "product_id": product.id,
            "product_name": product.name,
            "price": product.price,
            "quantity": item.quantity,
            "size": item.size,
        })
    return factory.orders.create({
        "user_id": user_id,
        "items": enriched_items,
    })
