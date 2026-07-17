"""
Payment provider abstraction (Strategy Pattern).

The PaymentProvider ABC makes it easy to swap Razorpay for Stripe/Paddle
without touching the billing router.
"""

import hashlib
import hmac
from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel


class OrderSession(BaseModel):
    provider_order_id: str
    amount_minor: int
    currency: str
    key_id: str  # public key to pass to Checkout.js


class WebhookEvent(BaseModel):
    event_type: str          # e.g. "payment.captured"
    provider_order_id: str
    payment_id: str
    amount_minor: int
    currency: str


class PaymentProvider(ABC):
    @abstractmethod
    async def create_order(self, amount_minor: int, currency: str) -> OrderSession:
        """Create a payment order and return the data needed by Checkout.js."""

    @abstractmethod
    def verify_signature(self, payload_bytes: bytes, signature: str) -> bool:
        """Verify the webhook signature. Returns True if valid."""

    @abstractmethod
    def parse_event(self, raw_payload: dict) -> WebhookEvent | None:
        """
        Parse a raw webhook payload into a WebhookEvent.
        Returns None if the event type is not relevant (e.g. payment.failed).
        """


class RazorpayProvider(PaymentProvider):
    """
    Razorpay payment provider.

    Docs: https://razorpay.com/docs/api/
    Webhook signature: HMAC-SHA256 of raw request body using webhook_secret.
    """

    def __init__(self, key_id: str, key_secret: str, webhook_secret: str):
        self._key_id = key_id
        self._key_secret = key_secret
        self._webhook_secret = webhook_secret

        # Lazy import — razorpay SDK only needed if Razorpay is configured
        try:
            import razorpay
            self._client = razorpay.Client(auth=(key_id, key_secret))
        except ImportError:
            self._client = None

    async def create_order(self, amount_minor: int, currency: str) -> OrderSession:
        if self._client is None:
            raise RuntimeError("razorpay package not installed")

        order = self._client.order.create(
            {
                "amount": amount_minor,
                "currency": currency,
                "payment_capture": 1,
            }
        )
        return OrderSession(
            provider_order_id=order["id"],
            amount_minor=amount_minor,
            currency=currency,
            key_id=self._key_id,
        )

    def verify_signature(self, payload_bytes: bytes, signature: str) -> bool:
        expected = hmac.new(
            self._webhook_secret.encode(),
            payload_bytes,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    def parse_event(self, raw_payload: dict) -> WebhookEvent | None:
        event_type = raw_payload.get("event")
        if event_type != "payment.captured":
            return None

        payment = raw_payload.get("payload", {}).get("payment", {}).get("entity", {})
        return WebhookEvent(
            event_type=event_type,
            provider_order_id=payment.get("order_id", ""),
            payment_id=payment.get("id", ""),
            amount_minor=payment.get("amount", 0),
            currency=payment.get("currency", "INR"),
        )
