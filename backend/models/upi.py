"""
UPI Transaction SQLAlchemy models.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    analysis_run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analysis_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    transaction_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    direction: Mapped[str | None] = mapped_column(String(20), nullable=True)
    sender_upi: Mapped[str | None] = mapped_column(String(100), nullable=True)
    recipient_upi: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class TransactionParticipant(Base):
    __tablename__ = "transaction_participants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    upi_id_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    first_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    last_seen: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    transaction_count: Mapped[int] = mapped_column(Integer, default=0)


class TransactionRelationship(Base):
    __tablename__ = "transaction_relationships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    source_participant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("transaction_participants.id"), nullable=False
    )
    target_participant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("transaction_participants.id"), nullable=False
    )
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False)
    evidence_refs: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class UPIAlert(Base):
    __tablename__ = "upi_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    analysis_run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analysis_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    alert_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    fired_rule: Mapped[str] = mapped_column(String(100), nullable=False)
    observed_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    threshold_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
