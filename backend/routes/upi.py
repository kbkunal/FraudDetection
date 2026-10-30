"""
UPI Transaction Fraud Analysis Routes.
"""

from __future__ import annotations

import csv
import io
import uuid
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from database import get_db
from models.shared import AnalysisRun, AnalysisIndicator
from schemas.shared import APIResponse
from schemas.upi import (
    TransactionInput,
    UPIAnalysisRequest,
    UPIAnalysisResponse,
    UPIGraphResponse,
    UPIIndicator,
)
from services.upi_service import analyze_transactions, get_graph_data
from services.report_service import generate_upi_pdf

router = APIRouter()

# In-memory store for quick anonymous sessions (falls back to DB if persisted)
_STORE: dict[str, dict[str, Any]] = {}


@router.post("/analyze", response_model=APIResponse[UPIAnalysisResponse])
def analyze_upi_manual(
    payload: UPIAnalysisRequest,
    db: Session = Depends(get_db),
):
    analysis_id = str(uuid.uuid4())
    tx_dicts = [t.model_dump() for t in payload.transactions]
    
    raw_res = analyze_transactions(tx_dicts, analysis_run_id=analysis_id)
    indicators = [
        UPIIndicator(
            code=ind["code"],
            type=ind["type"],
            explanation=ind["explanation"],
            evidence_reference=ind.get("evidence_reference"),
            severity=ind.get("severity", "medium"),
            method=ind.get("method", "rule"),
            confidence=ind.get("confidence"),
        )
        for ind in raw_res.get("indicators", [])
    ]
    result = UPIAnalysisResponse(
        analysis_run_id=analysis_id,
        status="completed",
        indicators=indicators,
        transactions=tx_dicts,
        graph_data=raw_res.get("graph_data"),
        limitations=raw_res.get("limitations", []),
    )
    _STORE[analysis_id] = {
        "result": result.model_dump(),
        "transactions": tx_dicts,
    }

    # Persist analysis run record in DB
    try:
        run = AnalysisRun(
            id=analysis_id,
            module_type="upi",
            input_hash="manual_entry",
            status="completed",
            rule_version="1.0.0",
            model_version="isolation_forest_v1",
            created_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            limitations="\n".join(result.limitations),
        )
        db.add(run)

        for ind in result.indicators:
            ai = AnalysisIndicator(
                id=str(uuid.uuid4()),
                analysis_run_id=analysis_id,
                indicator_code=ind.code,
                indicator_type=ind.type,
                explanation=ind.explanation,
                evidence_reference=ind.evidence_reference,
                severity_label=ind.severity,
                method=ind.method,
                confidence_value=ind.confidence,
            )
            db.add(ai)
        db.commit()
    except Exception:
        db.rollback()

    return APIResponse.ok(result)


@router.post("/upload", response_model=APIResponse[UPIAnalysisResponse])
async def upload_upi_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only .csv files are supported.",
        )

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit (5MB).",
        )

    try:
        text = content.decode("utf-8-sig", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read CSV structure: {str(e)}",
        )

    transactions: list[dict[str, Any]] = []
    for i, row in enumerate(reader):
        if i >= 1000:
            break
        # Map common CSV column variations
        amount_raw = row.get("amount") or row.get("Amount") or row.get("txn_amount") or "0"
        try:
            amt = float(str(amount_raw).replace(",", "").strip())
        except ValueError:
            continue

        ref = row.get("transaction_ref") or row.get("UTR") or row.get("Reference") or row.get("reference")
        sender = row.get("sender_upi") or row.get("sender") or row.get("from_upi") or row.get("Sender")
        recip = row.get("recipient_upi") or row.get("recipient") or row.get("to_upi") or row.get("Recipient")
        status_val = row.get("status") or row.get("Status") or "SUCCESS"
        direction_val = row.get("direction") or row.get("Direction") or "outgoing"

        transactions.append({
            "transaction_ref": ref,
            "amount": amt,
            "timestamp": row.get("timestamp") or row.get("date") or datetime.now(timezone.utc).isoformat(),
            "status": status_val,
            "direction": direction_val,
            "sender_upi": sender,
            "recipient_upi": recip,
            "bank_name": row.get("bank_name") or row.get("bank"),
            "notes": row.get("notes") or row.get("scenario_label"),
        })

    if not transactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid transaction rows found in uploaded CSV. Please check the column headers.",
        )

    analysis_id = str(uuid.uuid4())
    raw_res = analyze_transactions(transactions, analysis_run_id=analysis_id)
    indicators = [
        UPIIndicator(
            code=ind["code"],
            type=ind["type"],
            explanation=ind["explanation"],
            evidence_reference=ind.get("evidence_reference"),
            severity=ind.get("severity", "medium"),
            method=ind.get("method", "rule"),
            confidence=ind.get("confidence"),
        )
        for ind in raw_res.get("indicators", [])
    ]
    result = UPIAnalysisResponse(
        analysis_run_id=analysis_id,
        status="completed",
        indicators=indicators,
        transactions=transactions,
        graph_data=raw_res.get("graph_data"),
        limitations=raw_res.get("limitations", []),
    )
    _STORE[analysis_id] = {
        "result": result.model_dump(),
        "transactions": transactions,
    }

    return APIResponse.ok(result)


@router.get("/analyses/{analysis_id}", response_model=APIResponse[UPIAnalysisResponse])
def get_analysis(analysis_id: str):
    if analysis_id in _STORE:
        return APIResponse.ok(UPIAnalysisResponse(**_STORE[analysis_id]["result"]))
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")


@router.get("/analyses/{analysis_id}/graph", response_model=APIResponse[dict])
def get_graph(analysis_id: str):
    if analysis_id in _STORE:
        txs = _STORE[analysis_id].get("transactions", [])
        return APIResponse.ok(get_graph_data(txs))
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")


@router.post("/analyses/{analysis_id}/report")
def export_upi_report(analysis_id: str):
    if analysis_id not in _STORE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")
    
    data = _STORE[analysis_id]
    pdf_bytes = generate_upi_pdf(
        analysis_id=analysis_id,
        indicators=data["result"].get("indicators", []),
        transactions=data.get("transactions", []),
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cybershield-upi-{analysis_id[:8]}.pdf"},
    )
