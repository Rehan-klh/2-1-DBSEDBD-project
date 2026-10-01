def test_student_duplicate_active_allocation_prevented(client, student_auth_headers):
    # Aarav already has an active allocation (seeded in B-214)
    res = client.post("/api/allocations", json={"room_id": 1}, headers=student_auth_headers)
    assert res.status_code == 400
    assert "already has an active room allocation" in res.json()["detail"]

def test_view_current_allocation(client, student_auth_headers):
    res = client.get("/api/allocations/me", headers=student_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ACTIVE"
    assert data["room_number"] == "B-214"

def test_available_rooms_capacity(client, student_auth_headers):
    res = client.get("/api/rooms/available", headers=student_auth_headers)
    assert res.status_code == 200
    rooms = res.json()
    assert len(rooms) > 0
    for r in rooms:
        assert r["available_capacity"] > 0
        assert r["occupied_count"] <= r["capacity"]

def test_admin_transfer_and_release_workflow(client, admin_auth_headers):
    # Admin lists allocations
    res = client.get("/api/allocations", headers=admin_auth_headers)
    assert res.status_code == 200
    allocs = res.json()
    active_alloc = next((a for a in allocs if a["status"] == "ACTIVE" and a["room_number"] == "A-108"), None)
    assert active_alloc is not None

    alloc_id = active_alloc["allocation_id"]

    # Transfer student to A-101 (Room id 1)
    rooms_res = client.get("/api/rooms", headers=admin_auth_headers)
    target_room = next((r for r in rooms_res.json() if r["room_number"] == "A-101"), None)
    assert target_room is not None

    transfer_res = client.patch(
        f"/api/allocations/{alloc_id}/transfer",
        json={"new_room_id": target_room["room_id"]},
        headers=admin_auth_headers
    )
    assert transfer_res.status_code == 200
    new_alloc = transfer_res.json()
    assert new_alloc["status"] == "ACTIVE"
    assert new_alloc["room_id"] == target_room["room_id"]

    # Now release the new allocation
    release_res = client.delete(
        f"/api/allocations/{new_alloc['allocation_id']}",
        headers=admin_auth_headers
    )
    assert release_res.status_code == 200
    assert release_res.json()["status"] == "RELEASED"
