from pydantic import BaseModel
from typing import Optional

# ── Victim ──────────────────────────────────────────────────────────────────

class VictimCreate(BaseModel):
    name: str
    age: int
    description: Optional[str] = ""

class VictimResponse(BaseModel):
    id: int
    name: str
    age: int
    description: Optional[str]
    reference_photo: Optional[str]

    class Config:
        from_attributes = True


# ── Sighting ─────────────────────────────────────────────────────────────────

class SightingResponse(BaseModel):
    id: int
    victim_id: int
    location: str
    latitude: Optional[float]
    longitude: Optional[float]
    timestamp: str
    sighting_image: Optional[str]
    annotated_image: Optional[str]
    confidence: float
    is_alert: bool
    notes: Optional[str]

    class Config:
        from_attributes = True