"""
Shared Pydantic v2 schemas for CyberShield API.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

T = TypeVar("T")


# ---------------------------------------------------------------------------
# Generic API envelope
# ---------------------------------------------------------------------------
class APIResponse(BaseModel, Generic[T]):
    """
    Standard JSON envelope for all CyberShield API responses.

    All endpoints return this structure so clients always know where to look.
    """

    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "success"  # "success" | "error"
    data: T | None = None
    errors: list[str] = Field(default_factory=list)

    @classmethod
    def ok(cls, data: Any, request_id: str | None = None) -> "APIResponse":
        """Create a successful response."""
        return cls(
            request_id=request_id or str(uuid.uuid4()),
            status="success",
            data=data,
            errors=[],
        )

    @classmethod
    def fail(cls, errors: list[str], request_id: str | None = None) -> "APIResponse":
        """Create an error response."""
        return cls(
            request_id=request_id or str(uuid.uuid4()),
            status="error",
            data=None,
            errors=errors,
        )


# ---------------------------------------------------------------------------
# Auth / User schemas
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username must be alphanumeric (underscores and hyphens allowed)")
        return v.lower()


class UserLogin(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    username: str
    role: str
    status: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# ---------------------------------------------------------------------------
# Incident schemas
# ---------------------------------------------------------------------------
class IncidentCreate(BaseModel):
    title: str = Field(min_length=5, max_length=255)
    incident_type: str = Field(min_length=2, max_length=100)
    narrative: str | None = None


class IncidentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=255)
    incident_type: str | None = None
    narrative: str | None = None
    status: str | None = None


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_user_id: str | None
    title: str
    incident_type: str
    narrative: str | None
    status: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# IncidentLink schemas
# ---------------------------------------------------------------------------
class IncidentLinkCreate(BaseModel):
    analysis_run_id: str
    module_type: str
    consent_given: bool = False


class IncidentLinkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: str
    analysis_run_id: str
    module_type: str
    link_created_at: datetime
    consent_given: bool


# ---------------------------------------------------------------------------
# Analysis schemas
# ---------------------------------------------------------------------------
class AnalysisIndicatorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    indicator_code: str
    indicator_type: str
    explanation: str
    evidence_reference: str | None
    severity_label: str
    method: str
    confidence_value: float | None


class AnalysisRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    module_type: str
    status: str
    rule_version: str
    model_version: str | None
    created_at: datetime
    completed_at: datetime | None
    limitations: str | None
    indicators: list[AnalysisIndicatorResponse] = []


# ---------------------------------------------------------------------------
# Report schemas
# ---------------------------------------------------------------------------
class ReportCreate(BaseModel):
    report_type: str
    incident_id: str | None = None
    analysis_run_id: str | None = None


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: str | None
    analysis_run_id: str | None
    report_type: str
    storage_path: str
    created_at: datetime
    expires_at: datetime | None
