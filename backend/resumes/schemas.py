"""
Pydantic schemas (DTOs) for the resumes module.
"""

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


BuilderType = Literal["latex", "html", "wysiwyg"]


class ResumeCreate(BaseModel):
    title: str = Field(default="Untitled Resume", max_length=255)
    file_name: Optional[str] = None
    builder_type: BuilderType = "latex"
    content_code: Optional[str] = None
    content_elements: Optional[Any] = None
    template_id: Optional[str] = None
    job_description: Optional[str] = None


class ResumeUpdate(BaseModel):
    """Partial update — all fields optional (used by auto-sync PATCH)."""

    title: Optional[str] = Field(default=None, max_length=255)
    file_name: Optional[str] = None
    content_code: Optional[str] = None
    content_elements: Optional[Any] = None
    job_description: Optional[str] = None
    is_archived: Optional[bool] = None


class ResumeResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    file_name: Optional[str] = None
    builder_type: BuilderType
    content_code: Optional[str] = None
    content_elements: Optional[Any] = None
    template_id: Optional[str] = None
    job_description: Optional[str] = None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResumeListItem(BaseModel):
    """Lightweight representation for list endpoints (no content payload)."""

    id: UUID
    title: str
    builder_type: BuilderType
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResumeListResponse(BaseModel):
    resumes: list[ResumeListItem]
    total: int
