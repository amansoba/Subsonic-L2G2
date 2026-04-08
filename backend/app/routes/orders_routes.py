from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.controllers import order_controller
from app.routes.deps import get_current_user
from app.schemas.order_schema import OrderCreate, OrderItemRead, OrderRead

router = APIRouter(prefix="/api", tags=["orders"])


def _to_order_read(order) -> OrderRead:
    return OrderRead(
        id=order.id,
        user_id=order.user_id,
        items=[
            OrderItemRead(
                product_id=i.product_id,
                product_name=i.product_name,
                price=i.price,
                quantity=i.quantity,
                size=i.size,
            )
            for i in order.items
        ],
        total=order.total,
        purchase_date=order.purchase_date,
        status=order.status,
    )


@router.get("/orders", response_model=List[OrderRead])
def list_orders(user=Depends(get_current_user)) -> List[OrderRead]:
    return [_to_order_read(o) for o in order_controller.get_user_orders(user.id)]


@router.post("/orders", response_model=OrderRead)
def create_order(data: OrderCreate, user=Depends(get_current_user)) -> OrderRead:
    try:
        order = order_controller.create_order(user.id, data.items)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _to_order_read(order)
