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
    DATABASE_URL: str = "sqlite:///./hostel_mess.db"
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
    def validate_jwt_secret(self):
        if not self.JWT_SECRET or not self.JWT_SECRET.strip():
            if is_testing_environment():
                self.JWT_SECRET = "test-only-temporary-secret-key-for-automated-tests-32char"
            else:
                raise RuntimeError(
                    "JWT_SECRET environment variable is missing. A secure JWT_SECRET must be configured via environment or .env file before starting the application."
                )
        return self

settings = Settings()
