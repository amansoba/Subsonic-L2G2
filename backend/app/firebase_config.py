"""Firebase Admin SDK initialization.

Prioridad de credenciales:
1. Variable de entorno ``FIREBASE_CREDENTIALS_JSON`` con el JSON completo (ideal para Azure/Docker).
2. Archivo indicado en ``GOOGLE_APPLICATION_CREDENTIALS`` (desarrollo local).

Si ninguna está disponible el módulo carga igualmente pero ``db`` será ``None``.
"""

from __future__ import annotations

import json
import logging
import os

import firebase_admin  # type: ignore
from firebase_admin import credentials, firestore  # type: ignore

logger = logging.getLogger(__name__)

_app: firebase_admin.App | None = None
db = None  # Firestore client — None when credentials are unavailable


def _init() -> None:
    global _app, db

    # Guard: no inicializar dos veces
    if firebase_admin._apps:
        logger.info("[Firebase] SDK ya inicializado, reutilizando instancia existente.")
        _app = firebase_admin.get_app()
        db = firestore.client()
        return

    # 1. Variable de entorno con el JSON completo (Azure App Service / Docker)
    cred_json_str = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if cred_json_str:
        logger.info("[Firebase] Inicializando desde FIREBASE_CREDENTIALS_JSON.")
        try:
            cred_dict = json.loads(cred_json_str)
            cred = credentials.Certificate(cred_dict)
        except (json.JSONDecodeError, ValueError) as exc:
            logger.error("[Firebase] FIREBASE_CREDENTIALS_JSON no es JSON válido: %s", exc)
            return
    else:
        # 2. Archivo físico (desarrollo local)
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
        logger.info("[Firebase] GOOGLE_APPLICATION_CREDENTIALS='%s'", cred_path)
        if not cred_path:
            logger.warning(
                "[Firebase] No se encontró FIREBASE_CREDENTIALS_JSON ni GOOGLE_APPLICATION_CREDENTIALS. "
                "El SDK NO se inicializará."
            )
            return
        if not os.path.isfile(cred_path):
            logger.error(
                "[Firebase] El archivo de credenciales '%s' NO existe en el sistema de archivos. "
                "En producción usa FIREBASE_CREDENTIALS_JSON en su lugar.",
                cred_path,
            )
            return
        cred = credentials.Certificate(cred_path)
        logger.info("[Firebase] Inicializando desde archivo '%s'.", cred_path)

    try:
        _app = firebase_admin.initialize_app(cred)
        db = firestore.client()
        logger.info("[Firebase] SDK inicializado correctamente.")
    except Exception as exc:
        logger.error("[Firebase] Error al inicializar el SDK: %s", exc)


_init()
