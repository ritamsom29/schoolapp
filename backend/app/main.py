from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database.init_db import init_db
from app.routers import auth, students, academic, teachers, attendance, dashboard, holidays_reports
from app.routers import settings as settings_router

settings = get_settings()

app = FastAPI(
    title="School Attendance Management System",
    description="Complete school attendance management with student registration, teacher management, and attendance tracking.",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Include routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(academic.router)
app.include_router(teachers.router)
app.include_router(attendance.router)
app.include_router(dashboard.router)
app.include_router(holidays_reports.router)
app.include_router(settings_router.router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "School Attendance Management System API"}
