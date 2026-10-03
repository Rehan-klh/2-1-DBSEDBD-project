import os
from pathlib import Path
from dotenv import dotenv_values

os.environ.setdefault("TESTING", "1")
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-automated-testing-only-12345")

# Ensure tests strictly run on hostel_db_test, never development hostel_db
root_env = dotenv_values(Path(__file__).resolve().parent.parent.parent / ".env")
dev_db_url = os.environ.get("DATABASE_URL") or root_env.get("DATABASE_URL", "")

test_db_url = os.environ.get("TEST_DATABASE_URL")
if not test_db_url:
    if "hostel_db" in dev_db_url:
        test_db_url = dev_db_url.replace("hostel_db", "hostel_db_test")
    else:
        test_db_url = dev_db_url

if test_db_url:
    os.environ["DATABASE_URL"] = test_db_url

import pytest
from fastapi.testclient import TestClient
from backend.app.config import settings
from backend.app.main import app
from backend.app.database import SessionLocal, Base, engine
from backend.app.seed import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Strict safety check: Never allow tests to wipe hostel_db
    db_name = engine.url.database
    if db_name and "test" not in db_name.lower():
        raise RuntimeError(
            f"SAFETY ABORT: Test suite was pointed at database '{db_name}'. "
            "Tests must ONLY run against an isolated test database such as 'hostel_db_test'!"
        )
    seed_database(force_reseed=True)
    yield

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture
def student_auth_headers(client):
    res = client.post("/api/auth/login", json={
        "email": "aarav.sharma@klh.edu.in",
        "password": "Student@123",
        "role": "student"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_auth_headers(client):
    res = client.post("/api/auth/login", json={
        "email": "admin@klh.edu.in",
        "password": "Admin@123",
        "role": "admin"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
