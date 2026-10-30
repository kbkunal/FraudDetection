"""
Pydantic v2 schemas for UPI Transaction Fraud Detection.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class TransactionInput(BaseModel):
    """A single UPI transaction submitted for analysis."""

    transaction_ref: str | None = Field(default=None, description="UPI transaction reference ID")
    amount: float = Field(gt=0, description="Transaction amount in INR")
    timestamp: datetime | None = Field(
        default=None, description="Transaction timestamp (ISO 8601)"
    )
    status: str | None = Field(
        default=None, description="Transaction status e.g. SUCCESS, FAILED, PENDING"
    )
    direction: str | None = Field(
        default=None, description="DEBIT or CREDIT from the account holder's perspective"
    )
    sender_upi: str | None = Field(default=None, description="Sender UPI ID e.g. user@upi")
    recipient_upi: str | None = Field(default=None, description="Recipient UPI ID")
    bank_name: str | None = Field(default=None, description="Bank or payment app name")
    notes: str | None = Field(default=None, max_length=500, description="Transaction remarks")

    @field_validator("amount")
    @classmethod
    def amount_precision(cls, v: float) -> float:
        return round(v, 2)


class TransactionCSVUpload(BaseModel):
    """Metadata returned when a CSV is uploaded."""

    filename: str
    rows_parsed: int
    rows_skipped: int
    parse_warnings: list[str] = []


class UPIAnalysisRequest(BaseModel):
    """Request body for a direct transaction analysis."""

    transactions: list[TransactionInput] = Field(
        min_length=1, max_length=1000, description="List of transactions to analyse"
    )
    incident_id: str | None = Field(
        default=None, description="Optionally link result to an existing incident"
    )


class UPIIndicator(BaseModel):
    code: str
    type: str
    explanation: str
    evidence_reference: str | None = None
    severity: str
    method: str
    confidence: float | None = None


class UPIGraphNode(BaseModel):
    id: str
    label: str
    type: str  # "sender" | "recipient" | "both"
    transaction_count: int


class UPIGraphEdge(BaseModel):
    source: str
    target: str
    amount: float
    timestamp: str | None = None
    reference: str | None = None


class UPIAnalysisResponse(BaseModel):
    analysis_run_id: str
    status: str
    indicators: list[UPIIndicator] = []
    transactions: list[dict[str, Any]] = []
    graph_data: dict[str, Any] | None = None
    limitations: list[str] = []


class UPIGraphResponse(BaseModel):
    nodes: list[UPIGraphNode] = []
    edges: list[UPIGraphEdge] = []
