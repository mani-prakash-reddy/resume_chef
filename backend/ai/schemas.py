"""
Pydantic schemas (DTOs) for the AI module.
"""

from typing import Any, Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Chat agent
# ---------------------------------------------------------------------------


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    resume_id: str  # UUID string of the resume to operate on
    builder_type: Optional[str] = "latex"  # latex | html | wysiwyg


# ---------------------------------------------------------------------------
# ATS agent
# ---------------------------------------------------------------------------


class AtsRequest(BaseModel):
    resume_content: str     # raw text of the resume currently in the editor
    job_description: str


class AtsResponse(BaseModel):
    score: int                          # 0-100
    matched_keywords: list[str]
    missing_keywords: list[str]
    suggestions: list[str]
    summary: str
