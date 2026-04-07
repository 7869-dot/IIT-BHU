import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Optional
import shutil, uuid, os, warnings
from sqlalchemy import text

warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=UserWarning)

from database import engine, get_db
import models, schemas
from face_matcher import match_faces

# ── Bootstrap ─────────────────────────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Missing Persons AI — Backend",
    description="AI-powered platform for missing person identification and sighting tracking.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve stored images statically so frontend can display them
STORAGE = Path("storage")
(STORAGE / "victim").mkdir(parents=True, exist_ok=True)
(STORAGE / "sightings").mkdir(parents=True, exist_ok=True)
app.mount("/storage", StaticFiles(directory="storage"), name="storage")


# ── Helpers ───────────────────────────────────────────────────────────────────

def save_upload(file: UploadFile, folder: Path) -> str:
    ext      = Path(file.filename).suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    dest     = folder / filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return str(dest).replace("\\", "/")


def ensure_schema_columns():
    with engine.begin() as conn:
        victim_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(victims)"))}
        if "additional_media_paths" not in victim_cols:
            conn.execute(text("ALTER TABLE victims ADD COLUMN additional_media_paths JSON"))

        sighting_cols = {row[1] for row in conn.execute(text("PRAGMA table_info(sightings)"))}
        if "camera_id" not in sighting_cols:
            conn.execute(text("ALTER TABLE sightings ADD COLUMN camera_id VARCHAR"))
        if "action_link" not in sighting_cols:
            conn.execute(text("ALTER TABLE sightings ADD COLUMN action_link VARCHAR"))


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, payload: dict):
        stale = []
        for connection in self.active_connections:
            try:
                await connection.send_json(payload)
            except Exception:
                stale.append(connection)
        for connection in stale:
            self.disconnect(connection)


manager = ConnectionManager()
CONFIDENCE_GATE = 60.0
ensure_schema_columns()


# ══════════════════════════════════════════════════════════════════════════════
#  VICTIM ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/victim/register", response_model=schemas.VictimResponse, tags=["Victim"])
async def register_victim(
    name        : str        = Form(...),
    age         : int        = Form(...),
    description : str        = Form(""),
    photo       : UploadFile = File(...),
    additional_media: list[UploadFile] = File(default=[]),
    db          : Session    = Depends(get_db)
):
    """
    Register the missing person with their reference photo.
    For this prototype we support one active victim profile.
    """
    victim = models.Victim(
        name            = name,
        age             = age,
        description     = description,
        reference_photo = save_upload(photo, STORAGE / "victim"),
        additional_media_paths = []
    )
    db.add(victim)
    db.flush()

    media_dir = STORAGE / "sightings" / f"victim_{victim.id}"
    media_dir.mkdir(parents=True, exist_ok=True)
    victim.additional_media_paths = [
        save_upload(media, media_dir) for media in additional_media if media and media.filename
    ]

    db.commit()
    db.refresh(victim)
    return victim


@app.get("/victim/profile", response_model=schemas.VictimResponse, tags=["Victim"])
def get_victim(db: Session = Depends(get_db)):
    """Return the most recently registered missing person profile."""
    victim = db.query(models.Victim).order_by(models.Victim.id.desc()).first()
    if not victim:
        raise HTTPException(status_code=404, detail="No victim registered yet.")
    return victim


