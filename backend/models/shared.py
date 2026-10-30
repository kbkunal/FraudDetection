"""
Shared / cross-cutting SQLAlchemy models for CyberShield.
Covers Users, Incidents, Analysis Runs, Reports, Audit Logs, etc.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------
class UserRole(str, PyEnum):
    public = "public"
    registered = "registered"
    analyst = "analyst"
    admin = "admin"


class UserStatus(str, PyEnum):
    active = "active"
    suspended = "suspended"
    deleted = "deleted"


class IncidentStatus(str, PyEnum):
    draft = "draft"
    open = "open"
    in_progress = "in_progress"
    submitted = "submitted"
    under_review = "under_review"
    resolved = "resolved"
    closed = "closed"


class AnalysisStatus(str, PyEnum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        Enum(UserRole), nullable=False, default=UserRole.registered
    )
    status: Mapped[str] = mapped_column(
        Enum(UserStatus), nullable=False, default=UserStatus.active
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    incidents: Mapped[list["Incident"]] = relationship(
        "Incident", back_populates="owner", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship("AuditLog", back_populates="actor")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User id={self.id} email={self.email} role={self.role}>"


# ---------------------------------------------------------------------------
# Incident
# ---------------------------------------------------------------------------
class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    owner_user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    incident_type: Mapped[str] = mapped_column(String(100), nullable=False)
    narrative: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(IncidentStatus), nullable=False, default=IncidentStatus.draft
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now
    )
    retention_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    owner: Mapped["User | None"] = relationship("User", back_populates="incidents")
    links: Mapped[list["IncidentLink"]] = relationship(
        "IncidentLink", back_populates="incident", cascade="all, delete-orphan"
    )
    evidence_items: Mapped[list["EvidenceItem"]] = relationship(
        "EvidenceItem", back_populates="incident", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report", back_populates="incident", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Incident id={self.id} title={self.title}>"


# ---------------------------------------------------------------------------
# IncidentLink
# ---------------------------------------------------------------------------
class IncidentLink(Base):
    __tablename__ = "incident_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    incident_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    analysis_run_id: Mapped[str] = mapped_column(String(36), nullable=False)
    module_type: Mapped[str] = mapped_column(String(50), nullable=False)
    link_created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    consent_given: Mapped[bool] = mapped_column(Boolean, default=False)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="links")


# ---------------------------------------------------------------------------
# EvidenceItem
# ---------------------------------------------------------------------------
class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    incident_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    evidence_type: Mapped[str] = mapped_column(String(100), nullable=False)
    storage_reference: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    source_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    incident: Mapped["Incident"] = relationship("Incident", back_populates="evidence_items")


# ---------------------------------------------------------------------------
# AnalysisRun
# ---------------------------------------------------------------------------
class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    module_type: Mapped[str] = mapped_column(String(50), nullable=False)
    input_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum(AnalysisStatus), nullable=False, default=AnalysisStatus.pending
    )
    rule_version: Mapped[str] = mapped_column(String(20), default="1.0.0")
    model_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    limitations: Mapped[str | None] = mapped_column(Text, nullable=True)

    indicators: Mapped[list["AnalysisIndicator"]] = relationship(
        "AnalysisIndicator", back_populates="analysis_run", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report", back_populates="analysis_run", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# AnalysisIndicator
# ---------------------------------------------------------------------------
class AnalysisIndicator(Base):
    __tablename__ = "analysis_indicators"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    analysis_run_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("analysis_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    indicator_code: Mapped[str] = mapped_column(String(100), nullable=False)
    indicator_type: Mapped[str] = mapped_column(String(50), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    severity_label: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    method: Mapped[str] = mapped_column(String(100), nullable=False, default="rule_based")
    confidence_value: Mapped[float | None] = mapped_column(Float, nullable=True)

    analysis_run: Mapped["AnalysisRun"] = relationship(
        "AnalysisRun", back_populates="indicators"
    )


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    incident_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True
    )
    analysis_run_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("analysis_runs.id", ondelete="SET NULL"),
        nullable=True,
    )
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    incident: Mapped["Incident | None"] = relationship("Incident", back_populates="reports")
    analysis_run: Mapped["AnalysisRun | None"] = relationship(
        "AnalysisRun", back_populates="reports"
    )


# ---------------------------------------------------------------------------
# ConsentRecord
# ---------------------------------------------------------------------------
class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_token: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    purpose: Mapped[str] = mapped_column(String(100), nullable=False)
    scope: Mapped[str] = mapped_column(Text, nullable=False)
    consent_text_version: Mapped[str] = mapped_column(String(20), nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ---------------------------------------------------------------------------
# AuditLog
# ---------------------------------------------------------------------------
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    actor_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    target_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    actor: Mapped["User | None"] = relationship("User", back_populates="audit_logs")
