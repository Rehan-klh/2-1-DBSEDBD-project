# API Documentation

## API Conventions

- Base API prefix: `/api` unless the implementation establishes another consistent prefix.
- Format: JSON.
- Authentication: JWT Bearer token for protected endpoints.
- Authorization: role-based (`STUDENT`, `ADMIN`).
- Validation: Pydantic schemas.
- HTTP methods and status codes should follow REST conventions.
- Backend authorization is authoritative; frontend role selection is not trusted.

## Endpoint Contract

| Module | Method | Endpoint | Role | Purpose |
|---|---|---|---|---|
| Auth | POST | `/auth/login` | Public | Authenticate and issue JWT |
| Auth | GET | `/auth/me` | Student/Admin | Return authenticated user |
| Students | GET | `/students/me` | Student | View own profile |
| Students | PUT | `/students/me` | Student | Update own profile |
| Students | GET | `/students/me/dashboard` | Student | Student dashboard data |
| Students | GET | `/students` | Admin | List students |
| Students | GET | `/students/{id}` | Admin | View a student |
| Students | POST | `/students` | Admin | Create student account/profile |
| Students | PUT | `/students/{id}` | Admin | Update student |
| Students | DELETE | `/students/{id}` | Admin | Remove/deactivate student as defined by implementation |
| Hostels | GET | `/hostels` | Student/Admin | List hostels |
| Hostels | GET | `/hostels/{id}/blocks` | Student/Admin | List blocks in a hostel |
| Rooms | GET | `/rooms` | Student/Admin | List/filter rooms |
| Rooms | GET | `/rooms/{id}` | Student/Admin | View room details |
| Rooms | GET | `/rooms/available` | Student/Admin | View rooms with available capacity |
| Rooms | POST | `/rooms` | Admin | Create room |
| Rooms | PUT | `/rooms/{id}` | Admin | Update room |
| Rooms | DELETE | `/rooms/{id}` | Admin | Remove room subject to allocation rules |
| Allocations | GET | `/allocations/me` | Student | View current allocation |
| Allocations | POST | `/allocations` | Student | Select an available room |
| Allocations | GET | `/allocations` | Admin | View allocations |
| Allocations | POST | `/allocations/admin` | Admin | Allocate a student |
| Allocations | PATCH | `/allocations/{id}/transfer` | Admin | Transfer/override room |
| Allocations | DELETE | `/allocations/{id}` | Admin | Release allocation |
| Room Changes | POST | `/room-changes` | Student | Submit room-change request |
| Room Changes | GET | `/room-changes/me` | Student | View own requests |
| Room Changes | GET | `/room-changes` | Admin | View all requests |
| Room Changes | PATCH | `/room-changes/{id}` | Admin | Approve/reject request |
| Leave | POST | `/leave` | Student | Submit leave request |
| Leave | GET | `/leave/me` | Student | View own leave requests |
| Leave | GET | `/leave` | Admin | View all leave requests |
| Leave | PATCH | `/leave/{id}` | Admin | Approve/reject/change status |
| Complaints | POST | `/complaints` | Student | Submit complaint |
| Complaints | GET | `/complaints/me` | Student | View own complaints |
| Complaints | GET | `/complaints` | Admin | View all complaints |
| Complaints | PATCH | `/complaints/{id}` | Admin | Update status/response |
| Mess | GET | `/mess/menu` | Student/Admin | View menu |
| Mess | POST | `/mess/menu` | Admin | Create menu entry |
| Mess | PUT | `/mess/menu/{id}` | Admin | Update menu entry |
| Mess | DELETE | `/mess/menu/{id}` | Admin | Delete menu entry |
| Mess Feedback | POST | `/mess/feedback` | Student | Submit feedback |
| Mess Feedback | GET | `/mess/feedback/me` | Student | View own feedback |
| Mess Feedback | GET | `/mess/feedback` | Admin | View feedback |
| Fees | GET | `/fees/me` | Student | View own fees |
| Fees | GET | `/fees` | Admin | View student fees |
| Fees | POST | `/fees` | Admin | Create fee record |
| Fees | PATCH | `/fees/{id}` | Admin | Update fee/status |
| Visitors | POST | `/visitors` | Student | Submit visitor request |
| Visitors | GET | `/visitors/me` | Student | View own visitor requests |
| Visitors | GET | `/visitors` | Admin | View visitor requests |
| Visitors | PATCH | `/visitors/{id}` | Admin | Approve/reject request |
| Announcements | GET | `/announcements` | Student/Admin | View announcements |
| Announcements | POST | `/announcements` | Admin | Create announcement |
| Announcements | PUT | `/announcements/{id}` | Admin | Update announcement |
| Announcements | DELETE | `/announcements/{id}` | Admin | Delete announcement |
| Notifications | GET | `/notifications` | Student/Admin | List own notifications |
| Notifications | PATCH | `/notifications/{id}/read` | Student/Admin | Mark notification read |
| Activity Logs | GET | `/activity-logs` | Admin | View activity/audit logs |

## Core State Transitions

### Room Allocation

Student selects available room -> backend checks capacity and active allocation -> allocation becomes `ACTIVE`.

A student must not have more than one active allocation.

### Room Change

`PENDING -> APPROVED` or `PENDING -> REJECTED`.

On approval, the student's active allocation is safely released/transferred and the requested room becomes active.

### Leave

`PENDING -> APPROVED` or `PENDING -> REJECTED`.

Admin may change status later where supported by the implementation.

### Complaint

`PENDING -> IN_PROGRESS -> RESOLVED`.

### Visitor

`PENDING -> APPROVED` or `PENDING -> REJECTED`.

## API Documentation Detail

For every implemented endpoint, expand this document with:

- Request schema
- Response schema
- Authentication requirement
- Role requirement
- Validation rules
- Success status
- Error statuses
- Database interaction
- Important business rules
