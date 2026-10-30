"""
Help Centre SQLAlchemy models.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class FraudCategory(Base):
    __tablename__ = "fraud_categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    articles: Mapped[list["HelpArticle"]] = relationship(
        "HelpArticle", back_populates="category", cascade="all, delete-orphan"
    )
    action_guides: Mapped[list["ActionGuide"]] = relationship(
        "ActionGuide", back_populates="category", cascade="all, delete-orphan"
    )
    evidence_checklists: Mapped[list["EvidenceChecklist"]] = relationship(
        "EvidenceChecklist", back_populates="category", cascade="all, delete-orphan"
    )


class HelpArticle(Base):
    __tablename__ = "help_articles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    category_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("fraud_categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    reviewer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    review_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )

    category: Mapped["FraudCategory"] = relationship("FraudCategory", back_populates="articles")


class ActionGuide(Base):
    __tablename__ = "action_guides"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    category_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("fraud_categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False)

    category: Mapped["FraudCategory"] = relationship(
        "FraudCategory", back_populates="action_guides"
    )


class OfficialContact(Base):
    __tablename__ = "official_contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    verified_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class EvidenceChecklist(Base):
    __tablename__ = "evidence_checklists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    category_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("fraud_categories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    evidence_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    category: Mapped["FraudCategory"] = relationship(
        "FraudCategory", back_populates="evidence_checklists"
    )


class IncidentSummary(Base):
    """Ephemeral incident summary used for PDF generation; no auth required."""

    __tablename__ = "incident_summaries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_token: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    incident_date: Mapped[str | None] = mapped_column(String(30), nullable=True)
    loss_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(100), nullable=True)
    transaction_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    narrative: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    complaint_refs: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
