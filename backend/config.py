"""
Application Configuration
Includes business rules derived from client Q&A requirements.
"""

from pydantic_settings import BaseSettings
from pydantic import BaseModel
from typing import Optional, Dict, List

# =========================================================
# Application Settings
# =========================================================


def _normalize_async_database_url(url: str) -> str:
    """Ensure the URL uses an async PostgreSQL driver for SQLAlchemy async engine."""
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql+psycopg2://"):
        return url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


class Settings(BaseSettings):
    """Application settings"""

    # Database - PostgreSQL (async driver required, Supabase connection string)
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/postgres"

    # Supabase Auth (JWT verification for API requests)
    supabase_url: str = ""
    supabase_jwt_secret: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env

    def model_post_init(self, __context) -> None:
        self.database_url = _normalize_async_database_url(self.database_url)


settings = Settings()
