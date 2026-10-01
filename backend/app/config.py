import os
import sys
from pydantic import model_validator
from pydantic_settings import BaseSettings

def is_testing_environment() -> bool:
    return bool(
        os.getenv("TESTING") == "1"
        or "pytest" in sys.modules
        or any("pytest" in arg for arg in sys.argv)
    )

def get_cors_origins() -> list[str]:
    cors_env = os.getenv("CORS_ORIGINS")
    if cors_env:
        return [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hostel & Mess Management System"
    API_PREFIX: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hostel_mess.db")
    MONGODB_URI: str = os.getenv("MONGODB_URI", "")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "hostel_mess_db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))
    CORS_ORIGINS: list[str] = get_cors_origins()

    class Config:
        env_file = ".env"
        extra = "allow"

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
