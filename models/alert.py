import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class AlertStatus(str, enum.Enum):
    new         = "new"
    acknowledged = "acknowledged"
    actioned    = "actioned"
    dismissed   = "dismissed"


class Alert(Base):
    __tablename__ = "alerts"

    id              = Column(Integer, primary_key=True, index=True)
    score           = Column(Float, nullable=False)         # composite score that triggered this
    status          = Column(Enum(AlertStatus), default=AlertStatus.new)
    notes           = Column(String(512), nullable=True)    # officer can add notes
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # FKs
    case_id             = Column(Integer, ForeignKey("cases.id"), nullable=False)
    sighting_id         = Column(Integer, ForeignKey("sightings.id"), nullable=False)
    assigned_officer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    case             = relationship("MissingPersonCase", back_populates="alerts")
    sighting         = relationship("Sighting", back_populates="alert")
    assigned_officer = relationship("User", back_populates="alerts")