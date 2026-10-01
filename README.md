# Hostel & Mess Management System

A robust full-stack residential services management platform built for the **Database Systems Engineering and Distributed Backend Development (DBSEDBD)** curriculum.

The system manages student room allocations, mess menus and student feedback, leave requests, complaint lifecycles, fee tracking, visitor gate passes, announcements, and administrative audit logging.

---

## Architecture Overview

The system is architected as a **Modular Monolith** employing **Polyglot Persistence**:

```text
React (Vite) Frontend
       |
    REST / JSON (JWT Bearer Auth & RBAC)
       |
FastAPI Backend (Modular Monolith)
       |
       +-------------------------------+
       |                               |
       v                               v
PostgreSQL (SQLAlchemy)       MongoDB Atlas (PyMongo)
13 Relational Tables          3 Document Collections
- users                       - notifications
- students                    - mess_feedback
- hostels                     - activity_logs
- hostel_blocks
- rooms
- room_allocations
- leave_requests
- complaints
- fees
- mess_menu
- room_change_requests
- visitor_requests
- announcements
```

- **PostgreSQL**: Manages core structured and transactional data with ACID guarantees, foreign-key relationships, and capacity enforcement.
- **MongoDB Atlas**: Manages flexible, document-oriented event records: user notifications, student mess feedback with ratings, and administrative audit/activity logs.

---

## Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS design system, JWT token management.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0.
- **Security**: Passlib/Bcrypt password hashing, PyJWT token issuance, server-side RBAC.
- **Databases**: PostgreSQL 16 & MongoDB Atlas.
- **Containerization**: Docker & Docker Compose with multi-stage builds.
- **Testing**: Pytest, HTTPX TestClient, ESLint.

---

## Roles and Access Control (RBAC)

The system enforces two strict roles:
1. `STUDENT`: Self-service portal for viewing allocations, selecting vacant rooms, requesting room changes, submitting mess feedback, logging complaints, requesting leave, viewing fees, registering visitors, and reading announcements.
2. `ADMIN`: Comprehensive operations console for student records, block/room creation, direct room allocations, transfer overrides, room change approvals, leave decisions, complaint tracking, mess scheduling, fee recording, gate pass approvals, and audit trails.

> **Security Note**: Frontend role selection in the login interface is validated against the authenticated user's authoritative role stored in the database. Never trusted as authorization.

---

## Quick Start

### Option 1: Docker Compose (Recommended)

Start the entire stack (PostgreSQL, FastAPI Backend, React Frontend) with one command:

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API & Swagger: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

### Option 2: Local Development

#### 1. Backend Setup

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run database schema migrations & sample seed data
python -m backend.app.seed

# Start the FastAPI development server
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend Setup

```bash
# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Seed Accounts (Demo Credentials)

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@klh.edu.in` | `Admin@123` | Full administrative console access |
| **Student** | `student@klh.edu.in` | `Student@123` | Student portal (Aarav Sharma - Room B-214) |
| **Student** | `meera.iyer@klh.edu.in` | `Student@123` | Student portal (Meera Iyer - Room A-108) |
| **Student** | `nisha.khan@klh.edu.in` | `Student@123` | Student portal (Nisha Khan - Room A-207) |
| **Student** | `kiran.reddy@klh.edu.in` | `Student@123` | Student portal (Kiran Reddy - Room C-302) |

---

## Key Workflows & Business Rules

1. **Immediate Room Selection**: A student without an active allocation can select any available room with remaining capacity immediately without requiring warden pre-approval.
2. **Room Capacity & Active Allocation Guard**: A student cannot hold multiple active allocations. Room capacity cannot be exceeded.
3. **Room Change Workflow**: An allocated student submits a change request (`PENDING`). Once approved by an Admin, the previous allocation is automatically marked `RELEASED` and the new allocation becomes `ACTIVE`.
4. **Complaint Lifecycle**: Moves from `PENDING` to `IN_PROGRESS` to `RESOLVED` with warden comments.
5. **Leave Requests**: Student specifies dates, destination, and reason. Admin reviews and marks `APPROVED` or `REJECTED`.
6. **Visitor Passes**: Students register expected visitors; security/warden issues gate approvals.
7. **Simulated Fees**: Tracks Hostel, Mess, and Security deposit dues and payments without real payment gateways.
8. **Mess Feedback**: Stored directly into MongoDB Atlas with star ratings and comments.

---

## Testing & Quality Assurance

### Run Backend Automated Tests
```bash
python -m pytest backend/tests -v
```
All 27 tests verify authentication, RBAC boundaries, room capacity limits, duplicate allocation prevention, transfers, room change approvals, leave, complaints, fees, announcements, and MongoDB logging.


### Run Frontend Verification
```bash
# ESLint check
npm run lint

# Production build check
npm run build
```

---

## Documentation Links

- [System Architecture](docs/ARCHITECTURE.md)
- [Database Design & Schemas](docs/DATABASE_DESIGN.md)
- [ER Diagram & DBML](docs/ER_DIAGRAM.md)
- [REST API Contract](docs/API_DOCUMENTATION.md)
- [Project Architecture Decisions](docs/PROJECT_DECISIONS.md)
- [Setup & Environment Guide](SETUP.md)
- [Testing Verification Plan](TESTING.md)
