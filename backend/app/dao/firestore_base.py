"""Shared helpers for Firestore-backed DAOs.

* ``dataclass_to_dict`` / ``dict_to_dataclass`` — convert between Python
  dataclasses and Firestore-friendly dicts.
* ``next_id`` — auto-incrementing integer IDs using a ``_counters``
  collection with Firestore transactions.
"""

from __future__ import annotations

import dataclasses
import logging
from typing import Type, TypeVar

from app.firebase_config import db

logger = logging.getLogger("subsonic.firestore")

T = TypeVar("T")


def dataclass_to_dict(obj) -> dict:
    """Recursively convert a dataclass instance to a plain dict."""
    if dataclasses.is_dataclass(obj) and not isinstance(obj, type):
        return {
            k: dataclass_to_dict(v)
            for k, v in dataclasses.asdict(obj).items()
        }
    if isinstance(obj, list):
        return [dataclass_to_dict(i) for i in obj]
    return obj


def dict_to_dataclass(cls: Type[T], data: dict) -> T:
    """Instantiate *cls* from a Firestore dict.

    Handles nested dataclasses declared in the type hints by recursing.
    Uses ``typing.get_type_hints()`` to resolve string annotations from
    ``from __future__ import annotations``.
    """
    if data is None:
        return None  # type: ignore[return-value]
    import typing

    try:
        hints = typing.get_type_hints(cls)
    except Exception:
        hints = {f.name: f.type for f in dataclasses.fields(cls)}

    kwargs = {}
    for name, value in data.items():
        if name not in hints:
            continue
        hint = hints[name]
        origin = getattr(hint, '__origin__', None)
        args = getattr(hint, '__args__', ())

        if isinstance(value, dict) and dataclasses.is_dataclass(hint):
            kwargs[name] = dict_to_dataclass(hint, value)
        elif isinstance(value, list) and origin is list and args:
            inner = args[0]
            if dataclasses.is_dataclass(inner):
                kwargs[name] = [dict_to_dataclass(inner, v) if isinstance(v, dict) else v for v in value]
            else:
                kwargs[name] = value
        else:
            kwargs[name] = value
    return cls(**kwargs)


# --------------- Auto-incrementing IDs ---------------

def next_id(collection_name: str) -> int:
    """Return the next integer ID for *collection_name*.

    Uses a Firestore transaction on ``_counters/{collection_name}`` to
    guarantee uniqueness even under concurrent writes.
    """

    counter_ref = db.collection("_counters").document(collection_name)

    @firestore_transaction
    def _increment(transaction):
        snap = counter_ref.get(transaction=transaction)
        current = snap.get("value") if snap.exists else 0
        new_val = current + 1
        transaction.set(counter_ref, {"value": new_val})
        return new_val

    return _increment()


def firestore_transaction(func):
    """Decorator that wraps *func* in a Firestore transaction."""
    from google.cloud.firestore import transactional  # type: ignore

    @transactional
    def _wrapper(transaction):
        return func(transaction)

    def run():
        transaction = db.transaction()
        return _wrapper(transaction)

    return run


def init_counter(collection_name: str, value: int) -> None:
    """Set the counter for *collection_name* to *value*."""
    db.collection("_counters").document(collection_name).set({"value": value})
