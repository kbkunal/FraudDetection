"""
Incident Workspace & Cross-Module Linking Routes.
Enforces user ownership on every incident and consent before linking analyses.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models.shared import Incident, IncidentLink, User
from schemas.shared import (
    APIResponse,
    IncidentCreate,
    IncidentLinkCreate,
    IncidentLinkResponse,
    IncidentResponse,
    IncidentUpdate,
)
from services.auth_service import get_current_user

router = APIRouter()


@router.post("", response_model=APIResponse[IncidentResponse])
def create_incident(
    payload: IncidentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inc = Incident(
        id=str(uuid.uuid4()),
        owner_user_id=current_user.id,
        title=payload.title,
        incident_type=payload.incident_type,
        narrative=payload.narrative,
        status="open",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return APIResponse.ok(IncidentResponse.model_validate(inc))


@router.get("", response_model=APIResponse[list[IncidentResponse]])
def list_incidents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    incidents = db.scalars(
        select(Incident)
        .where(Incident.owner_user_id == current_user.id)
        .order_by(Incident.updated_at.desc())
    ).all()
    return APIResponse.ok([IncidentResponse.model_validate(i) for i in incidents])


@router.get("/{incident_id}", response_model=APIResponse[IncidentResponse])
def get_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inc = db.scalar(
        select(Incident).where(
            Incident.id == incident_id, Incident.owner_user_id == current_user.id
        )
    )
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")
    return APIResponse.ok(IncidentResponse.model_validate(inc))


@router.put("/{incident_id}", response_model=APIResponse[IncidentResponse])
def update_incident(
    incident_id: str,
    payload: IncidentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inc = db.scalar(
        select(Incident).where(
            Incident.id == incident_id, Incident.owner_user_id == current_user.id
        )
    )
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    if payload.title is not None:
        inc.title = payload.title
    if payload.incident_type is not None:
        inc.incident_type = payload.incident_type
    if payload.narrative is not None:
        inc.narrative = payload.narrative
    if payload.status is not None:
        inc.status = payload.status

    inc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(inc)
    return APIResponse.ok(IncidentResponse.model_validate(inc))


@router.delete("/{incident_id}", response_model=APIResponse[dict])
def delete_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inc = db.scalar(
        select(Incident).where(
            Incident.id == incident_id, Incident.owner_user_id == current_user.id
        )
    )
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    db.delete(inc)
    db.commit()
    return APIResponse.ok({"message": "Incident deleted successfully."})


@router.post("/{incident_id}/links", response_model=APIResponse[IncidentLinkResponse])
def link_analysis_to_incident(
    incident_id: str,
    payload: IncidentLinkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inc = db.scalar(
        select(Incident).where(
            Incident.id == incident_id, Incident.owner_user_id == current_user.id
        )
    )
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    if not payload.consent_given:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit consent is required to link an analysis run to an incident workspace.",
        )

    link = IncidentLink(
        id=str(uuid.uuid4()),
        incident_id=inc.id,
        analysis_run_id=payload.analysis_run_id,
        module_type=payload.module_type,
        link_created_at=datetime.now(timezone.utc),
        consent_given=True,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return APIResponse.ok(IncidentLinkResponse.model_validate(link))


@router.get("/{incident_id}/links", response_model=APIResponse[list[IncidentLinkResponse]])
def get_incident_links(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inc = db.scalar(
        select(Incident).where(
            Incident.id == incident_id, Incident.owner_user_id == current_user.id
        )
    )
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    links = db.scalars(
        select(IncidentLink).where(IncidentLink.incident_id == inc.id)
    ).all()
    return APIResponse.ok([IncidentLinkResponse.model_validate(l) for l in links])
