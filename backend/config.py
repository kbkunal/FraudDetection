"""
CyberShield Configuration
Pydantic Settings for environment-based configuration.
"""

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from functools import lru_cache
from typing import Any


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env file."""

    # Database
    DATABASE_URL: str = Field(
        default="sqlite:///./cybershield.db",
        description="SQLAlchemy database connection URL",
    )

    # JWT Authentication
    SECRET_KEY: str = Field(
        default="change-me-in-production-use-a-long-random-secret-key-32chars",
        description="Secret key for JWT token signing",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # File Uploads
    MAX_FILE_SIZE_MB: int = 10
    UPLOAD_DIR: str = "uploads"

    # Application
    ENVIRONMENT: str = Field(default="development", description="development | production")
    APP_NAME: str = "CyberShield"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"

    # CORS
    CORS_ORIGINS: Any = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: Any) -> str:
        if not v or not isinstance(v, str) or not v.strip():
            return "sqlite:///./cybershield.db"
        val = v.strip()
        # Render and other providers often provide postgres:// instead of postgresql://
        # SQLAlchemy 1.4+ and 2.0+ strictly require postgresql:// or postgresql+psycopg2://
        if val.startswith("postgres://"):
            val = val.replace("postgres://", "postgresql://", 1)
        return val

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            val = v.strip()
            if val == "*":
                return ["*"]
            if val.startswith("[") and val.endswith("]"):
                import json
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return [str(origin).strip() for origin in parsed if str(origin).strip()]
                except Exception:
                    pass
            # Split comma-separated string (e.g. from Render environment variable)
            origins = [origin.strip() for origin in val.split(",") if origin.strip()]
            return origins if origins else [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
            ]
        elif isinstance(v, (list, tuple)):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]

    model_config = {
        "env_file": [".env", "backend/.env"],
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def max_file_size_bytes(self) -> int:
        """Return max file size in bytes."""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def is_production(self) -> bool:
        """True if running in production mode."""
        return self.ENVIRONMENT.lower() == "production"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance (singleton)."""
    return Settings()


# Module-level singleton for convenience imports
settings = get_settings()
