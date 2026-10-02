from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from datetime import date, timedelta

from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.academic import Class, Section
from app.models.attendance import Attendance
from app.models.school_settings import SchoolSettings
from app.models.teacher_assignment import TeacherAssignment
from app.schemas.dashboard import (
    AdminDashboardStats,
    TopStats,
    TrendItem,
    ClassAttendanceItem,
    LowAttendanceStudent,
    TeacherDashboardStats,
    AssignedClassStatus,
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/statistics", response_model=AdminDashboardStats)
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings = db.query(SchoolSettings).first()
    threshold = settings.attendance_threshold if settings else 75.0

    total_students = db.query(Student).filter(Student.status == "active").count()
    total_teachers = db.query(Teacher).filter(Teacher.status == "active").count()
    total_classes = db.query(Class).count()

    today = date.today()
    # Today attendance numbers (fallback to latest recorded date if today has none)
    today_records = db.query(Attendance).filter(Attendance.date == today).all()
    if not today_records:
        latest_date_row = db.query(Attendance.date).order_by(Attendance.date.desc()).first()
        if latest_date_row:
            today_records = db.query(Attendance).filter(Attendance.date == latest_date_row[0]).all()

    present_today = sum(1 for r in today_records if r.status in ("PRESENT", "LATE"))
    absent_today = sum(1 for r in today_records if r.status == "ABSENT")

    # Overall average calculation
    all_attendance = db.query(Attendance).all()
    total_records = len(all_attendance)
    total_present = sum(1 for r in all_attendance if r.status in ("PRESENT", "LATE"))
    average_attendance = round((total_present / total_records * 100), 2) if total_records > 0 else 0.0

    # Low attendance detection per active student
    low_attendance_students = []
    active_students = db.query(Student).options(
        joinedload(Student.class_), joinedload(Student.section)
    ).filter(Student.status == "active").all()

    for s in active_students:
        s_records = [r for r in all_attendance if r.student_id == s.id]
        if s_records:
            s_present = sum(1 for r in s_records if r.status in ("PRESENT", "LATE"))
            pct = round((s_present / len(s_records) * 100), 2)
            if pct < threshold:
                low_attendance_students.append(
                    LowAttendanceStudent(
                        id=s.id,
                        student_id=s.student_id,
                        name=s.name,
                        class_name=s.class_.name if s.class_ else None,
                        section_name=s.section.name if s.section else None,
                        percentage=pct,
                        threshold=threshold,
                        status=s.status,
                    )
                )

    # 7-day Attendance Trend
    distinct_dates = (
        db.query(Attendance.date)
        .distinct()
        .order_by(Attendance.date.desc())
        .limit(7)
        .all()
    )
    sorted_dates = sorted([d[0] for d in distinct_dates])
    attendance_trends = []
    for d in sorted_dates:
        day_records = [r for r in all_attendance if r.date == d]
        d_pres = sum(1 for r in day_records if r.status in ("PRESENT", "LATE"))
        d_abs = sum(1 for r in day_records if r.status == "ABSENT")
        d_tot = len(day_records)
        pct = round((d_pres / d_tot * 100), 1) if d_tot > 0 else 0.0
        attendance_trends.append(
            TrendItem(
                date=d.strftime("%b %d"),
                present=d_pres,
                absent=d_abs,
                percentage=pct,
            )
        )

    # Class-wise attendance comparison
    classes = db.query(Class).all()
    class_wise = []
    for cls in classes:
        cls_records = [r for r in all_attendance if r.class_id == cls.id]
        c_tot = len(cls_records)
        if c_tot > 0:
            c_pres = sum(1 for r in cls_records if r.status in ("PRESENT", "LATE"))
            c_abs = sum(1 for r in cls_records if r.status == "ABSENT")
            pct = round((c_pres / c_tot * 100), 1)
            class_wise.append(
                ClassAttendanceItem(
                    class_name=cls.name,
                    present=c_pres,
                    absent=c_abs,
                    percentage=pct,
                )
            )

    return AdminDashboardStats(
        top_stats=TopStats(
            total_students=total_students,
            total_teachers=total_teachers,
            total_classes=total_classes,
            present_today=present_today,
            absent_today=absent_today,
            average_attendance=average_attendance,
            low_attendance_count=len(low_attendance_students),
        ),
        attendance_trends=attendance_trends,
        class_wise_attendance=class_wise,
        low_attendance_students=low_attendance_students,
    )

@router.get("/teacher", response_model=TeacherDashboardStats)
def get_teacher_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=403, detail="Not associated with a teacher profile")

    assignments = (
        db.query(TeacherAssignment)
        .options(joinedload(TeacherAssignment.class_), joinedload(TeacherAssignment.section))
        .filter(TeacherAssignment.teacher_id == teacher.id)
        .all()
    )

    today = date.today()
    assigned_classes = []
    for a in assignments:
        stu_count = (
            db.query(Student)
            .filter(
                Student.class_id == a.class_id,
                Student.section_id == a.section_id,
                Student.status == "active",
            )
            .count()
        )
        today_att = (
            db.query(Attendance)
            .filter(
                Attendance.class_id == a.class_id,
                Attendance.section_id == a.section_id,
                Attendance.date == today,
            )
            .first()
        )
        assigned_classes.append(
            AssignedClassStatus(
                class_id=a.class_id,
                class_name=a.class_.name if a.class_ else f"Class {a.class_id}",
                section_id=a.section_id,
                section_name=a.section.name if a.section else f"Sec {a.section_id}",
                total_students=stu_count,
                attendance_completed_today=today_att is not None,
            )
        )

    return TeacherDashboardStats(
        teacher_name=teacher.name,
        teacher_id=teacher.teacher_id,
        today_date=today.strftime("%A, %d %B %Y"),
        assigned_classes=assigned_classes,
        recent_activity=[],
    )
