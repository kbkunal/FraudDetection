"""
CyberShield FastAPI Backend
Main application entry point.

This is a prototype analysis and assistance tool.
It does NOT connect to live banking systems, NPCI, or law enforcement.
"""

import uuid
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import engine, SessionLocal
from models.shared import Base as SharedBase
from models.upi import Base as UPIBase
from models.message import Base as MessageBase
from models.email_model import Base as EmailBase
from models.help import Base as HelpBase
from services.help_service import seed_database

# Import all route modules
from routes import auth, upi, messages, emails, help_routes, incidents, admin as admin_routes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle manager: create tables and seed data on startup."""
    logger.info("CyberShield backend starting up...")

    # Create all tables
    SharedBase.metadata.create_all(bind=engine)
    UPIBase.metadata.create_all(bind=engine)
    MessageBase.metadata.create_all(bind=engine)
    EmailBase.metadata.create_all(bind=engine)
    HelpBase.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")

    # Seed database with initial data if empty
    db = SessionLocal()
    try:
        seed_database(db)
        logger.info("Database seeded (or already populated)")
    finally:
        db.close()

    # Ensure upload directory exists
    import os
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    logger.info("CyberShield backend ready")
    yield
    logger.info("CyberShield backend shutting down")


app = FastAPI(
    title="CyberShield API",
    description=(
        "Cyber Fraud Analysis and Victim Assistance Platform API. "
        "This is a prototype tool. It does not connect to banking systems, "
        "NPCI, or law enforcement. For real fraud reporting: call 1930 or "
        "visit https://cybercrime.gov.in/"
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler — never expose internal errors to clients
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = str(uuid.uuid4())
    logger.error(f"Unhandled exception [request_id={request_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "request_id": request_id,
            "status": "error",
            "data": None,
            "errors": ["An internal error occurred. Please try again later."]
        }
    )


# Include all routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(upi.router, prefix="/api/v1/upi", tags=["UPI Transaction Analysis"])
app.include_router(messages.router, prefix="/api/v1/messages", tags=["Message Analysis"])
app.include_router(emails.router, prefix="/api/v1/emails", tags=["Email Analysis"])
app.include_router(help_routes.router, prefix="/api/v1/help", tags=["Victim Help Centre"])
app.include_router(incidents.router, prefix="/api/v1/incidents", tags=["Incident Management"])
app.include_router(admin_routes.router, prefix="/api/v1/admin", tags=["Administration"])


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {
        "request_id": str(uuid.uuid4()),
        "status": "ok",
        "data": {
            "service": "CyberShield API",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "disclaimer": (
                "This is a prototype tool. "
                "For real cyber fraud reporting: call 1930 or visit cybercrime.gov.in"
            )
        },
        "errors": []
    }


@app.get("/api/v1/health", tags=["System"])
async def api_health_check():
    """API health check."""
    return await health_check()

