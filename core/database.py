from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# --- Engine ---
# connect_args only needed for SQLite, safe to omit for PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # drops stale connections automatically
    pool_size=10,             # max persistent connections in pool
    max_overflow=20,          # extra connections allowed under load
)

# --- Session Factory ---
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# --- Base for all ORM models ---
Base = declarative_base()


def get_db():
    """
    FastAPI dependency — yields a DB session per request, always closes it.
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    Called at startup to create all tables that don't exist yet.
    In production, prefer Alembic migrations instead.
    """
    Base.metadata.create_all(bind=engine)