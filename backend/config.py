"""
Application Configuration
Includes business rules derived from client Q&A requirements.
"""

from pydantic_settings import BaseSettings
from typing import Optional


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

    # OpenRouter LLM provider
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Default model slugs (OpenRouter model strings)
    default_chat_model: str = "tencent/hy3:free"
    default_ats_model: str = "tencent/hy3:free"

    # Free tier daily quotas (resets per calendar day UTC)
    free_tier_daily_chat_limit: int = 5
    free_tier_daily_ats_limit: int = 1

    # Credit costs per action (for Pro wallet deductions)
    credit_cost_chat_message: int = 1
    credit_cost_ats_check: int = 2

    # Razorpay (Phase 3)
    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None
    razorpay_webhook_secret: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env

    def model_post_init(self, __context) -> None:
        self.database_url = _normalize_async_database_url(self.database_url)


settings = Settings()
