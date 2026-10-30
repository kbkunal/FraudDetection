"""
Message / SMS fraud SQLAlchemy models.
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


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_app: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sender_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    language: Mapped[str | None] = mapped_column(String(20), nullable=True, default="en")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    entities: Mapped[list["MessageEntity"]] = relationship(
        "MessageEntity", back_populates="message", cascade="all, delete-orphan"
    )
    urls: Mapped[list["MessageURL"]] = relationship(
        "MessageURL", back_populates="message", cascade="all, delete-orphan"
    )
    analysis: Mapped["MessageAnalysis | None"] = relationship(
        "MessageAnalysis", back_populates="message", uselist=False, cascade="all, delete-orphan"
    )


class MessageEntity(Base):
    __tablename__ = "message_entities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[str] = mapped_column(String(500), nullable=False)
    start_pos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end_pos: Mapped[int | None] = mapped_column(Integer, nullable=True)

    message: Mapped["Message"] = relationship("Message", back_populates="entities")


class MessageURL(Base):
    __tablename__ = "message_urls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    defanged_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reputation_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reputation_source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    message: Mapped["Message"] = relationship("Message", back_populates="urls")


class MessageAnalysis(Base):
    __tablename__ = "message_analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    message_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    analysis_run_id: Mapped[str] = mapped_column(String(36), nullable=False)
    category_labels: Mapped[list | None] = mapped_column(JSON, nullable=True)
    overall_assessment: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    message: Mapped["Message"] = relationship("Message", back_populates="analysis")
