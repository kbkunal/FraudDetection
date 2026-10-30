"""
Authentication Routes: Register, Login, Current User, Logout.
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.shared import User
from schemas.shared import APIResponse, Token, UserCreate, UserLogin, UserResponse
from services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter()


@router.post("/register", response_model=APIResponse[UserResponse])
def register(payload: UserCreate, db: Session = Depends(get_db)):
    # Check existing email
    existing_email = db.scalar(select(User).where(User.email == payload.email))
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Check existing username
    existing_user = db.scalar(select(User).where(User.username == payload.username))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This username is already taken.",
        )

    new_user = User(
        id=str(uuid.uuid4()),
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
        role="registered",
        status="active",
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return APIResponse.ok(UserResponse.model_validate(new_user))


@router.post("/login", response_model=APIResponse[Token])
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended or inactive.",
        )

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})
    return APIResponse.ok(
        Token(
            access_token=token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )
    )


@router.get("/me", response_model=APIResponse[UserResponse])
def get_me(current_user: User = Depends(get_current_user)):
    return APIResponse.ok(UserResponse.model_validate(current_user))


@router.post("/logout", response_model=APIResponse[dict])
def logout():
    return APIResponse.ok({"message": "Successfully signed out."})
