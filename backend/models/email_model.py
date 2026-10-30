"""
Email fraud SQLAlchemy models.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class Email(Base):
    __tablename__ = "emails"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    analysis_run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analysis_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    reply_to: Mapped[str | None] = mapped_column(String(500), nullable=True)
    subject: Mapped[str | None] = mapped_column(Text, nullable=True)
    body_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    claimed_org: Mapped[str | None] = mapped_column(String(255), nullable=True)
    input_mode: Mapped[str] = mapped_column(String(20), default="manual")  # manual | eml
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    headers: Mapped[list["EmailHeader"]] = relationship(
        "EmailHeader", back_populates="email", cascade="all, delete-orphan"
    )
    urls: Mapped[list["EmailURL"]] = relationship(
        "EmailURL", back_populates="email", cascade="all, delete-orphan"
    )
    attachments: Mapped[list["EmailAttachment"]] = relationship(
        "EmailAttachment", back_populates="email", cascade="all, delete-orphan"
    )
    analysis: Mapped["EmailAnalysis | None"] = relationship(
        "EmailAnalysis", back_populates="email", uselist=False, cascade="all, delete-orphan"
    )


class EmailHeader(Base):
    __tablename__ = "email_headers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False, index=True
    )
    header_name: Mapped[str] = mapped_column(String(100), nullable=False)
    header_value: Mapped[str] = mapped_column(Text, nullable=False)

    email: Mapped["Email"] = relationship("Email", back_populates="headers")


class EmailURL(Base):
    __tablename__ = "email_urls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    defanged_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reputation_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reputation_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    email: Mapped["Email"] = relationship("Email", back_populates="urls")


class EmailAttachment(Base):
    __tablename__ = "email_attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sha256_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reputation_status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    email: Mapped["Email"] = relationship("Email", back_populates="attachments")


class EmailAnalysis(Base):
    __tablename__ = "email_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("emails.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    spf_result: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dkim_result: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dmarc_result: Mapped[str | None] = mapped_column(String(50), nullable=True)
    auth_provenance: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain_match_result: Mapped[str | None] = mapped_column(String(50), nullable=True)
    category_labels: Mapped[list | None] = mapped_column(JSON, nullable=True)
    overall_assessment: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    email: Mapped["Email"] = relationship("Email", back_populates="analysis")
