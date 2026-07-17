"""
Business Logic Layer for resumes.
- Enforces the free-tier 1-active-resume slot cap.
- Delegates all DB operations to the repository.
"""

from uuid import UUID

from fastapi import HTTPException, status

from database.models import Resume, Subscription
from resumes.repository import ResumeRepository
from resumes.schemas import ResumeCreate, ResumeUpdate

FREE_TIER_MAX_RESUMES = 1


class ResumeService:
    def __init__(self, repo: ResumeRepository):
        self._repo = repo

    async def list_resumes(self, user_id: UUID, include_archived: bool = False):
        return await self._repo.list_by_user(user_id, include_archived=include_archived)

    async def get_resume(self, resume_id: UUID, user_id: UUID) -> Resume:
        resume = await self._repo.get_by_id(resume_id, user_id)
        if resume is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        return resume

    async def create_resume(
        self,
        user_id: UUID,
        data: ResumeCreate,
        subscription: Subscription | None,
    ) -> Resume:
        """
        Create a new resume.
        Free-tier users are limited to FREE_TIER_MAX_RESUMES active resumes.
        Pro users have no limit (or a higher configurable cap — not yet enforced here).
        """
        plan = subscription.plan if subscription else "free"
        if plan == "free":
            active_count = await self._repo.count_active(user_id)
            if active_count >= FREE_TIER_MAX_RESUMES:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "code": "resume_slot_limit",
                        "message": (
                            f"Free tier allows {FREE_TIER_MAX_RESUMES} active resume. "
                            "Upgrade to Pro for unlimited resumes."
                        ),
                    },
                )

        resume = Resume(
            user_id=user_id,
            title=data.title,
            builder_type=data.builder_type,
            content_code=data.content_code,
            content_elements=data.content_elements,
            template_id=data.template_id,
            job_description=data.job_description,
        )
        return await self._repo.create(resume)

    async def update_resume(
        self, resume_id: UUID, user_id: UUID, data: ResumeUpdate
    ) -> Resume:
        """Partial update — used by the frontend auto-sync."""
        updates = data.model_dump(exclude_none=True)
        resume = await self._repo.update(resume_id, user_id, updates)
        if resume is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        return resume

    async def archive_resume(self, resume_id: UUID, user_id: UUID) -> Resume:
        """Soft-delete: marks the resume as archived (not hard-deleted)."""
        resume = await self._repo.update(resume_id, user_id, {"is_archived": True})
        if resume is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
        return resume

    async def delete_resume(self, resume_id: UUID, user_id: UUID) -> None:
        """Hard delete — use with caution. Prefer archive_resume."""
        deleted = await self._repo.delete(resume_id, user_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
