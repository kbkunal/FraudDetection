"""
Email Fraud Analysis Routes.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from database import get_db
from models.shared import AnalysisRun, AnalysisIndicator
from schemas.email_schema import EmailManualInput, EmailAnalysisResponse
from schemas.shared import APIResponse
from services.email_service import analyze_email_manual, analyze_eml_bytes
from services.report_service import generate_email_pdf

router = APIRouter()

_EMAIL_STORE: dict[str, dict[str, Any]] = {}


@router.post("/analyze", response_model=APIResponse[EmailAnalysisResponse])
def analyze_email_manual_endpoint(
    payload: EmailManualInput,
    db: Session = Depends(get_db),
):
    analysis_id = str(uuid.uuid4())
    result = analyze_email_manual(
        from_address=payload.from_address,
        reply_to=payload.reply_to,
        subject=payload.subject,
        body=payload.body,
        claimed_org=payload.claimed_org,
        analysis_run_id=analysis_id,
    )

    _EMAIL_STORE[analysis_id] = {
        "result": result.model_dump(),
        "input": payload.model_dump(),
    }

    try:
        run = AnalysisRun(
            id=analysis_id,
            module_type="email",
            input_hash=payload.from_address,
            status="completed",
            rule_version="1.0.0",
            model_version="email_tfidf_logreg_v1",
            created_at=datetime.now(timezone.utc),
            completed_at=datetime.now(timezone.utc),
            limitations="\n".join(result.limitations),
        )
        db.add(run)

        for ind in result.content_indicators:
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


@router.post("/upload-eml", response_model=APIResponse[EmailAnalysisResponse])
async def upload_eml_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".eml"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only standard .eml files are supported.",
        )

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit (10MB).",
        )

    analysis_id = str(uuid.uuid4())
    result = analyze_eml_bytes(content, analysis_run_id=analysis_id)

    _EMAIL_STORE[analysis_id] = {
        "result": result.model_dump(),
        "filename": file.filename,
    }

    return APIResponse.ok(result)


@router.get("/analyses/{analysis_id}", response_model=APIResponse[EmailAnalysisResponse])
def get_email_analysis(analysis_id: str):
    if analysis_id in _EMAIL_STORE:
        return APIResponse.ok(EmailAnalysisResponse(**_EMAIL_STORE[analysis_id]["result"]))
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")


@router.post("/analyses/{analysis_id}/report")
def export_email_report(analysis_id: str):
    if analysis_id not in _EMAIL_STORE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis record not found.")

    data = _EMAIL_STORE[analysis_id]
    pdf_bytes = generate_email_pdf(analysis_id=analysis_id, data=data["result"])
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cybershield-email-{analysis_id[:8]}.pdf"},
    )
