# Setup Guide

## Prerequisites

Install:

- Node.js (v18+)
- npm
- Python (v3.10+)
- PostgreSQL 15+ (or Docker)
- Docker Desktop (recommended)
- MongoDB Atlas account (URI configured in `.env`)
- Git

## Repository Structure

```text
hostel-mess-management/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── mongodb.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   └── seed.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_allocations.py
│   │   ├── test_auth.py
│   │   ├── test_room_changes.py
│   │   └── test_workflows.py
│   ├── Dockerfile
│   └── requirements.txt
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_DESIGN.md
│   ├── ER_DIAGRAM.md
│   ├── PROJECT_DECISIONS.md
│   ├── SETUP.md
│   └── TESTING.md
├── src/
│   ├── api/client.js
│   ├── components/
│   ├── pages/
│   │   ├── admin/
│   │   ├── student/
│   │   └── LoginPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── docker-compose.yml
├── Dockerfile.frontend
├── nginx.conf
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

Secrets must be stored in `.env` files and must never be committed.

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

Sample `.env`:

```env
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/hostel_db
MONGODB_URI=
MONGODB_DB_NAME=hostel_mess_db
JWT_SECRET=your_strong_random_jwt_secret_key_min_32_chars
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000
VITE_API_URL=http://localhost:8000/api
```

> **Security & Configuration Notes**:
> - **.env Placement**: The `.env` file belongs in the project root. It is automatically detected by `config.py`, `start.bat`, and `docker-compose.yml`.
> - **JWT_SECRET**: Required in non-test configurations. The application will fail startup if `JWT_SECRET` is missing or empty.
> - **MongoDB Atlas**: When `MONGODB_URI` is provided, the backend verifies connectivity on startup. If the Atlas cluster is unreachable (bad URI, network down, IP not whitelisted in Atlas Network Access), the app will raise a `ConnectionError` on startup rather than silently masking connectivity problems. To develop offline without an Atlas instance, leave `MONGODB_URI` empty to engage the in-memory fallback.
> - **CORS Origins**: Wildcard origins (`*`) are disallowed. Only explicit origins are permitted, configurable via the `CORS_ORIGINS` environment variable.


## Local Development

### 1. Backend

1. Install Python dependencies:
```bash
pip install -r backend/requirements.txt
```

2. Initialize `.env` (if not done yet):
```bash
cp .env.example .env
```

3. Seed initial admin, students, hostel blocks, rooms, mess menu, and sample data:
```bash
python -m backend.app.seed
```

3. Start the FastAPI server:
```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI is available at: `http://localhost:8000/docs`

4. Run automated test suite:
```bash
python -m pytest backend/tests -v
```

### 2. Frontend

1. Install npm dependencies:
```bash
npm install
```

2. Start the Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

3. Run linting and production build verification:
```bash
npm run lint
npm run build
```

## Docker Compose

To start the full-stack system with a single command:

```bash
docker compose up --build
```

The Docker Compose setup starts:
- **PostgreSQL**: Port `5432` with automated health check
- **FastAPI Backend**: Port `8000` with automated database seeding
- **React Frontend**: Port `5173` served via Nginx reverse proxy

## Default Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@klh.edu.in` | `Admin@123` |
| Student | `student@klh.edu.in` / `aarav.sharma@klh.edu.in` | `Student@123` |
| Student | `meera.iyer@klh.edu.in` | `Student@123` |
| Student | `nisha.khan@klh.edu.in` | `Student@123` |
| Student | `kiran.reddy@klh.edu.in` | `Student@123` |

## Troubleshooting

- **Role Mismatch on Login**: The backend validates that the role chosen in the login selector matches the account's database role (`STUDENT` or `ADMIN`).
- **PostgreSQL Connection**: Ensure the PostgreSQL service is active and `DATABASE_URL` matches credentials.
- **MongoDB Connection**: If `MONGODB_URI` is unconfigured, the application gracefully stores notifications, mess feedback, and activity logs in-memory for testing.
