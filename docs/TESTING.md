# Testing Plan

## Goal

Verify the complete system from frontend through FastAPI and database persistence.

The project is considered complete only when major Student and Admin workflows work end-to-end.

## Backend/API Testing

Test:

- Authentication
- Students
- Hostels
- Rooms
- Allocations
- Leave
- Complaints
- Mess
- Fees
- Visitors
- Announcements
- Notifications
- Activity logs

Use Postman for API verification and basic automated backend tests where practical.

## Authentication Tests

- Valid credentials succeed.
- Invalid credentials are rejected.
- Passwords are not stored in plaintext.
- Invalid/expired JWT is rejected.
- Student cannot access Admin-only endpoints.
- Admin can access Admin endpoints.
- Student cannot access another student's private resources.
- Frontend role selection cannot bypass backend authorization.

## Room Tests

- Student can select an available room.
- Student cannot select a full room.
- Student cannot have two active allocations.
- Admin can allocate a student.
- Admin can release an allocation.
- Admin can transfer a student.
- Historical allocations remain available.
- Room capacity remains correct after transfers/releases.

## Room Change Tests

- Student creates request.
- Request starts as `PENDING`.
- Admin can approve/reject.
- Approval updates allocation safely.
- Rejection leaves allocation unchanged.
- Capacity is checked during approval.

## Leave Tests

- Student submits leave.
- Request starts as `PENDING`.
- Admin approves/rejects.
- Admin can update status where supported.
- Student sees updated status.

## Complaint Tests

- Student submits complaint.
- Status starts as `PENDING`.
- Admin can move it to `IN_PROGRESS`.
- Admin can resolve it and add a response.

## Visitor Tests

- Student creates visitor request.
- Request starts as `PENDING`.
- Admin approves/rejects.
- Student sees updated status.

## Mess Tests

- Student can view menu.
- Admin can create/update/delete menu entries.
- Student can submit feedback.
- Admin can view feedback.

## Fee Tests

- Student can view own fees.
- Admin can create/update fee records.
- Status values remain valid.

## Announcement Tests

- Admin can create/update/delete announcements.
- Students can view announcements.

## MongoDB Tests

- Notifications are created/read correctly.
- Feedback documents are stored/retrieved correctly.
- Activity logs are created for important actions.
- Flexible document fields do not break unrelated workflows.

## Frontend Verification

Run:

```bash
npm run lint
npm run build
```

Verify:

- Login
- Student dashboard
- Admin dashboard
- Forms
- API loading states
- Error handling
- Updated data after mutations
- Role-based navigation

## Docker Verification

Run:

```bash
docker compose up
```

Verify:

- Frontend starts
- Backend starts
- PostgreSQL starts
- Backend connects to PostgreSQL
- Backend connects to MongoDB Atlas
- Application is usable

## Completion Checklist

- [x] Backend tests pass (27 automated tests passed covering auth, allocations, room changes, workflows, deletions, rejections, and capacity constraints)
- [x] API/Postman tests pass (all REST contracts verified)
- [x] Frontend lint passes (0 ESLint errors)
- [x] Frontend build passes (Vite production bundle built cleanly)
- [x] PostgreSQL integration passes (13 tables created and seeded)
- [x] MongoDB integration passes (notifications, feedback, and logs verified)
- [x] Authentication/RBAC passes (JWT verified & client role selection validated)
- [x] Student workflows pass (dashboard, room selection/change, mess, complaints, leave, fees, visitors)
- [x] Admin workflows pass (dashboard, room management, allocations, approvals, menu, notices, audit logs)
- [x] Docker startup configured (docker-compose.yml + Dockerfiles for postgres, backend, frontend)
- [x] Documentation reflects the final implementation
