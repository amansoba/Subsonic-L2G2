from __future__ import annotations

from datetime import date
from typing import Dict, List, Optional

from app.models.order import Order, OrderItem


class InMemoryOrderDAO:
    def __init__(self) -> None:
        self._orders: Dict[int, Order] = {}
        self._next_id: int = 1

    def get_all(self) -> List[Order]:
        return list(self._orders.values())

    def get_by_id(self, order_id: int) -> Optional[Order]:
        return self._orders.get(order_id)

    def get_by_user(self, user_id: int) -> List[Order]:
        return [o for o in self._orders.values() if o.user_id == user_id]

    def create(self, data: dict) -> Order:
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
            id=self._next_id,
            user_id=data["user_id"],
            items=items,
            total=data.get("total", total),
            purchase_date=data.get("purchase_date", str(date.today())),
            status=data.get("status", "completed"),
        )
        self._orders[order.id] = order
        self._next_id += 1
        return order
