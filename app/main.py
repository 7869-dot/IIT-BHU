import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_tables

# Services (imported here to trigger singleton initialization at startup)
from app.services.embedding_store import embedding_store   # boots ChromaDB
from app.services.face_service import face_service         # loads InsightFace model
from app.services.nlp_service import nlp_service           # initializes Gemini client

# Routers
from app.routers import auth, cases, sightings, matches, alerts, dashboard

# --- Logging ---
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# --- Lifespan (startup + shutdown) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Everything in the 'before yield' block runs at startup.
    Everything after yield runs at shutdown.
    """
    logger.info("=== Starting Missing Persons Platform ===")

    # 1. Create DB tables (safe — skips existing tables)
    logger.info("Initializing database tables...")
    create_tables()

    # 2. Services are already initialized as module-level singletons above.
    #    Just log their status here.
    logger.info(f"ChromaDB ready — persist dir: {settings.CHROMA_PERSIST_DIR}")
    logger.info(f"Face service ready: {face_service._is_ready()}")
    logger.info(f"NLP service ready: {nlp_service._is_ready()}")

    logger.info("=== Platform ready — all systems up ===")

    yield  # App is now running and serving requests

    # Shutdown
    logger.info("=== Shutting down Missing Persons Platform ===")


# --- App Instance ---
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-powered missing person identification and tracking platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # tighten this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Routers ---
app.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
app.include_router(cases.router,     prefix="/cases",     tags=["Cases"])
app.include_router(sightings.router, prefix="/sightings", tags=["Sightings"])
app.include_router(matches.router,   prefix="/matches",   tags=["Matches"])
app.include_router(alerts.router,    prefix="/alerts",    tags=["Alerts"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])


# --- Health Check ---
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "face_service": face_service._is_ready(),
        "nlp_service": nlp_service._is_ready(),
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}