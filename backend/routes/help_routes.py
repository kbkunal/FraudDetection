"""
Fraud Victim Help Centre Routes.
Public, unauthenticated access for emergency guidance, category action guides,
evidence checklists, and user-prepared incident summaries.
"""

from __future__ import annotations

import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from database import get_db
from models.help import IncidentSummary
from schemas.help_schema import (
    ActionGuideResponse,
    AssistantQueryRequest,
    AssistantQueryResponse,
    EvidenceChecklistResponse,
    FraudCategoryResponse,
    HelpArticleResponse,
    IncidentSummaryCreate,
    OfficialContactResponse,
)
from schemas.shared import APIResponse
from services.help_service import (
    answer_assistant_query,
    get_action_guide,
    get_articles,
    get_categories,
    get_checklist,
    get_official_contacts,
)
from services.report_service import generate_incident_pdf

router = APIRouter()


@router.get("/categories", response_model=APIResponse[list[FraudCategoryResponse]])
def list_categories(db: Session = Depends(get_db)):
    cats = get_categories(db)
    return APIResponse.ok([FraudCategoryResponse.model_validate(c) for c in cats])


@router.get("/guides/{category}", response_model=APIResponse[list[ActionGuideResponse]])
def get_category_guide(category: str, db: Session = Depends(get_db)):
    steps = get_action_guide(db, category)
    return APIResponse.ok([ActionGuideResponse.model_validate(s) for s in steps])


@router.get("/contacts", response_model=APIResponse[list[OfficialContactResponse]])
def list_contacts(db: Session = Depends(get_db)):
    contacts = get_official_contacts(db)
    return APIResponse.ok([OfficialContactResponse.model_validate(c) for c in contacts])


@router.get("/checklists/{category}", response_model=APIResponse[list[EvidenceChecklistResponse]])
def get_category_checklist(category: str, db: Session = Depends(get_db)):
    items = get_checklist(db, category)
    return APIResponse.ok([EvidenceChecklistResponse.model_validate(i) for i in items])


@router.get("/articles", response_model=APIResponse[list[HelpArticleResponse]])
def list_articles(category: str | None = None, db: Session = Depends(get_db)):
    articles = get_articles(db, category)
    return APIResponse.ok([HelpArticleResponse.model_validate(a) for a in articles])


@router.post("/assistant", response_model=APIResponse[AssistantQueryResponse])
def query_assistant(payload: AssistantQueryRequest, db: Session = Depends(get_db)):
    res = answer_assistant_query(db, payload.question, payload.category)
    return APIResponse.ok(res)


@router.post("/incident-summary")
def create_incident_summary_pdf(payload: IncidentSummaryCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    data["id"] = "INC-" + uuid.uuid4().hex[:8].upper()

    # Save summary record if DB is accessible
    try:
        summary_rec = IncidentSummary(
            id=data["id"],
            session_token="public_session",
            category=payload.category,
            incident_date=payload.incident_date,
            loss_amount=payload.loss_amount,
            payment_method=payload.payment_method,
            transaction_ref=payload.transaction_ref,
            narrative=payload.narrative,
            evidence_notes=payload.evidence_notes,
            complaint_refs=payload.complaint_refs,
        )
        db.add(summary_rec)
        db.commit()
    except Exception:
        db.rollback()

    pdf_bytes = generate_incident_pdf(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cybershield-incident-{data['id']}.pdf"},
    )
