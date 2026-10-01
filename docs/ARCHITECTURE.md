# System Architecture

## Architecture Style

The project uses a **modular monolith** architecture.

It is intentionally not implemented as multiple independent microservices. The backend is organized into clear domain modules so that individual modules could be separated into services later if justified.

## High-Level Architecture

```text
Student / Admin
      |
      v
React Frontend
      |
   REST/JSON
      |
      v
FastAPI Backend
      |
      +----------------------+
      |                      |
      v                      v
 JWT + RBAC             Application Modules
                             |
                    +--------+--------+
                    |                 |
                    v                 v
               PostgreSQL       MongoDB Atlas
               Core Data       Flexible Documents
```

## Frontend

Technology:

- React
- Vite
- JavaScript

Responsibilities:

- Login UI
- Student dashboard
- Admin dashboard
- Forms and validation
- API communication
- Displaying backend state
- Role-aware navigation

The existing frontend is the starting UI and should be preserved while replacing mock/static data with backend API integration.

## Backend

Technology:

- FastAPI
- Pydantic
- SQLAlchemy
- JWT authentication

Responsibilities:

- REST APIs
- Authentication
- Role-based authorization
- Validation
- Business rules
- PostgreSQL persistence
- MongoDB Atlas persistence
- Error handling

## Backend Modules

```text
Auth
Students
Hostels
Rooms
Allocations
Leave
Complaints
Mess
Fees
Visitors
Announcements
Notifications
Activity Logs
```

## Security

- JWT-based authentication.
- Passwords stored only as secure hashes.
- Role-based authorization.
- Backend verifies the user's actual role.
- Frontend role selection must never be treated as trusted authorization.
- Protected endpoints require a valid JWT.
- Secrets are loaded from environment variables.
- `.env` files and credentials are excluded from Git.

## Data Flow

1. Student or Admin interacts with React.
2. React sends REST/JSON request to FastAPI.
3. FastAPI authenticates and authorizes the request.
4. Application module validates business rules.
5. PostgreSQL or MongoDB Atlas is accessed as appropriate.
6. FastAPI returns JSON.
7. React updates the dashboard.

## Deployment

Docker Compose should provide a simple local environment containing:

- React frontend
- FastAPI backend
- PostgreSQL

MongoDB Atlas remains externally hosted.

Target startup:

```bash
docker compose up
```

## Future Scalability

The modular boundaries make future service separation possible, but microservices, Kafka, Kubernetes, and distributed transactions are not required in the current implementation.
