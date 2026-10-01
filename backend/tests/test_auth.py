def test_login_success_student(client):
    res = client.post("/api/auth/login", json={
        "email": "aarav.sharma@klh.edu.in",
        "password": "Student@123",
        "role": "student"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "STUDENT"
    assert data["email"] == "aarav.sharma@klh.edu.in"
    assert data["student_id"] is not None

def test_login_success_admin(client):
    res = client.post("/api/auth/login", json={
        "email": "admin@klh.edu.in",
        "password": "Admin@123",
        "role": "admin"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"

def test_login_invalid_password(client):
    res = client.post("/api/auth/login", json={
        "email": "admin@klh.edu.in",
        "password": "WrongPassword123",
        "role": "admin"
    })
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

def test_login_role_mismatch_rejected(client):
    # Admin tries to login selecting student role
    res = client.post("/api/auth/login", json={
        "email": "admin@klh.edu.in",
        "password": "Admin@123",
        "role": "student"
    })
    assert res.status_code == 403
    assert "Account is registered as ADMIN" in res.json()["detail"]

def test_get_me_authenticated(client, student_auth_headers):
    res = client.get("/api/auth/me", headers=student_auth_headers)
    assert res.status_code == 200
    assert res.json()["role"] == "STUDENT"

def test_unauthorized_access(client):
    res = client.get("/api/students/me")
    assert res.status_code == 401

def test_rbac_student_blocked_from_admin_route(client, student_auth_headers):
    res = client.get("/api/allocations", headers=student_auth_headers)
    assert res.status_code == 403
    assert "restricted to administrators" in res.json()["detail"]

def test_rbac_admin_allowed_on_admin_route(client, admin_auth_headers):
    res = client.get("/api/allocations", headers=admin_auth_headers)
    assert res.status_code == 200
