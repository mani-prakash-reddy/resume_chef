"""
Credits router — exposes balance and usage info to the frontend.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from auth.dependencies import AuthUser, get_current_user
from credits.service import CreditsService
from credits.service import _today_key as get_today_key
from database.database import get_db
from database.models import FreeTierUsage, Subscription
from config import settings
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/credits", tags=["credits"])


class BalanceResponse(BaseModel):
    balance: int
    plan: str
    free_chat_used: int
    free_chat_limit: int
    free_ats_used: int
    free_ats_limit: int


def get_credits_service(db: AsyncSession = Depends(get_db)) -> CreditsService:
    return CreditsService(db)


@router.get("/balance", response_model=BalanceResponse)
async def get_balance(
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    credits: CreditsService = Depends(get_credits_service),
):
    """Return the user's credit balance and free-tier usage for today."""
    balance = await credits.get_balance(str(current_user.id))

    # Get subscription plan
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    sub = sub_result.scalar_one_or_none()
    plan = sub.plan if sub else "free"

    # Get today's free-tier usage
    usage_result = await db.execute(
        select(FreeTierUsage).where(
            FreeTierUsage.user_id == current_user.id,
            FreeTierUsage.period_key == get_today_key(),
        )
    )
    usage = usage_result.scalar_one_or_none()

    return BalanceResponse(
        balance=balance,
        plan=plan,
        free_chat_used=usage.chat_messages_used if usage else 0,
        free_chat_limit=settings.free_tier_daily_chat_limit,
        free_ats_used=usage.ats_checks_used if usage else 0,
        free_ats_limit=settings.free_tier_daily_ats_limit,
    )
