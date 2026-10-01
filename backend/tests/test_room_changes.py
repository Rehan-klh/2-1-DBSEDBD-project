def test_room_change_workflow(client, student_auth_headers, admin_auth_headers):
    # Aarav submits room change from B-214 to B-305
    rooms_res = client.get("/api/rooms", headers=student_auth_headers)
    target_room = next((r for r in rooms_res.json() if r["room_number"] == "B-305"), None)
    assert target_room is not None

    req_res = client.post("/api/room-changes", json={
        "requested_room_id": target_room["room_id"],
        "reason": "Prefer quieter 3rd floor room for study"
    }, headers=student_auth_headers)
    assert req_res.status_code == 201
    change_req = req_res.json()
    assert change_req["status"] == "PENDING"
    req_id = change_req["request_id"]

    # Student views own room change requests
    my_changes = client.get("/api/room-changes/me", headers=student_auth_headers)
    assert my_changes.status_code == 200
    assert any(r["request_id"] == req_id for r in my_changes.json())

    # Admin approves room change
    approval_res = client.patch(f"/api/room-changes/{req_id}", json={
        "status": "APPROVED",
        "admin_comment": "Approved by warden"
    }, headers=admin_auth_headers)
    assert approval_res.status_code == 200
    assert approval_res.json()["status"] == "APPROVED"

    # Verify student now has active allocation in B-305
    curr_alloc = client.get("/api/allocations/me", headers=student_auth_headers)
    assert curr_alloc.status_code == 200
    assert curr_alloc.json()["room_number"] == "B-305"
