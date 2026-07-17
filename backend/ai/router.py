"""
HTTP router for the AI module.

Endpoints:
  POST /ai/chat  — SSE streaming chat agent (Chat / Resume Agent)
  POST /ai/ats   — JSON ATS analysis (ATS Agent)

Credit enforcement (Phase 2) is integrated here:
  - check_and_reserve() called before the AI call
  - settle() called after a successful AI call
  Failed LLM calls never cost the user credits.
"""

import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ai.chat_agent.agent import run_chat_agent_streaming
from ai.ats_agent.agent import run_ats_agent
from ai.mcp_tools import create_resume_tools
from ai.schemas import AtsRequest, AtsResponse, ChatRequest
from auth.dependencies import AuthUser, get_current_user
from credits.service import CreditsService
from database.database import get_db
from database.models import Resume, Subscription
from loguru import logger

router = APIRouter(prefix="/ai", tags=["ai"])


# ---------------------------------------------------------------------------
# Dependency factories
# ---------------------------------------------------------------------------


def get_credits_service(db: AsyncSession = Depends(get_db)) -> CreditsService:
    return CreditsService(db)


async def get_user_subscription(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Subscription | None:
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# POST /ai/chat
# ---------------------------------------------------------------------------


@router.post("/chat")
async def chat(
    body: ChatRequest,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    credits: CreditsService = Depends(get_credits_service),
    subscription: Subscription | None = Depends(get_user_subscription),
):
    """
    Streaming chat agent endpoint.
    Returns an SSE stream of JSON events:
      data: {"type": "token",       "content": "..."}
      data: {"type": "status",      "content": "Reading resume..."}
      data: {"type": "patch_result","content": {...}}
      data: {"type": "done"}
      data: {"type": "error",       "content": "..."}
    """
    # Validate the resume belongs to this user
    resume_result = await db.execute(
        select(Resume).where(
            Resume.id == body.resume_id,
            Resume.user_id == current_user.id,
        )
    )
    resume = resume_result.scalar_one_or_none()
    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # --- Phase 2: Credit enforcement (check before, settle after) ---
    await credits.check_and_reserve(
        user_id=str(current_user.id),
        action_type="chat_message",
        subscription=subscription,
    )

    # Bind MCP tools to this resume + session
    tools_dict = create_resume_tools(resume_id=str(body.resume_id), db=db)

    async def generate():
        token_metadata = {"model": "", "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        succeeded = False
        try:
            async for chunk in run_chat_agent_streaming(
                messages=[m.model_dump() for m in body.messages],
                resume_id=str(body.resume_id),
                builder_type=body.builder_type or resume.builder_type,
                tools_dict=tools_dict,
            ):
                yield chunk
                if '"type": "done"' in chunk:
                    succeeded = True
        except Exception as exc:
            logger.error(f"Chat agent error: {exc}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(exc)})}\n\n"
        finally:
            if succeeded:
                await credits.settle(
                    user_id=str(current_user.id),
                    action_type="chat_message",
                    subscription=subscription,
                    token_metadata=token_metadata,
                )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# POST /ai/ats
# ---------------------------------------------------------------------------


@router.post("/ats", response_model=AtsResponse)
async def analyze_ats(
    body: AtsRequest,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    credits: CreditsService = Depends(get_credits_service),
    subscription: Subscription | None = Depends(get_user_subscription),
):
    """
    ATS analysis endpoint.
    The frontend provides the current editor content directly — the backend
    does NOT fetch from DB, ensuring the agent always analyzes what the user sees.
    """
    # --- Phase 2: Credit enforcement ---
    await credits.check_and_reserve(
        user_id=str(current_user.id),
        action_type="ats_check",
        subscription=subscription,
    )

    try:
        result = await run_ats_agent(
            resume_content=body.resume_content,
            job_description=body.job_description,
        )
    except Exception as exc:
        logger.error(f"ATS agent error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ATS analysis failed. Please try again.",
        )

    # Settle credits after successful AI call
    # Token metadata not available for structured output; log zeros for now
    await credits.settle(
        user_id=str(current_user.id),
        action_type="ats_check",
        subscription=subscription,
        token_metadata={
            "model": "google/gemini-2.0-flash-001",
            "agent": "ats_agent",
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
        },
    )

    return AtsResponse(
        score=result.score,
        matched_keywords=result.matched_keywords,
        missing_keywords=result.missing_keywords,
        suggestions=result.suggestions,
        summary=result.summary,
    )
