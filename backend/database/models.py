"""
Database Models for Resume Chef
All app tables live in the public schema; user_id columns FK to auth.users(id)
(same Postgres instance as Supabase Auth — no mirror table needed).
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


# ---------------------------------------------------------------------------
# Resumes
# ---------------------------------------------------------------------------


class Resume(Base):
    """
    Stores user resume content.
    builder_type determines which column holds the canonical data:
      - latex / html  → content_code (plain text)
      - wysiwyg       → content_elements (JSON tree)
    """

    __tablename__ = "resumes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False, default="Untitled Resume")
    file_name = Column(String(255), nullable=True)
    builder_type = Column(
        Enum("latex", "html", "wysiwyg", name="builder_type_enum"),
        nullable=False,
        default="latex",
    )
    content_code = Column(Text, nullable=True)           # latex / html source
    content_elements = Column(JSON, nullable=True)       # wysiwyg JSON tree
    template_id = Column(String(100), nullable=True)
    job_description = Column(Text, nullable=True)
    is_archived = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_resumes_user_id_updated_at", "user_id", "updated_at"),
    )


# ---------------------------------------------------------------------------
# Subscriptions
# ---------------------------------------------------------------------------


class Subscription(Base):
    """
    One row per user — tracks their current plan.
    plan='free' is the default; upserted by the billing webhook on purchase.
    """

    __tablename__ = "subscriptions"

    user_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    plan = Column(
        Enum("free", "monthly", "annual", name="subscription_plan_enum"),
        nullable=False,
        default="free",
    )
    status = Column(String(50), nullable=False, default="active")  # active | past_due | canceled
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    provider = Column(String(50), nullable=True)                   # razorpay | stripe
    provider_subscription_id = Column(String(255), nullable=True)
    country_code = Column(String(10), nullable=True)


# ---------------------------------------------------------------------------
# Pricing Tiers
# ---------------------------------------------------------------------------


class PricingTier(Base):
    """Per-country pricing; amounts stored in minor units (paise / cents)."""

    __tablename__ = "pricing_tiers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    country_code = Column(String(10), nullable=False, unique=True)
    currency = Column(String(10), nullable=False)
    monthly_price_minor = Column(Integer, nullable=False)   # e.g. 9500 paise = ₹95
    annual_price_minor = Column(Integer, nullable=False)    # e.g. 95000 paise = ₹950
    monthly_credits = Column(Integer, nullable=False)       # credits granted per cycle


# ---------------------------------------------------------------------------
# Wallets
# ---------------------------------------------------------------------------


class Wallet(Base):
    """
    Cached credit balance per user.
    Source of truth is the append-only credit_transactions ledger;
    this is a materialized cache updated atomically with each transaction insert.
    """

    __tablename__ = "wallets"

    user_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    balance = Column(Integer, nullable=False, default=0)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ---------------------------------------------------------------------------
# Credit Transactions  (append-only ledger)
# ---------------------------------------------------------------------------


class CreditTransaction(Base):
    """
    Immutable credit ledger.  Never UPDATE or DELETE rows — only INSERT.
    metadata JSON must always include AI usage for cost tracking:
      {"model": "...", "agent": "chat_agent"|"ats_agent",
       "prompt_tokens": N, "completion_tokens": N, "total_tokens": N}
    """

    __tablename__ = "credit_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
    )
    delta = Column(Integer, nullable=False)           # negative = debit, positive = credit
    balance_after = Column(Integer, nullable=False)
    action_type = Column(
        Enum(
            "subscription_grant",
            "topup",
            "chat_message",
            "ats_check",
            "mcp_call",
            "referral_bonus",
            name="credit_action_type_enum",
        ),
        nullable=False,
    )
    reference_id = Column(String(255), nullable=True)   # e.g. payment_order_id
    tx_metadata = Column("metadata", JSON, nullable=True)  # 'metadata' is reserved by SQLAlchemy Declarative
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("ix_credit_transactions_user_id_created_at", "user_id", "created_at"),
    )


# ---------------------------------------------------------------------------
# Free Tier Usage   (only needed for non-Pro users)
# ---------------------------------------------------------------------------


class FreeTierUsage(Base):
    """
    Daily usage counters for free-tier users.
    period_key = date.today().isoformat() (UTC) — a new row for each day = automatic daily reset.
    """

    __tablename__ = "free_tier_usage"

    user_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
    )
    period_key = Column(String(20), primary_key=True)   # e.g. "2026-07-16"
    chat_messages_used = Column(Integer, nullable=False, default=0)
    ats_checks_used = Column(Integer, nullable=False, default=0)


# ---------------------------------------------------------------------------
# Payment Orders
# ---------------------------------------------------------------------------


class PaymentOrder(Base):
    """
    One row per Razorpay / Stripe order — makes the webhook handler idempotent.
    Webhook checks status == 'created' before processing.
    """

    __tablename__ = "payment_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
    )
    provider = Column(String(50), nullable=False)               # razorpay | stripe
    provider_order_id = Column(String(255), nullable=False, unique=True)
    amount_minor = Column(Integer, nullable=False)
    currency = Column(String(10), nullable=False)
    credits_granted = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="created")  # created | paid | failed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


# ---------------------------------------------------------------------------
# MCP Tokens   (for future Pro external-client access)
# ---------------------------------------------------------------------------


class McpToken(Base):
    """
    Long-lived tokens for external MCP clients (Claude Desktop, Cursor, etc.).
    Supabase JWTs are impractical for third-party tooling — this table holds
    hashed tokens that the /mcp route validates.
    """

    __tablename__ = "mcp_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )
    token_hash = Column(String(255), nullable=False, unique=True)
    name = Column(String(255), nullable=True)                      # user-visible label
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
