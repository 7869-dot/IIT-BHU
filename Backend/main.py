from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pathlib import Path
from typing import Optional
import shutil, uuid, os

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
    return str(dest)


# ══════════════════════════════════════════════════════════════════════════════
#  VICTIM ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/victim/register", response_model=schemas.VictimResponse, tags=["Victim"])
async def register_victim(
    name        : str        = Form(...),
    age         : int        = Form(...),
    description : str        = Form(""),
    photo       : UploadFile = File(...),
    db          : Session    = Depends(get_db)
):
    """
    Register the missing person with their reference photo.
    For this prototype we support one active victim profile.
    """
    photo_path = save_upload(photo, STORAGE / "victim")

    victim = models.Victim(
        name            = name,
        age             = age,
        description     = description,
        reference_photo = photo_path
    )
    db.add(victim)
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

@app.post("/sighting/report", response_model=schemas.SightingResponse, tags=["Sightings"])
async def report_sighting(
    location  : str           = Form(...),
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
    sighting_path = save_upload(image, STORAGE / "sightings")

    # Run AI face matching
    match_result = match_faces(victim.reference_photo, sighting_path)

    sighting = models.Sighting(
        victim_id       = victim.id,
        location        = location,
        latitude        = latitude,
        longitude       = longitude,
        timestamp       = timestamp,
        sighting_image  = sighting_path,
        annotated_image = match_result["annotated_path"],
        confidence      = match_result["confidence"],
        is_alert        = match_result["is_alert"],
        notes           = notes
    )
    db.add(sighting)
    db.commit()
    db.refresh(sighting)
    return sighting


@app.get("/sightings/all", response_model=list[schemas.SightingResponse], tags=["Sightings"])
def get_all_sightings(db: Session = Depends(get_db)):
    """Return full sighting log ordered by timestamp (for dashboard timeline)."""
    return db.query(models.Sighting).order_by(models.Sighting.timestamp).all()


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