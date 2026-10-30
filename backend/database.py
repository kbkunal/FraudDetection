"""
CyberShield Database Setup
SQLAlchemy engine, session factory, and base model configuration.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from typing import Generator

from config import settings


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
engine_kwargs = {
    "echo": settings.ENVIRONMENT == "development",
}

if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite requires check_same_thread=False for FastAPI's async thread use
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL / Cloud production connection pooling settings
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

# Enable WAL mode and foreign keys for SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


# ---------------------------------------------------------------------------
# Declarative base
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_db() -> Generator[Session, None, None]:
    """
    Yield a database session and ensure it is closed after use.
    Use as a FastAPI dependency with Depends(get_db).
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables() -> None:
    """Create all tables defined in the ORM models."""
    # Import all models so metadata is populated before create_all
    import models.shared       # noqa: F401
    import models.upi          # noqa: F401
    import models.message      # noqa: F401
    import models.email_model  # noqa: F401
    import models.help         # noqa: F401

    Base.metadata.create_all(bind=engine)
