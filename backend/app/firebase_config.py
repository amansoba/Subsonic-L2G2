"""Firebase Admin SDK initialization.

Reads the service-account JSON path from the env var
``GOOGLE_APPLICATION_CREDENTIALS`` (standard Google convention).
If the env var is unset or the file is missing the module still loads
but ``db`` will be ``None`` — callers must check before using it.
"""

from __future__ import annotations

import os

import firebase_admin  # type: ignore
from firebase_admin import credentials, firestore  # type: ignore

_app: firebase_admin.App | None = None
db = None  # Firestore client — None when credentials are unavailable


def _init() -> None:
    global _app, db

    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path or not os.path.isfile(cred_path):
        return

    cred = credentials.Certificate(cred_path)
    _app = firebase_admin.initialize_app(cred)
    db = firestore.client()


_init()
