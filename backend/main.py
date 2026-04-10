import logging
from dotenv import load_dotenv

load_dotenv()  # Load .env before any Firebase/config imports

import uvicorn

from controller.controller import app

# Show Firestore DAO logs in the console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-36s  %(message)s",
    datefmt="%H:%M:%S",
)


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

