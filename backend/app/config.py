import os
import sys
from pathlib import Path
from typing import Any
from dotenv import load_dotenv
from pydantic import model_validator, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Ensure project root is in sys.path so 'backend.app...' is always resolvable
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

ROOT_ENV_FILE = PROJECT_ROOT / ".env"
BACKEND_ENV_FILE = BACKEND_DIR / ".env"

# Explicitly load .env from project root, with fallback to backend/.env
if ROOT_ENV_FILE.exists():
    load_dotenv(ROOT_ENV_FILE)
elif BACKEND_ENV_FILE.exists():
    load_dotenv(BACKEND_ENV_FILE)

def is_testing_environment() -> bool:
    return bool(
        os.getenv("TESTING") == "1"
        or "pytest" in sys.modules
        or any("pytest" in arg for arg in sys.argv)
    )

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hostel & Mess Management System"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = ""
    MONGODB_URI: str = ""
    MONGODB_DB_NAME: str = "hostel_mess_db"
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: Any = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_ENV_FILE), str(BACKEND_ENV_FILE), ".env"),
        env_file_encoding="utf-8",
        extra="allow"
    )

    @property
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        """Returns SQLAlchemy-compatible URL, ensuring psycopg2 driver is used for PostgreSQL."""
        url = self.DATABASE_URL.strip() if self.DATABASE_URL else ""
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, (list, tuple)):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]

    @model_validator(mode="after")
    def validate_database_and_jwt(self):
        # 1. Validate DATABASE_URL
        if not self.DATABASE_URL or not self.DATABASE_URL.strip():
            raise RuntimeError(
                "DATABASE_URL configuration is missing. PostgreSQL is the required relational database. "
                "Please configure DATABASE_URL in your .env file or environment (e.g., "
                "DATABASE_URL=postgresql://postgres:<password>@localhost:5432/hostel_db)."
            )
        db_url = self.DATABASE_URL.strip().lower()
        if not is_testing_environment():
            if db_url.startswith("sqlite"):
                raise RuntimeError(
                    "SQLite fallback is disabled for normal runtime. PostgreSQL is the required database. "
                    "Please configure a valid PostgreSQL connection in DATABASE_URL (e.g., "
                    "DATABASE_URL=postgresql://postgres:<password>@localhost:5432/hostel_db)."
                )
            if not db_url.startswith("postgresql"):
                raise RuntimeError(
                    f"Invalid DATABASE_URL scheme: expected PostgreSQL connection string starting with 'postgresql://' or 'postgresql+psycopg2://'."
                )

        # 2. Validate JWT_SECRET
        if not self.JWT_SECRET or not self.JWT_SECRET.strip():
            if is_testing_environment():
                self.JWT_SECRET = "test-only-temporary-secret-key-for-automated-tests-32char"
            else:
                raise RuntimeError(
                    "JWT_SECRET environment variable is missing. A secure JWT_SECRET must be configured via environment or .env file before starting the application."
                )
        return self

settings = Settings()

