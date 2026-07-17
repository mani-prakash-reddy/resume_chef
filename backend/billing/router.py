"""
Billing router — Razorpay checkout and webhook handling.

Endpoints:
  POST /billing/checkout              — create a Razorpay order
  POST /billing/webhook/razorpay      — idempotent webhook handler
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from loguru import logger
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from auth.dependencies import AuthUser, get_current_user
from billing.providers.razorpay import RazorpayProvider, WebhookEvent
from config import settings
from credits.service import CreditsService
from database.database import get_db
from database.models import PaymentOrder, PricingTier, Subscription

router = APIRouter(prefix="/billing", tags=["billing"])


# ---------------------------------------------------------------------------
# Dependency: Razorpay provider (only created if keys are configured)
# ---------------------------------------------------------------------------


def get_razorpay_provider() -> RazorpayProvider:
    if not all([settings.razorpay_key_id, settings.razorpay_key_secret, settings.razorpay_webhook_secret]):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay is not configured on this server.",
        )
    return RazorpayProvider(
        key_id=settings.razorpay_key_id,
        key_secret=settings.razorpay_key_secret,
        webhook_secret=settings.razorpay_webhook_secret,
    )


def get_credits_service(db: AsyncSession = Depends(get_db)) -> CreditsService:
    return CreditsService(db)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class CheckoutRequest(BaseModel):
    plan: str          # "monthly" | "annual"
    country_code: str  # e.g. "IN"


class CheckoutResponse(BaseModel):
    order_id: str
    amount_minor: int
    currency: str
    key_id: str


# ---------------------------------------------------------------------------
# POST /billing/checkout
# ---------------------------------------------------------------------------


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    body: CheckoutRequest,
    current_user: AuthUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    provider: RazorpayProvider = Depends(get_razorpay_provider),
):
    """
    Create a Razorpay order for the selected plan and country.
    The frontend uses the returned order_id + key_id to open Razorpay Checkout.js.
    """
    # Look up pricing for this country
    result = await db.execute(
        select(PricingTier).where(PricingTier.country_code == body.country_code)
    )
    tier = result.scalar_one_or_none()
    if tier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No pricing found for country: {body.country_code}",
        )

    amount = tier.monthly_price_minor if body.plan == "monthly" else tier.annual_price_minor
    credits = tier.monthly_credits if body.plan == "monthly" else tier.monthly_credits * 10

    order = await provider.create_order(amount_minor=amount, currency=tier.currency)

    # Record the order for idempotency in the webhook handler
    payment_order = PaymentOrder(
        user_id=current_user.id,
        provider="razorpay",
        provider_order_id=order.provider_order_id,
        amount_minor=amount,
        currency=tier.currency,
        credits_granted=credits,
        status="created",
    )
    db.add(payment_order)
    await db.commit()

    return CheckoutResponse(
        order_id=order.provider_order_id,
        amount_minor=amount,
        currency=tier.currency,
        key_id=order.key_id,
    )


# ---------------------------------------------------------------------------
# POST /billing/webhook/razorpay
# ---------------------------------------------------------------------------


@router.post("/webhook/razorpay", status_code=200)
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    provider: RazorpayProvider = Depends(get_razorpay_provider),
    credits: CreditsService = Depends(get_credits_service),
):
    """
    Idempotent Razorpay webhook handler.

    Flow:
      1. Verify X-Razorpay-Signature.
      2. Parse event — only process payment.captured.
      3. Check payment_orders row is still "created" (idempotency guard).
      4. Mark paid, upsert subscription, credit wallet via credit_transactions.
    """
    body_bytes = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not provider.verify_signature(body_bytes, signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    raw = json.loads(body_bytes)
    event: WebhookEvent | None = provider.parse_event(raw)

    if event is None:
        # Non-capture event — acknowledge and ignore
        return {"status": "ignored"}

    # Idempotency: check if we've already processed this order
    result = await db.execute(
        select(PaymentOrder).where(
            PaymentOrder.provider_order_id == event.provider_order_id,
            PaymentOrder.status == "created",
        )
    )
    order = result.scalar_one_or_none()

    if order is None:
        logger.info(f"Webhook: order {event.provider_order_id} already processed or not found — skipping")
        return {"status": "already_processed"}

    # Mark order as paid
    order.status = "paid"
    db.add(order)

    # Upsert subscription
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == order.user_id)
    )
    sub = sub_result.scalar_one_or_none()
    if sub is None:
        sub = Subscription(
            user_id=order.user_id,
            plan="monthly",
            status="active",
            provider="razorpay",
        )
        db.add(sub)
    else:
        sub.plan = "monthly"
        sub.status = "active"
        sub.provider = "razorpay"
        db.add(sub)

    await db.flush()

    # Credit the wallet
    await credits.credit_wallet(
        user_id=str(order.user_id),
        amount=order.credits_granted,
        action_type="subscription_grant",
        reference_id=str(order.id),
        metadata={
            "provider_order_id": event.provider_order_id,
            "payment_id": event.payment_id,
            "plan": sub.plan,
        },
    )

    logger.info(f"Webhook: credited {order.credits_granted} credits to user {order.user_id}")
    return {"status": "ok"}
