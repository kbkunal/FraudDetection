"""
Pydantic v2 schemas for the Fraud Victim Help Centre.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class FraudCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    description: str | None
    icon: str | None
    sort_order: int


class ActionGuideResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    step_order: int
    title: str
    description: str
    action_type: str
    is_critical: bool


class OfficialContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: str
    phone: str | None
    url: str | None
    description: str | None
    verified_by: str | None
    verified_at: datetime | None


class EvidenceChecklistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    evidence_type: str
    description: str
    instructions: str | None
    is_required: bool
    sort_order: int


class HelpArticleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    category_id: str
    title: str
    content: str
    source_url: str | None
    is_published: bool
    created_at: datetime
    updated_at: datetime


class IncidentSummaryCreate(BaseModel):
    """Payload for creating an incident summary for PDF export."""

    category: str = Field(min_length=1, max_length=100)
    incident_date: str | None = Field(
        default=None, description="Date of the incident (YYYY-MM-DD or free text)"
    )
    loss_amount: float | None = Field(default=None, ge=0, description="Estimated financial loss in INR")
    payment_method: str | None = Field(default=None, max_length=100)
    transaction_ref: str | None = Field(default=None, max_length=255)
    narrative: str = Field(
        min_length=10, max_length=10000, description="Describe what happened in your own words"
    )
    evidence_notes: str | None = Field(default=None, max_length=5000)
    complaint_refs: str | None = Field(
        default=None, max_length=1000, description="Any existing complaint reference numbers"
    )


class AssistantQueryRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    session_token: str | None = None
    category: str | None = None


class AssistantQueryResponse(BaseModel):
    answer: str
    sources: list[str] = []
    emergency_guidance: bool = False
    disclaimer: str = (
        "This is retrieved guidance from publicly available information. "
        "CyberShield does not provide legal advice. "
        "For official assistance, contact the National Cyber Crime Helpline at 1930."
    )
