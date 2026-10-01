def test_leave_workflow(client, student_auth_headers, admin_auth_headers):
    # Student submits leave
    res = client.post("/api/leave", json={
        "leave_type": "Home Visit",
        "from_date": "2026-10-10",
        "to_date": "2026-10-15",
        "reason": "Diwali festival family vacation"
    }, headers=student_auth_headers)
    assert res.status_code == 201
    leave_id = res.json()["leave_id"]
    assert res.json()["status"] == "PENDING"

    # Admin approves
    patch_res = client.patch(f"/api/leave/{leave_id}", json={
        "status": "APPROVED",
        "admin_comment": "Approved for festival"
    }, headers=admin_auth_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "APPROVED"

    # Student views updated leave
    my_leaves = client.get("/api/leave/me", headers=student_auth_headers)
    assert my_leaves.status_code == 200
    item = next(l for l in my_leaves.json() if l["leave_id"] == leave_id)
    assert item["status"] == "APPROVED"

def test_complaint_workflow(client, student_auth_headers, admin_auth_headers):
    # Student raises complaint
    res = client.post("/api/complaints", json={
        "category": "Internet",
        "subject": "Wi-Fi disconnecting in Block B room 214",
        "description": "5GHz signal keeps dropping every 15 minutes.",
        "priority": "High"
    }, headers=student_auth_headers)
    assert res.status_code == 201
    complaint_id = res.json()["complaint_id"]
    assert res.json()["status"] == "PENDING"

    # Admin moves to IN_PROGRESS
    p1 = client.patch(f"/api/complaints/{complaint_id}", json={
        "status": "IN_PROGRESS",
        "admin_response": "Assigned to network engineer"
    }, headers=admin_auth_headers)
    assert p1.status_code == 200
    assert p1.json()["status"] == "IN_PROGRESS"

    # Admin resolves
    p2 = client.patch(f"/api/complaints/{complaint_id}", json={
        "status": "RESOLVED",
        "admin_response": "Access point rebooted and antenna adjusted"
    }, headers=admin_auth_headers)
    assert p2.status_code == 200
    assert p2.json()["status"] == "RESOLVED"

def test_visitor_workflow(client, student_auth_headers, admin_auth_headers):
    res = client.post("/api/visitors", json={
        "visitor_name": "Rajesh Sharma",
        "visitor_phone": "+91 98765 00000",
        "relationship": "Father",
        "purpose": "Deliver study material and luggage",
        "visit_date": "2026-10-20"
    }, headers=student_auth_headers)
    assert res.status_code == 201
    visitor_id = res.json()["visitor_request_id"]
    assert res.json()["status"] == "PENDING"

    # Admin approves
    patch_res = client.patch(f"/api/visitors/{visitor_id}", json={
        "status": "APPROVED",
        "admin_comment": "Pass issued for visiting hours"
    }, headers=admin_auth_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "APPROVED"

def test_mess_and_feedback_workflow(client, student_auth_headers, admin_auth_headers):
    # View menu
    menu_res = client.get("/api/mess/menu", headers=student_auth_headers)
    assert menu_res.status_code == 200
    assert len(menu_res.json()) > 0

    # Student submits mess feedback (MongoDB)
    fb_res = client.post("/api/mess/feedback", json={
        "meal_type": "LUNCH",
        "date": "2026-10-01",
        "rating": 5,
        "feedback": "Delicious paneer curry and hot rotis!"
    }, headers=student_auth_headers)
    assert fb_res.status_code == 201
    assert fb_res.json()["rating"] == 5

    # Admin views all feedback
    all_fb = client.get("/api/mess/feedback", headers=admin_auth_headers)
    assert all_fb.status_code == 200
    assert any(f["feedback"] == "Delicious paneer curry and hot rotis!" for f in all_fb.json())

def test_fee_workflow(client, student_auth_headers, admin_auth_headers):
    my_fees = client.get("/api/fees/me", headers=student_auth_headers)
    assert my_fees.status_code == 200
    assert len(my_fees.json()) > 0

def test_announcements_workflow(client, student_auth_headers, admin_auth_headers):
    # Admin creates announcement
    res = client.post("/api/announcements", json={
        "title": "Annual Hostel Sports Meet 2026",
        "content": "Registration open for badminton, table tennis, and chess.",
        "priority": "High"
    }, headers=admin_auth_headers)
    assert res.status_code == 201
    ann_id = res.json()["announcement_id"]

    # Student views announcements
    all_ann = client.get("/api/announcements", headers=student_auth_headers)
    assert all_ann.status_code == 200
    assert any(a["announcement_id"] == ann_id for a in all_ann.json())

def test_notifications_and_activity_logs(client, student_auth_headers, admin_auth_headers):
    # Student reads notifications
    notifs = client.get("/api/notifications", headers=student_auth_headers)
    assert notifs.status_code == 200
    assert len(notifs.json()) > 0
    first_notif = notifs.json()[0]

    # Mark as read
    mark_res = client.patch(f"/api/notifications/{first_notif['id']}/read", headers=student_auth_headers)
    assert mark_res.status_code == 200

    # Admin reads activity logs
    logs = client.get("/api/activity-logs", headers=admin_auth_headers)
    assert logs.status_code == 200
    assert len(logs.json()) > 0

def test_delete_student(client, admin_auth_headers):
    # 1. Create a student to be deleted
    create_res = client.post("/api/students", json={
        "email": "temp.student.delete@klh.edu.in",
        "password": "Student@123",
        "name": "Temporary Student",
        "phone": "+91 99999 11111",
        "department": "Civil Engineering",
        "year": 1
    }, headers=admin_auth_headers)
    assert create_res.status_code == 201
    temp_student_id = create_res.json()["student_id"]

    # 2. Delete the student
    del_res = client.delete(f"/api/students/{temp_student_id}", headers=admin_auth_headers)
    assert del_res.status_code == 204

    # 3. Verify student is deleted (GET returns 404)
    get_res = client.get(f"/api/students/{temp_student_id}", headers=admin_auth_headers)
    assert get_res.status_code == 404

def test_delete_room_with_active_allocations(client, admin_auth_headers):
    # Find a room with active allocations
    rooms_res = client.get("/api/rooms", headers=admin_auth_headers)
    assert rooms_res.status_code == 200
    occupied_room = next((r for r in rooms_res.json() if r["occupied_count"] > 0), None)
    assert occupied_room is not None

    # Attempt to delete the room
    del_res = client.delete(f"/api/rooms/{occupied_room['room_id']}", headers=admin_auth_headers)
    assert del_res.status_code == 400
    assert "Cannot delete room with active student allocations" in del_res.json()["detail"]

def test_update_room_capacity_below_occupancy(client, admin_auth_headers):
    # 1. Create two test students
    s1_res = client.post("/api/students", json={
        "email": "occ.student1@klh.edu.in",
        "password": "Student@123",
        "name": "Occupancy Student One",
        "phone": "+91 99887 76601",
        "department": "CSE",
        "year": 2
    }, headers=admin_auth_headers)
    assert s1_res.status_code == 201
    s1_id = s1_res.json()["student_id"]

    s2_res = client.post("/api/students", json={
        "email": "occ.student2@klh.edu.in",
        "password": "Student@123",
        "name": "Occupancy Student Two",
        "phone": "+91 99887 76602",
        "department": "ECE",
        "year": 2
    }, headers=admin_auth_headers)
    assert s2_res.status_code == 201
    s2_id = s2_res.json()["student_id"]

    # 2. Pick a room with available capacity >= 2
    rooms_res = client.get("/api/rooms", headers=admin_auth_headers)
    room = next(r for r in rooms_res.json() if r["available_capacity"] >= 2)

    # 3. Allocate both students to this room so occupancy is at least 2
    a1 = client.post("/api/allocations/admin", json={
        "student_id": s1_id,
        "room_id": room["room_id"]
    }, headers=admin_auth_headers)
    assert a1.status_code == 201

    a2 = client.post("/api/allocations/admin", json={
        "student_id": s2_id,
        "room_id": room["room_id"]
    }, headers=admin_auth_headers)
    assert a2.status_code == 201

    # 4. Attempt to set room capacity to 1 (less than occupied count of 2)
    update_res = client.put(f"/api/rooms/{room['room_id']}", json={
        "capacity": 1
    }, headers=admin_auth_headers)
    assert update_res.status_code == 400
    assert "Capacity cannot be less than currently occupied spaces" in update_res.json()["detail"]

def test_leave_workflow_rejected(client, student_auth_headers, admin_auth_headers):
    # Student submits leave request
    create_res = client.post("/api/leave", json={
        "leave_type": "Medical Leave",
        "from_date": "2026-11-01",
        "to_date": "2026-11-05",
        "reason": "Dental surgery appointment"
    }, headers=student_auth_headers)
    assert create_res.status_code == 201
    leave_id = create_res.json()["leave_id"]
    assert create_res.json()["status"] == "PENDING"

    # Admin rejects leave request
    patch_res = client.patch(f"/api/leave/{leave_id}", json={
        "status": "REJECTED",
        "admin_comment": "Doctor certificate required for approval"
    }, headers=admin_auth_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "REJECTED"
    assert patch_res.json()["admin_comment"] == "Doctor certificate required for approval"

def test_room_change_rejected(client, student_auth_headers, admin_auth_headers):
    # Student submits room change request
    rooms_res = client.get("/api/rooms", headers=student_auth_headers)
    assert rooms_res.status_code == 200
    target_room = next((r for r in rooms_res.json() if r["room_number"] == "B-102"), rooms_res.json()[0])

    req_res = client.post("/api/room-changes", json={
        "requested_room_id": target_room["room_id"],
        "reason": "Prefer quieter wing for study"
    }, headers=student_auth_headers)
    assert req_res.status_code == 201
    change_id = req_res.json()["request_id"]
    assert req_res.json()["status"] == "PENDING"

    # Admin rejects room change
    patch_res = client.patch(f"/api/room-changes/{change_id}", json={
        "status": "REJECTED"
    }, headers=admin_auth_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "REJECTED"

def test_update_mess_menu(client, admin_auth_headers):
    # Fetch menu items
    menu_res = client.get("/api/mess/menu", headers=admin_auth_headers)
    assert menu_res.status_code == 200
    first_item = menu_res.json()[0]
    menu_id = first_item["menu_id"]

    # Admin updates menu item
    update_res = client.put(f"/api/mess/menu/{menu_id}", json={
        "menu_items": "Updated Chef Special: Masala Dosa, Sambar, Fresh Coconut Chutney"
    }, headers=admin_auth_headers)
    assert update_res.status_code == 200
    assert "Updated Chef Special" in update_res.json()["menu_items"]

def test_delete_mess_menu(client, admin_auth_headers):
    # Admin creates a temporary menu entry
    create_res = client.post("/api/mess/menu", json={
        "day": "Sunday",
        "meal_type": "SNACKS",
        "menu_items": "Gulab Jamun, Samosa, Masala Chai"
    }, headers=admin_auth_headers)
    assert create_res.status_code == 201
    menu_id = create_res.json()["menu_id"]

    # Admin deletes the menu entry
    del_res = client.delete(f"/api/mess/menu/{menu_id}", headers=admin_auth_headers)
    assert del_res.status_code == 204

    # Verify menu entry no longer exists
    menu_res = client.get("/api/mess/menu", headers=admin_auth_headers)
    assert menu_res.status_code == 200
    assert not any(m["menu_id"] == menu_id for m in menu_res.json())
