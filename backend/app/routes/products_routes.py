from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from app.controllers import product_controller
from app.routes.deps import require_admin
from app.schemas.product_schema import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/api", tags=["products"])


def _to_product_read(product) -> ProductRead:
    return ProductRead(
        id=product.id,
        name=product.name,
        price=product.price,
        category=product.category,
        gender=product.gender,
        sizes=product.sizes,
        desc=product.desc,
        images=product.images,
    )


@router.get("/products", response_model=List[ProductRead])
def list_products() -> List[ProductRead]:
    return [_to_product_read(p) for p in product_controller.get_all_products()]


@router.get("/products/{product_id}", response_model=ProductRead)
def get_product(product_id: int) -> ProductRead:
    product = product_controller.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _to_product_read(product)


@router.post("/products", response_model=ProductRead)
def create_product(data: ProductCreate, admin=Depends(require_admin)) -> ProductRead:
    product = product_controller.create_product(data.model_dump())
    return _to_product_read(product)


@router.put("/products/{product_id}", response_model=ProductRead)
def update_product(product_id: int, data: ProductUpdate, admin=Depends(require_admin)) -> ProductRead:
    product = product_controller.update_product(product_id, data.model_dump(exclude_none=True))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _to_product_read(product)


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, admin=Depends(require_admin)):
    if not product_controller.delete_product(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
