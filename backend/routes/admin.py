"""
Administration Routes.
Requires 'admin' role. Manages official verified contacts, articles, and audit logs.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models.help import ActionGuide, FraudCategory, HelpArticle, OfficialContact
from models.shared import AuditLog, User
from schemas.help_schema import FraudCategoryResponse, HelpArticleResponse, OfficialContactResponse
from schemas.shared import APIResponse, UserResponse
from services.auth_service import get_current_admin

router = APIRouter()


class ArticleCreateUpdate(BaseModel):
    category_id: str
    title: str
    content: str
    source_url: str | None = None
    reviewer: str | None = None
    is_published: bool = True


class ContactCreateUpdate(BaseModel):
    name: str
    type: str
    phone: str | None = None
    url: str | None = None
    description: str | None = None
    source_url: str | None = None
    verified_by: str | None = None
    is_active: bool = True


@router.get("/overview", response_model=APIResponse[dict])
def admin_overview(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    categories_count = db.scalar(select(FraudCategory).count()) if hasattr(select(FraudCategory), "count") else len(db.scalars(select(FraudCategory)).all())
    articles_count = len(db.scalars(select(HelpArticle)).all())
    contacts_count = len(db.scalars(select(OfficialContact)).all())
    users_count = len(db.scalars(select(User)).all())

    return APIResponse.ok({
        "categories_count": categories_count,
        "articles_count": articles_count,
        "contacts_count": contacts_count,
        "users_count": users_count,
        "system_status": "operational",
        "last_policy_verification": datetime.now(timezone.utc).isoformat(),
    })


@router.get("/users", response_model=APIResponse[list[UserResponse]])
def list_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return APIResponse.ok([UserResponse.model_validate(u) for u in users])


@router.post("/articles", response_model=APIResponse[HelpArticleResponse])
def create_article(
    payload: ArticleCreateUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    art = HelpArticle(
        id=str(uuid.uuid4()),
        category_id=payload.category_id,
        title=payload.title,
        content=payload.content,
        source_url=payload.source_url,
        reviewer=payload.reviewer or admin.username,
        review_date=datetime.now(timezone.utc),
        is_published=payload.is_published,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(art)

    # Audit log
    audit = AuditLog(
        id=str(uuid.uuid4()),
        actor_id=admin.id,
        action="create_article",
        target_type="help_article",
        target_id=art.id,
        timestamp=datetime.now(timezone.utc),
        metadata_={"title": art.title},
    )
    db.add(audit)
    db.commit()
    db.refresh(art)

    return APIResponse.ok(HelpArticleResponse.model_validate(art))


@router.put("/articles/{article_id}", response_model=APIResponse[HelpArticleResponse])
def update_article(
    article_id: str,
    payload: ArticleCreateUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    art = db.scalar(select(HelpArticle).where(HelpArticle.id == article_id))
    if not art:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")

    art.category_id = payload.category_id
    art.title = payload.title
    art.content = payload.content
    art.source_url = payload.source_url
    art.reviewer = payload.reviewer or admin.username
    art.review_date = datetime.now(timezone.utc)
    art.is_published = payload.is_published
    art.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(art)
    return APIResponse.ok(HelpArticleResponse.model_validate(art))


@router.delete("/articles/{article_id}", response_model=APIResponse[dict])
def delete_article(
    article_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    art = db.scalar(select(HelpArticle).where(HelpArticle.id == article_id))
    if not art:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")
    db.delete(art)
    db.commit()
    return APIResponse.ok({"message": "Article deleted."})


@router.post("/contacts", response_model=APIResponse[OfficialContactResponse])
def create_contact(
    payload: ContactCreateUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    c = OfficialContact(
        id=str(uuid.uuid4()),
        name=payload.name,
        type=payload.type,
        phone=payload.phone,
        url=payload.url,
        description=payload.description,
        source_url=payload.source_url,
        verified_by=payload.verified_by or admin.username,
        verified_at=datetime.now(timezone.utc),
        is_active=payload.is_active,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return APIResponse.ok(OfficialContactResponse.model_validate(c))


@router.delete("/contacts/{contact_id}", response_model=APIResponse[dict])
def delete_contact(
    contact_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    c = db.scalar(select(OfficialContact).where(OfficialContact.id == contact_id))
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found.")
    db.delete(c)
    db.commit()
    return APIResponse.ok({"message": "Contact deleted."})
