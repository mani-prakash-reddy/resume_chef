"""
Credits Service — the single place all quota/credit logic lives.

Two modes based on the user's subscription plan:

Free tier:
  - Uses free_tier_usage rows keyed by (user_id, period_key) where
    period_key = today's UTC date (e.g. "2026-07-16").
  - A new row per day = automatic daily reset with no cron needed.
  - Quota exceeded → raises HTTP 429.

Pro tier:
  - Debits the wallet (credit_transactions ledger + wallet.balance cache).
  - Insufficient balance → raises HTTP 402.
  - Debit happens AFTER a successful AI call (settle()), never before.
    check_and_reserve() does a soft balance check; settle() does the real debit.

Action costs:
  - chat_message : 1 credit
  - ats_check    : 2 credits
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database.models import (
    CreditTransaction,
    FreeTierUsage,
    Subscription,
    Wallet,
)

# ---- Cost table ----
ACTION_COSTS: dict[str, int] = {
    "chat_message": settings.credit_cost_chat_message,
    "ats_check": settings.credit_cost_ats_check,
}

# ---- Free-tier daily limits ----
FREE_TIER_LIMITS: dict[str, int] = {
    "chat_message": settings.free_tier_daily_chat_limit,
    "ats_check": settings.free_tier_daily_ats_limit,
}

# ---- Columns to increment per action ----
FREE_USAGE_COLUMN: dict[str, str] = {
    "chat_message": "chat_messages_used",
    "ats_check": "ats_checks_used",
}


def _today_key() -> str:
    """Current UTC date as ISO string — used as free-tier period key."""
    return datetime.now(timezone.utc).date().isoformat()


class CreditsService:
    def __init__(self, db: AsyncSession):
        self._db = db

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------

    async def get_balance(self, user_id: str) -> int:
        """Return the user's current credit balance (0 for free tier / no wallet yet)."""
        result = await self._db.execute(
            select(Wallet).where(Wallet.user_id == user_id)
        )
        wallet = result.scalar_one_or_none()
        return wallet.balance if wallet else 0

    async def check_and_reserve(
        self,
        user_id: str,
        action_type: str,
        subscription: Optional[Subscription],
    ) -> None:
        """
        Soft check before an AI call.
        - Free tier: verify daily quota hasn't been exceeded.
        - Pro tier: verify wallet balance >= cost.
        Raises HTTP 429 (free) or HTTP 402 (pro) on failure.
        """
        plan = subscription.plan if subscription else "free"

        if plan == "free":
            await self._check_free_tier(user_id, action_type)
        else:
            cost = ACTION_COSTS.get(action_type, 1)
            await self._check_wallet(user_id, cost)

    async def settle(
        self,
        user_id: str,
        action_type: str,
        subscription: Optional[Subscription],
        token_metadata: Optional[dict] = None,
    ) -> None:
        """
        Hard debit after a successful AI call.
        - Free tier: increment the daily usage counter.
        - Pro tier: debit wallet + append credit_transactions row.
        """
        plan = subscription.plan if subscription else "free"

        if plan == "free":
            await self._increment_free_tier(user_id, action_type)
        else:
            cost = ACTION_COSTS.get(action_type, 1)
            await self._debit_wallet(
                user_id=user_id,
                action_type=action_type,
                cost=cost,
                token_metadata=token_metadata or {},
            )

    # -----------------------------------------------------------------------
    # Free-tier helpers
    # -----------------------------------------------------------------------

    async def _check_free_tier(self, user_id: str, action_type: str) -> None:
        period_key = _today_key()
        limit = FREE_TIER_LIMITS.get(action_type, 0)
        col = FREE_USAGE_COLUMN.get(action_type)

        result = await self._db.execute(
            select(FreeTierUsage).where(
                FreeTierUsage.user_id == user_id,
                FreeTierUsage.period_key == period_key,
            )
        )
        usage = result.scalar_one_or_none()

        used = getattr(usage, col, 0) if usage else 0

        if used >= limit:
            action_label = "AI chat messages" if action_type == "chat_message" else "ATS checks"
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "quota_exceeded",
                    "action_type": action_type,
                    "limit": limit,
                    "used": used,
                    "message": (
                        f"You've used your daily {action_label} allowance ({limit}/day on free tier). "
                        "Upgrade to Pro or watch an ad to get more."
                    ),
                },
            )

    async def _increment_free_tier(self, user_id: str, action_type: str) -> None:
        period_key = _today_key()
        col = FREE_USAGE_COLUMN.get(action_type)

        result = await self._db.execute(
            select(FreeTierUsage).where(
                FreeTierUsage.user_id == user_id,
                FreeTierUsage.period_key == period_key,
            )
        )
        usage = result.scalar_one_or_none()

        if usage is None:
            # First use today — create a new row
            new_usage = FreeTierUsage(
                user_id=user_id,
                period_key=period_key,
                chat_messages_used=1 if action_type == "chat_message" else 0,
                ats_checks_used=1 if action_type == "ats_check" else 0,
            )
            self._db.add(new_usage)
        else:
            # Increment the appropriate counter
            current = getattr(usage, col, 0)
            setattr(usage, col, current + 1)
            self._db.add(usage)

        await self._db.commit()

    # -----------------------------------------------------------------------
    # Pro wallet helpers
    # -----------------------------------------------------------------------

    async def _check_wallet(self, user_id: str, cost: int) -> None:
        result = await self._db.execute(
            select(Wallet).where(Wallet.user_id == user_id).with_for_update()
        )
        wallet = result.scalar_one_or_none()
        balance = wallet.balance if wallet else 0

        if balance < cost:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "code": "insufficient_credits",
                    "balance": balance,
                    "required": cost,
                    "message": (
                        f"Insufficient credits. You have {balance} credit(s) but this action costs {cost}. "
                        "Top up your wallet to continue."
                    ),
                },
            )

    async def _debit_wallet(
        self,
        user_id: str,
        action_type: str,
        cost: int,
        token_metadata: dict,
    ) -> None:
        """
        Debit the wallet and append a credit_transactions row.
        Both operations happen in one DB transaction for consistency.
        """
        # Re-read wallet with lock
        result = await self._db.execute(
            select(Wallet).where(Wallet.user_id == user_id).with_for_update()
        )
        wallet = result.scalar_one_or_none()

        if wallet is None:
            # Wallet doesn't exist yet — shouldn't happen for Pro users, but handle gracefully
            wallet = Wallet(user_id=user_id, balance=0)
            self._db.add(wallet)
            await self._db.flush()

        new_balance = wallet.balance - cost
        wallet.balance = new_balance

        tx = CreditTransaction(
            user_id=user_id,
            delta=-cost,
            balance_after=new_balance,
            action_type=action_type,
            tx_metadata={
                **token_metadata,
                "agent": action_type.replace("_", "_agent_"),  # e.g. "chat_agent"
            },
        )
        self._db.add(tx)
        await self._db.commit()

    # -----------------------------------------------------------------------
    # Credit top-up (called by billing webhook after payment)
    # -----------------------------------------------------------------------

    async def credit_wallet(
        self,
        user_id: str,
        amount: int,
        action_type: str = "subscription_grant",
        reference_id: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> None:
        """
        Add credits to a user's wallet.
        Creates wallet row if it doesn't exist.
        """
        result = await self._db.execute(
            select(Wallet).where(Wallet.user_id == user_id).with_for_update()
        )
        wallet = result.scalar_one_or_none()

        if wallet is None:
            wallet = Wallet(user_id=user_id, balance=amount)
            self._db.add(wallet)
            new_balance = amount
        else:
            new_balance = wallet.balance + amount
            wallet.balance = new_balance

        tx = CreditTransaction(
            user_id=user_id,
            delta=amount,
            balance_after=new_balance,
            action_type=action_type,
            reference_id=reference_id,
            tx_metadata=metadata or {},
        )
        self._db.add(tx)
        await self._db.commit()
