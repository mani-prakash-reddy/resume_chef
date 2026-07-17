"""
Database initialization and session management for PostgreSQL with pgvector
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from config import settings
from database.models import Base
from loguru import logger


# Create async engine for PostgreSQL
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    connect_args={'ssl': 'require'}
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        # Create all tables defined in models.py
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized successfully")


async def get_db():
    """FastAPI dependency: yields an async SQLAlchemy session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
