"""Seed Firestore from the existing JSON mock files.

Usage:
    # From the backend/ directory, with GOOGLE_APPLICATION_CREDENTIALS set:
    python -m scripts.seed_firestore

Reads the mock JSON files in view/static/mocks/ and inserts them into
the corresponding Firestore collections.  Also initialises the _counters
collection so auto-increment IDs continue from the correct value.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# Ensure the backend package is importable
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

# Validate that credentials are available
if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    print("ERROR: Set GOOGLE_APPLICATION_CREDENTIALS before running this script.")
    sys.exit(1)

from app.firebase_config import db  # noqa: E402

if db is None:
    print("ERROR: Firestore client could not be initialised.  Check your credentials.")
    sys.exit(1)

MOCKS_DIR = BACKEND_DIR / "view" / "static" / "mocks"


def _load_json(name: str) -> list:
    path = MOCKS_DIR / name
    if not path.exists():
        print(f"  SKIP {name} (not found)")
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _seed_collection(collection: str, items: list, id_field: str = "id") -> int:
    """Insert *items* into *collection*, using ``items[id_field]`` as document ID."""
    col_ref = db.collection(collection)
    count = 0
    for item in items:
        doc_id = str(item[id_field])
        col_ref.document(doc_id).set(item)
        count += 1
    return count


def _set_counter(collection: str, value: int) -> None:
    db.collection("_counters").document(collection).set({"value": value})


def main() -> None:
    print("=== Subsonic Firestore Seeder ===\n")

    # --- Users ---
    users = _load_json("users.json")
    for u in users:
        u.setdefault("firebase_uid", f"mock-{u['id']}")
        u.setdefault("full_name", u.get("name"))
        u.setdefault("role", "client")
        u.setdefault("join_date", u.get("joinDate", ""))
    n = _seed_collection("users", users)
    _set_counter("users", max((u["id"] for u in users), default=0))
    print(f"  users: {n} documents")

    # --- Artists ---
    artists = _load_json("artists.json")
    n = _seed_collection("artists", artists)
    _set_counter("artists", max((a["id"] for a in artists), default=0))
    print(f"  artists: {n} documents")

    # --- Events ---
    events = _load_json("events.json")
    n = _seed_collection("events", events)
    _set_counter("events", max((e["id"] for e in events), default=0))
    print(f"  events: {n} documents")

    # --- Products ---
    products = _load_json("products.json")
    n = _seed_collection("products", products)
    _set_counter("products", max((p["id"] for p in products), default=0))
    print(f"  products: {n} documents")

    # --- Spaces ---
    spaces = _load_json("spaces.json")
    n = _seed_collection("spaces", spaces)
    _set_counter("spaces", max((s["id"] for s in spaces), default=0))
    print(f"  spaces: {n} documents")

    # --- Experiences ---
    experiences = _load_json("experiences.json")
    n = _seed_collection("experiences", experiences)
    # experience IDs are strings — no counter needed
    print(f"  experiences: {n} documents")

    # --- Orders & Tickets start empty ---
    _set_counter("orders", 0)
    _set_counter("tickets", 0)
    print("  orders: counter initialised")
    print("  tickets: counter initialised")

    print("\nDone!")


if __name__ == "__main__":
    main()
