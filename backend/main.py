import logging
from dotenv import load_dotenv

# 1. Cargar .env ANTES de cualquier import que lea variables de entorno
load_dotenv()

# 2. Configurar logging ANTES de importar módulos que loguean al cargarse (ej. firebase_config)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-36s  %(message)s",
    datefmt="%H:%M:%S",
)

import uvicorn

from controller.controller import app


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

