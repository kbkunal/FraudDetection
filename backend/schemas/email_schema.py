"""
Pydantic v2 schemas for Email Fraud Detection.
"""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class EmailManualInput(BaseModel):
    """Manual form input for email analysis (no EML file)."""

    from_address: str = Field(max_length=500, description="Sender email address or display name")
    reply_to: str | None = Field(default=None, max_length=500)
    subject: str = Field(max_length=1000)
    body: str = Field(min_length=1, max_length=50000, description="Plain text email body")
    claimed_org: str | None = Field(
        default=None, max_length=255, description="Organisation the email claims to be from"
    )


class EmailSenderAnalysis(BaseModel):
    from_address: str | None = None
    reply_to: str | None = None
    domain_match: str = "unknown"
    reply_to_mismatch: bool = False
    suspicious_subdomain: bool = False
    lookalike_domain_detected: bool = False
    lookalike_similarity: float | None = None
    notes: list[str] = []


class EmailAuthResult(BaseModel):
    spf: str = "not_available"
    dkim: str = "not_available"
    dmarc: str = "not_available"
    provenance_note: str = (
        "Authentication results are extracted from email headers "
        "and have NOT been independently verified by CyberShield."
    )


class EmailURLResult(BaseModel):
    url: str
    defanged_url: str
    domain: str | None = None
    reputation_status: str = "unknown"


class EmailAttachmentResult(BaseModel):
    filename: str | None = None
    mime_type: str | None = None
    file_size: int | None = None
    sha256_hash: str | None = None
    reputation_status: str = "unknown"
    risk_notes: list[str] = []


class EmailIndicator(BaseModel):
    code: str
    type: str
    explanation: str
    evidence_reference: str | None = None
    severity: str
    method: str
    confidence: float | None = None


class EmailAnalysisResponse(BaseModel):
    analysis_run_id: str
    status: str
    sender_analysis: EmailSenderAnalysis = EmailSenderAnalysis()
    auth_results: EmailAuthResult = EmailAuthResult()
    content_indicators: list[EmailIndicator] = []
    urls: list[EmailURLResult] = []
    attachments: list[EmailAttachmentResult] = []
    categories: list[str] = []
    overall_assessment: str  # "high_risk" | "medium_risk" | "low_risk" | "likely_legitimate"
    limitations: list[str] = []
