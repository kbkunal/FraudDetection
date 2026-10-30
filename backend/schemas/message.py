"""
Pydantic v2 schemas for Message / SMS Fraud Detection.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class MessageInput(BaseModel):
    """A single SMS/message submitted for analysis."""

    text: str = Field(min_length=1, max_length=10000, description="Raw message text")
    source_app: str | None = Field(
        default=None, description="App the message was received on (e.g. WhatsApp, SMS)"
    )
    sender_id: str | None = Field(
        default=None, description="Sender identifier (phone, handle, or masked ID)"
    )
    language: str | None = Field(
        default="en", description="BCP-47 language tag e.g. en, hi, mr"
    )
    context: str | None = Field(
        default=None,
        max_length=500,
        description="Optional context the user wants to provide about this message",
    )


class MessageEntityResult(BaseModel):
    entity_type: str
    value: str
    start_pos: int | None = None
    end_pos: int | None = None


class MessageURLResult(BaseModel):
    url: str
    defanged_url: str
    domain: str | None = None
    reputation_status: str = "unknown"


class MessageIndicator(BaseModel):
    code: str
    type: str
    explanation: str
    evidence_reference: str | None = None
    severity: str
    method: str
    confidence: float | None = None


class MessageAnalysisResponse(BaseModel):
    analysis_run_id: str
    status: str
    categories: list[str] = []
    indicators: list[MessageIndicator] = []
    urls: list[MessageURLResult] = []
    entities: list[MessageEntityResult] = []
    overall_assessment: str  # "high_risk" | "medium_risk" | "low_risk" | "likely_legitimate"
    limitations: list[str] = []
