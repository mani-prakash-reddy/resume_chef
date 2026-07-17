"""
HTTP router for the resumes module.
All routes require authentication (get_current_user dependency).
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from auth.dependencies import AuthUser, get_current_user
from database.database import get_db
from database.models import Subscription
from resumes.repository import SqlAlchemyResumeRepository
from resumes.schemas import (
    ResumeCreate,
    ResumeListResponse,
    ResumeListItem,
    ResumeResponse,
    ResumeUpdate,
)
from resumes.service import ResumeService

router = APIRouter(prefix="/resumes", tags=["resumes"])


# ---------------------------------------------------------------------------
# Dependency factories
# ---------------------------------------------------------------------------


def get_resume_repo(db: AsyncSession = Depends(get_db)) -> SqlAlchemyResumeRepository:
    return SqlAlchemyResumeRepository(db)


def get_resume_service(
    repo: SqlAlchemyResumeRepository = Depends(get_resume_repo),
) -> ResumeService:
    return ResumeService(repo)


async def get_subscription(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Subscription | None:
    """Fetch the current user's subscription row (or None for free tier)."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("", response_model=ResumeListResponse)
async def list_resumes(
    include_archived: bool = Query(default=False),
    current_user: AuthUser = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service),
):
    """List all resumes belonging to the authenticated user."""
    resumes = await service.list_resumes(
        user_id=current_user.id,
        include_archived=include_archived,
    )
    items = [ResumeListItem.model_validate(r) for r in resumes]
    return ResumeListResponse(resumes=items, total=len(items))


@router.post("", response_model=ResumeResponse, status_code=201)
async def create_resume(
    body: ResumeCreate,
    current_user: AuthUser = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service),
    subscription: Subscription | None = Depends(get_subscription),
):
    """Create a new resume (free-tier cap enforced)."""
    resume = await service.create_resume(
        user_id=current_user.id,
        data=body,
        subscription=subscription,
    )
    return ResumeResponse.model_validate(resume)


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: UUID,
    current_user: AuthUser = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service),
):
    """Get a single resume by ID (ownership enforced)."""
    resume = await service.get_resume(resume_id=resume_id, user_id=current_user.id)
    return ResumeResponse.model_validate(resume)


@router.patch("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: UUID,
    body: ResumeUpdate,
    current_user: AuthUser = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service),
):
    """
    Partial update — used by the frontend auto-sync every N seconds.
    Only provided fields are updated; omitted fields are untouched.
    """
    resume = await service.update_resume(
        resume_id=resume_id,
        user_id=current_user.id,
        data=body,
    )
    return ResumeResponse.model_validate(resume)


@router.delete("/{resume_id}", status_code=204)
async def delete_resume(
    resume_id: UUID,
    current_user: AuthUser = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service),
):
    """
    Hard-delete a resume.
    """
    await service.delete_resume(resume_id=resume_id, user_id=current_user.id)
