import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class CaseStatus(str, enum.Enum):
    active   = "active"
    resolved = "resolved"
    closed   = "closed"


class Gender(str, enum.Enum):
    male    = "male"
    female  = "female"
    other   = "other"
    unknown = "unknown"


class MissingPersonCase(Base):
    __tablename__ = "cases"

    id                   = Column(Integer, primary_key=True, index=True)
    name                 = Column(String(120), nullable=False)
    age                  = Column(Integer, nullable=True)
    gender               = Column(Enum(Gender), default=Gender.unknown)
    physical_description = Column(Text, nullable=True)    # height, build, hair, eyes
    last_seen_clothing   = Column(Text, nullable=True)
    last_seen_location   = Column(String(255), nullable=True)
    last_seen_lat        = Column(Float, nullable=True)
    last_seen_lng        = Column(Float, nullable=True)
    last_seen_at         = Column(DateTime, nullable=True)
    additional_notes     = Column(Text, nullable=True)
    status               = Column(Enum(CaseStatus), default=CaseStatus.active)
    reference_photo_path = Column(String(512), nullable=True)  # primary photo path
    created_at           = Column(DateTime, default=datetime.utcnow)
    updated_at           = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # FK to officer who filed the case
    created_by           = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by_user      = relationship("User", back_populates="cases")

    # Relationships
    sightings = relationship("Sighting", back_populates="case")
    alerts    = relationship("Alert", back_populates="case")