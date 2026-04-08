from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.routes.artists_routes import router as artists_router
from app.routes.events_routes import router as events_router
from app.routes.experiences_routes import router as experiences_router
from app.routes.orders_routes import router as orders_router
from app.routes.products_routes import router as products_router
from app.routes.spaces_routes import router as spaces_router
from app.routes.tickets_routes import router as tickets_router
from app.routes.users_routes import router as users_router

BACKEND_DIR = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = BACKEND_DIR / "view" / "templates"
STATIC_DIR = BACKEND_DIR / "view" / "static"

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(events_router)
app.include_router(artists_router)
app.include_router(products_router)
app.include_router(spaces_router)
app.include_router(experiences_router)
app.include_router(tickets_router)
app.include_router(orders_router)

# Static mounts to keep original frontend URLs working
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.mount("/css", StaticFiles(directory=str(STATIC_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(STATIC_DIR / "js")), name="js")
app.mount("/mocks", StaticFiles(directory=str(STATIC_DIR / "mocks")), name="mocks")
app.mount(
    "/fotos_artistas",
    StaticFiles(directory=str(STATIC_DIR / "fotos_artistas")),
    name="fotos_artistas",
)
app.mount(
    "/fotos_lugares",
    StaticFiles(directory=str(STATIC_DIR / "fotos_lugares")),
    name="fotos_lugares",
)
app.mount(
    "/fotos_principales",
    StaticFiles(directory=str(STATIC_DIR / "fotos_principales")),
    name="fotos_principales",
)
app.mount(
    "/fotos_store",
    StaticFiles(directory=str(STATIC_DIR / "fotos_store")),
    name="fotos_store",
)


@app.get("/", include_in_schema=False)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/{full_path:path}", include_in_schema=False)
def render_html_pages(full_path: str, request: Request):
    if not full_path or full_path == "/":
        return templates.TemplateResponse("index.html", {"request": request})

    if not full_path.endswith(".html"):
        raise HTTPException(status_code=404, detail="Not Found")

    template_file = TEMPLATES_DIR / full_path
    if not template_file.exists():
        raise HTTPException(status_code=404, detail="Not Found")

    return templates.TemplateResponse(full_path, {"request": request})

