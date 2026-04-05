from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # --- App ---
    APP_NAME: str = "Missing Persons Platform"
    DEBUG: bool = False

    # --- Database ---
    DATABASE_URL: str

    # --- JWT ---
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Gemini ---
    GEMINI_API_KEY: str

    # --- ChromaDB ---
    CHROMA_PERSIST_DIR: str = "./chroma_store"
    FACE_COLLECTION: str = "face_embeddings"
    TEXT_COLLECTION: str = "text_embeddings"

    # --- File Uploads ---
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10

    # --- Matching ---
    MATCH_THRESHOLD: float = 0.75
    TOP_K_RESULTS: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


# Single importable instance
settings = get_settings()