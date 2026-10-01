import os
os.environ.setdefault("TESTING", "1")
os.environ.setdefault("JWT_SECRET", "test-secret-key-for-automated-testing-only-12345")

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal, Base, engine
from backend.app.seed import seed_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
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
