from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

from app.models.product import Product

MOCKS_DIR = Path(__file__).resolve().parents[2] / "view" / "static" / "mocks"


class InMemoryProductDAO:
    def __init__(self) -> None:
        self._products: Dict[int, Product] = {}
        self._next_id: int = 1
        self._load_from_mock()

    def _load_from_mock(self) -> None:
        mock_file = MOCKS_DIR / "products.json"
        if not mock_file.exists():
            return
        with open(mock_file, encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            product = Product(
                id=item["id"],
                name=item["name"],
                price=item["price"],
                category=item.get("category", ""),
                gender=item.get("gender", ""),
                sizes=item.get("sizes", []),
                desc=item.get("desc", ""),
                images=item.get("images", []),
            )
            self._products[product.id] = product
        self._next_id = max(self._products.keys(), default=0) + 1

    def get_all(self) -> List[Product]:
        return list(self._products.values())

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return self._products.get(product_id)

    def create(self, data: dict) -> Product:
        product = Product(
            id=self._next_id,
            name=data["name"],
            price=data["price"],
            category=data.get("category", ""),
            gender=data.get("gender", ""),
            sizes=data.get("sizes", []),
            desc=data.get("desc", ""),
            images=data.get("images", []),
        )
        self._products[product.id] = product
        self._next_id += 1
        return product

    def update(self, product_id: int, data: dict) -> Optional[Product]:
        product = self.get_by_id(product_id)
        if not product:
            return None
        for k, v in data.items():
            if v is not None and hasattr(product, k):
                setattr(product, k, v)
        return product

    def delete(self, product_id: int) -> bool:
        return self._products.pop(product_id, None) is not None
