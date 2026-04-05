import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class UserRole(str, enum.Enum):
    admin   = "admin"
    officer = "officer"
    ngo     = "ngo"
    public  = "public"


class User(Base):
    __tablename__ = "users"

    id           = Column(Integer, primary_key=True, index=True)
    full_name    = Column(String(120), nullable=False)
    email        = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role         = Column(Enum(UserRole), default=UserRole.public, nullable=False)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cases    = relationship("MissingPersonCase", back_populates="created_by_user")
    sightings = relationship("Sighting", back_populates="reported_by_user")
    alerts   = relationship("Alert", back_populates="assigned_officer")