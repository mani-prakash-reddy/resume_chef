"""
Data Access Layer for resumes.
All queries enforce user_id ownership — a user can never read/write another user's resume.
"""

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Resume


class ResumeRepository(ABC):
    @abstractmethod
    async def get_by_id(self, resume_id: UUID, user_id: UUID) -> Optional[Resume]:
        """Return the resume only if it belongs to user_id, else None."""

    @abstractmethod
    async def list_by_user(self, user_id: UUID, include_archived: bool = False) -> list[Resume]:
        pass

    @abstractmethod
    async def count_active(self, user_id: UUID) -> int:
        """Count non-archived resumes for a user (used for free-tier slot cap)."""

    @abstractmethod
    async def create(self, resume: Resume) -> Resume:
        pass

    @abstractmethod
    async def update(self, resume_id: UUID, user_id: UUID, updates: dict) -> Optional[Resume]:
        pass

    @abstractmethod
    async def delete(self, resume_id: UUID, user_id: UUID) -> bool:
        """Hard delete (only used if explicitly requested; prefer archiving)."""


class SqlAlchemyResumeRepository(ResumeRepository):
    def __init__(self, db: AsyncSession):
        self._db = db

    async def get_by_id(self, resume_id: UUID, user_id: UUID) -> Optional[Resume]:
        result = await self._db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: UUID, include_archived: bool = False) -> list[Resume]:
        stmt = select(Resume).where(Resume.user_id == user_id)
        if not include_archived:
            stmt = stmt.where(Resume.is_archived == False)  # noqa: E712
        stmt = stmt.order_by(Resume.updated_at.desc())
        result = await self._db.execute(stmt)
        return list(result.scalars().all())

    async def count_active(self, user_id: UUID) -> int:
        result = await self._db.execute(
            select(Resume).where(Resume.user_id == user_id, Resume.is_archived == False)  # noqa: E712
        )
        return len(result.scalars().all())

    async def create(self, resume: Resume) -> Resume:
        self._db.add(resume)
        await self._db.commit()
        await self._db.refresh(resume)
        return resume

    async def update(self, resume_id: UUID, user_id: UUID, updates: dict) -> Optional[Resume]:
        # Filter out None values so we only set provided fields
        filtered = {k: v for k, v in updates.items() if v is not None}
        if not filtered:
            return await self.get_by_id(resume_id, user_id)

        stmt = (
            update(Resume)
            .where(Resume.id == resume_id, Resume.user_id == user_id)
            .values(**filtered)
            .returning(Resume)
        )
        result = await self._db.execute(stmt)
        await self._db.commit()
        return result.scalar_one_or_none()

    async def delete(self, resume_id: UUID, user_id: UUID) -> bool:
        resume = await self.get_by_id(resume_id, user_id)
        if resume is None:
            return False
        await self._db.delete(resume)
        await self._db.commit()
        return True
