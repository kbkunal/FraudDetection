"""
CyberShield Configuration
Pydantic Settings for environment-based configuration.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


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
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

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