# ══════════════════════════════════════════════════════════════════════════════
#  SIGHTING ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/sightings/process", response_model=schemas.SightingProcessResponse, tags=["Sightings"])
async def process_sighting(
    location  : str           = Form(...),
    camera_id : Optional[str] = Form(None),
    timestamp : str           = Form(...),           # ISO 8601 e.g. "2024-06-15T14:30:00"
    latitude  : Optional[float] = Form(None),
    longitude : Optional[float] = Form(None),
    notes     : Optional[str]   = Form(None),
    image     : UploadFile      = File(...),
    db        : Session         = Depends(get_db)
):
    """
    Submit a sighting image + location. The backend will:
    1. Save the image
    2. Run face matching against the registered victim
    3. Draw a bounding box on the sighting image
    4. Store and return the result with confidence + alert flag
    """
    # Fetch active victim
    victim = db.query(models.Victim).order_by(models.Victim.id.desc()).first()
    if not victim:
        raise HTTPException(status_code=404, detail="No victim registered. Register victim first.")

    if not victim.reference_photo or not os.path.exists(victim.reference_photo):
        raise HTTPException(status_code=400, detail="Reference photo missing or corrupted.")

    # Save sighting image
    sighting_dir = STORAGE / "sightings" / f"victim_{victim.id}"
    sighting_dir.mkdir(parents=True, exist_ok=True)
    sighting_path = save_upload(image, sighting_dir)

    # Run AI face matching
    match_result = match_faces(victim.reference_photo, sighting_path)

    if match_result["confidence"] < CONFIDENCE_GATE:
        return {
            "logged": False,
            "confidence": match_result["confidence"],
            "message": "Below confidence gate; sighting was not logged.",
            "sighting": None
        }

    sighting = models.Sighting(
        victim_id       = victim.id,
        location        = location,
        camera_id       = camera_id or location,
        latitude        = latitude,
        longitude       = longitude,
        timestamp       = timestamp,
        sighting_image  = sighting_path,
        annotated_image = match_result["annotated_path"],
        confidence      = match_result["confidence"],
        is_alert        = match_result["is_alert"],
        action_link     = match_result["annotated_path"],
        notes           = notes
    )
    db.add(sighting)
    db.commit()
    db.refresh(sighting)
    payload = schemas.SightingResponse.model_validate(sighting).model_dump()
    await manager.broadcast({"event": "new_sighting_log", "data": payload})
    return {
        "logged": True,
        "confidence": match_result["confidence"],
        "message": "Sighting logged successfully.",
        "sighting": sighting
    }


@app.post("/sighting/report", response_model=schemas.SightingProcessResponse, tags=["Sightings"])
async def report_sighting_legacy(
    location  : str           = Form(...),
    camera_id : Optional[str] = Form(None),
    timestamp : str           = Form(...),
    latitude  : Optional[float] = Form(None),
    longitude : Optional[float] = Form(None),
    notes     : Optional[str]   = Form(None),
    image     : UploadFile      = File(...),
    db        : Session         = Depends(get_db)
):
    return await process_sighting(location, camera_id, timestamp, latitude, longitude, notes, image, db)


@app.get("/sightings/all", response_model=list[schemas.SightingResponse], tags=["Sightings"])
def get_all_sightings(db: Session = Depends(get_db)):
    """Return full sighting log ordered by timestamp (for dashboard timeline)."""
    return db.query(models.Sighting).order_by(models.Sighting.timestamp).all()


@app.get("/sightings/logs", response_model=list[schemas.SightingResponse], tags=["Sightings"])
def get_logs(db: Session = Depends(get_db)):
    return db.query(models.Sighting).order_by(models.Sighting.created_at.desc()).all()


@app.get("/sightings/alerts", response_model=list[schemas.SightingResponse], tags=["Sightings"])
def get_alerts(db: Session = Depends(get_db)):
    """Return only high-confidence sightings that triggered an alert."""
    return (
        db.query(models.Sighting)
        .filter(models.Sighting.is_alert == True)
        .order_by(models.Sighting.timestamp)
        .all()
    )


@app.get("/sightings/stats", tags=["Sightings"])
def get_stats(db: Session = Depends(get_db)):
    """Quick summary stats for the dashboard header."""
    total   = db.query(models.Sighting).count()
    alerts  = db.query(models.Sighting).filter(models.Sighting.is_alert == True).count()
    victim  = db.query(models.Victim).order_by(models.Victim.id.desc()).first()

    top_sighting = (
        db.query(models.Sighting)
        .order_by(models.Sighting.confidence.desc())
        .first()
    )

    return {
        "total_sightings" : total,
        "total_alerts"    : alerts,
        "victim_name"     : victim.name if victim else None,
        "top_match"       : {
            "location"   : top_sighting.location,
            "confidence" : top_sighting.confidence,
            "timestamp"  : top_sighting.timestamp
        } if top_sighting else None
    }


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Missing Persons AI backend is running."}


@app.websocket("/ws/sightings")
async def sightings_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)