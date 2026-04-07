from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from database import Base

class Victim(Base):
    __tablename__ = "victims"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, nullable=False)
    age             = Column(Integer)
    description     = Column(String)
    reference_photo = Column(String)           # path to stored image
    additional_media_paths = Column(JSON, default=list)
    created_at      = Column(DateTime, server_default=func.now())


class Sighting(Base):
    __tablename__ = "sightings"

    id               = Column(Integer, primary_key=True, index=True)
    victim_id        = Column(Integer, nullable=False)
    location         = Column(String, nullable=False)   # e.g. "New Delhi"
    camera_id        = Column(String, nullable=True)
    latitude         = Column(Float, nullable=True)
    longitude        = Column(Float, nullable=True)
    timestamp        = Column(String, nullable=False)   # ISO string from reporter
    sighting_image   = Column(String)                   # path to uploaded image
    annotated_image  = Column(String)                   # path to image with bounding box
    confidence       = Column(Float, default=0.0)       # 0-100
    is_alert         = Column(Boolean, default=False)   # True if confidence > threshold
    action_link      = Column(String, nullable=True)
    notes            = Column(String, nullable=True)
    created_at       = Column(DateTime, server_default=func.now())