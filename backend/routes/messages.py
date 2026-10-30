"""
Message Fraud Analysis Routes.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from database import get_db
from models.shared import AnalysisRun, AnalysisIndicator
from schemas.message import MessageInput, MessageAnalysisResponse
from schemas.shared import APIResponse
from services.message_service import analyze_message
from services.report_service import generate_message_pdf

router = APIRouter()

_MSG_STORE: dict[str, dict[str, Any]] = {}


@router.post("/analyze", response_model=APIResponse[MessageAnalysisResponse])
def analyze_message_endpoint(
    payload: MessageInput,
    db: Session = Depends(get_db),
):
    analysis_id = str(uuid.uuid4())
    result = analyze_message(
        text=payload.text,
        source_app=payload.source_app,
        sender_id=payload.sender_id,
        language=payload.language,
        context=payload.context,
        analysis_run_id=analysis_id,
    )

    _MSG_STORE[analysis_id] = {
        "result": result.model_dump(),
        "input": payload.model_dump(),
    }

    try:
        run = AnalysisRun(
            id=analysis_id,
            module_type="message",
            input_hash=payload.sender_id or "pasted_text",
            status="completed",
            rule_version="1.0.0",
            model_version="tfidf_logreg_v1",
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


@router.get("/analyses/{analysis_id}", response_model=APIResponse[MessageAnalysisResponse])
def get_message_analysis(analysis_id: str):
    if analysis_id in _MSG_STORE:
        return APIResponse.ok(MessageAnalysisResponse(**_MSG_STORE[analysis_id]["result"]))
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")


@router.post("/analyses/{analysis_id}/report")
def export_message_report(analysis_id: str):
    if analysis_id not in _MSG_STORE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")

    data = _MSG_STORE[analysis_id]
    pdf_bytes = generate_message_pdf(analysis_id=analysis_id, data=data["result"])
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cybershield-message-{analysis_id[:8]}.pdf"},
    )
