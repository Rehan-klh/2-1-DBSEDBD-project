from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base
from backend.app.mongodb import mongo_db
from backend.app.routers import (
    auth, students, hostels, rooms, allocations, room_changes,
    leave, complaints, mess, fees, visitors, announcements,
    notifications, activity_logs
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize PostgreSQL tables
    Base.metadata.create_all(bind=engine)
    # Ensure database is seeded with initial demo data if empty
    from backend.app.seed import seed_database
    seed_database(force_reseed=False)
    # Initialize MongoDB connection
    mongo_db.connect()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all 14 routers with /api prefix
api_prefix = settings.API_PREFIX

app.include_router(auth.router, prefix=api_prefix)
app.include_router(students.router, prefix=api_prefix)
app.include_router(hostels.router, prefix=api_prefix)
app.include_router(rooms.router, prefix=api_prefix)
app.include_router(allocations.router, prefix=api_prefix)
app.include_router(room_changes.router, prefix=api_prefix)
app.include_router(leave.router, prefix=api_prefix)
app.include_router(complaints.router, prefix=api_prefix)
app.include_router(mess.router, prefix=api_prefix)
app.include_router(fees.router, prefix=api_prefix)
app.include_router(visitors.router, prefix=api_prefix)
app.include_router(announcements.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(activity_logs.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "message": "Hostel & Mess Management System API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "database": "connected",
        "mongodb_storage": "MongoDB Atlas" if mongo_db.is_atlas else "In-Memory Fallback (Dev/Test)"
    }
