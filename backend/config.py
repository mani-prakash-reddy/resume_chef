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


class Settings(BaseSettings):
    """Application settings"""


    
    # Database - PostgreSQL
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/postgres"
    

    class Config:
        # env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env


settings = Settings()
