# Project Decisions

## Decision 1 — Roles

The system has exactly two roles:

- `STUDENT`
- `ADMIN`

No additional role is to be introduced without an explicit scope change.

## Decision 2 — PostgreSQL

PostgreSQL is the relational database for structured and transactional core data.

Reason:

- Foreign-key relationships
- Referential integrity
- Transactions
- Structured hostel management entities
- Room allocation and fee/leave/complaint workflows

## Decision 3 — MongoDB Atlas

MongoDB Atlas is used for flexible document-oriented supporting data:

- Notifications
- Mess feedback
- Activity logs

The same core relational entities are not duplicated into MongoDB.

## Decision 4 — Backend

FastAPI is the backend framework.

Reasons:

- REST API development
- Pydantic validation
- Dependency injection support
- Async support
- OpenAPI/Swagger documentation

## Decision 5 — Authentication

JWT authentication is used for API access.

Passwords must be securely hashed.

The role selected in the login UI is only an input; the backend verifies the actual role stored for the account.

## Decision 6 — Authorization

RBAC separates Student and Admin permissions.

Authorization is enforced on the backend, not only through frontend navigation.

## Decision 7 — Architecture

A modular monolith is used instead of implemented microservices.

Reason:

The project needs modular backend design and database/API concepts without unnecessary distributed-system complexity.

Future service separation can be documented as a scalability option.

## Decision 8 — Fees

No real payment gateway is implemented.

Fee status is simulated and managed as project data.

## Decision 9 — Room Allocation

Student initial room selection is immediate when a room has capacity.

No admin approval is required for initial selection.

Admin can directly allocate, remove, transfer, or override room assignments.

Room-change requests are a separate student-to-admin workflow.

## Decision 10 — Docker

Docker Compose is used where practical for reproducible local setup.

The target is a simple:

```bash
docker compose up
```

environment.

## Decision 11 — Documentation

Project documentation is committed to Git under `docs/`.

Secrets, credentials, tokens, and environment files are excluded using `.gitignore`.

## Decision 12 — Scope Control

Do not add unnecessary features simply because the course mentions them.

Kafka, Kubernetes, microservices, payment gateways, observability stacks, and vector/RAG features are not part of the current implementation unless explicitly added as a documented scope change.
