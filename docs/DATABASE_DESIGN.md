# Database Design

## Overview

The system uses polyglot persistence:

- **PostgreSQL** for structured, relational, transactional hostel and mess-management data.
- **MongoDB Atlas** for flexible document-oriented supporting data.

There are **16 total database structures**:

- 13 PostgreSQL tables
- 3 MongoDB collections

The same business entity should not be unnecessarily duplicated across both databases.

## PostgreSQL Tables

### 1. users

Authentication and role identity.

- `user_id` — primary key
- `email` — unique, required
- `password_hash` — required; never store plaintext passwords
- `role` — `STUDENT` or `ADMIN`
- `created_at` — required timestamp

### 2. students

Student profile data linked one-to-one with `users`.

- `student_id` — primary key
- `user_id` — unique foreign key to `users`
- `name`
- `phone`
- `department`
- `year`

### 3. hostels

Top-level hostel entities.

- `hostel_id` — primary key
- `name`
- `location`

### 4. hostel_blocks

Blocks belonging to a hostel.

- `block_id` — primary key
- `hostel_id` — foreign key to `hostels`
- `block_name`

### 5. rooms

Rooms belonging to blocks.

- `room_id` — primary key
- `block_id` — foreign key to `hostel_blocks`
- `room_number`
- `floor`
- `capacity`

### 6. room_allocations

Current and historical student-room allocation records.

- `allocation_id` — primary key
- `student_id` — foreign key to `students`
- `room_id` — foreign key to `rooms`
- `allocated_at`
- `released_at`
- `status` — `ACTIVE` or `RELEASED`

Important rule: only one active allocation per student.

### 7. leave_requests

Student leave requests.

Statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`

Includes optional `admin_comment`.

### 8. complaints

Student complaints.

Statuses:

- `PENDING`
- `IN_PROGRESS`
- `RESOLVED`

Includes optional priority and admin response.

### 9. fees

Student fee records.

Statuses:

- `PENDING`
- `PARTIAL`
- `PAID`

No real payment gateway is required. Fee payment/status is simulated for the project.

### 10. mess_menu

Mess menu entries.

Meal types:

- `BREAKFAST`
- `LUNCH`
- `SNACKS`
- `DINNER`

Students can view the menu; admins manage it.

### 11. room_change_requests

Requests to move from a current room to a requested room.

Statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`

Approval must update the student's active allocation safely.

### 12. visitor_requests

Student visitor requests.

Statuses:

- `PENDING`
- `APPROVED`
- `REJECTED`

### 13. announcements

Admin-created hostel announcements.

Includes:

- title
- content
- priority
- publication time
- optional expiry time
- creator (`users.user_id`)

## MongoDB Atlas Collections

### 14. notifications

Flexible user notifications.

Example:

```json
{
  "user_id": 102,
  "title": "Leave Request Updated",
  "message": "Your leave request has been approved.",
  "type": "LEAVE",
  "is_read": false,
  "created_at": "2026-10-01T18:30:00"
}
```

### 15. mess_feedback

Student feedback about meals/mess service.

Example:

```json
{
  "student_id": 102,
  "meal_type": "LUNCH",
  "date": "2026-10-01",
  "rating": 4,
  "feedback": "Good food today.",
  "created_at": "2026-10-01T14:00:00"
}
```

### 16. activity_logs

Flexible audit/activity records.

Example:

```json
{
  "user_id": 1,
  "role": "ADMIN",
  "action": "ROOM_ALLOCATION_UPDATED",
  "entity": "room_allocation",
  "entity_id": 42,
  "details": {
    "student_id": 102,
    "old_room": "B-204",
    "new_room": "B-305"
  },
  "timestamp": "2026-10-01T18:45:00"
}
```

## Persistence Rule

PostgreSQL owns core transactional relationships and constraints.

MongoDB Atlas owns flexible supporting documents such as notifications, feedback, and activity/audit records.

Do not create duplicate relational copies of these MongoDB collections unless an implementation requirement explicitly demands a reference.

## Transactional Requirements

Room allocation, transfer, release, and approved room-change operations must preserve capacity and active-allocation rules atomically.

Database constraints and application-level validation should work together rather than relying only on frontend validation.
