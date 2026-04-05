import enum
from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class SightingSource(str, enum.Enum):
    public_tip  = "public_tip"
    cctv        = "cctv"
    social_media = "social_media"
    officer     = "officer"


class Sighting(Base):
    __tablename__ = "sightings"

    id              = Column(Integer, primary_key=True, index=True)
    raw_text        = Column(Text, nullable=True)          # original tip text
    extracted_data  = Column(JSON, nullable=True)          # Gemini structured output
    image_path      = Column(String(512), nullable=True)   # uploaded sighting image
    source          = Column(Enum(SightingSource), default=SightingSource.public_tip)
    lat             = Column(Float, nullable=True)
    lng             = Column(Float, nullable=True)
    location_name   = Column(String(255), nullable=True)

    # Match results
    matched_case_id   = Column(Integer, ForeignKey("cases.id"), nullable=True)
    face_score        = Column(Float, nullable=True)       # 0.0 - 1.0
    text_score        = Column(Float, nullable=True)       # 0.0 - 1.0
    composite_score   = Column(Float, nullable=True)       # weighted final score
    all_match_scores  = Column(JSON, nullable=True)        # top-K candidates

    reported_by     = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at      = Column(DateTime, default=datetime.utcnow)

    # Relationships
    case              = relationship("MissingPersonCase", back_populates="sightings")
    reported_by_user  = relationship("User", back_populates="sightings")
    alert             = relationship("Alert", back_populates="sighting", uselist=False)