from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import date
import calendar

from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.holiday import Holiday
from app.models.school_settings import SchoolSettings
from app.models.student import Student
from app.models.academic import Class, Section
from app.models.attendance import Attendance
from app.schemas.holiday_reports import (
    HolidayCreate,
    HolidayResponse,
    MonthlyReportResponse,
    StudentMonthlyAttendance,
)
from app.reports.pdf_generator import generate_pdf_report
from app.reports.excel_generator import generate_excel_report

router = APIRouter(prefix="/api", tags=["Holidays & Reports"])

# ── Holidays ───────────────────────────────────────────────────
@router.get("/holidays", response_model=List[HolidayResponse])
def get_holidays(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Holiday).order_by(Holiday.date.asc()).all()

@router.post("/holidays", response_model=HolidayResponse, status_code=201)
def create_holiday(
    data: HolidayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(Holiday).filter(Holiday.date == data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="A holiday on this date is already recorded")
    
    hol = Holiday(**data.model_dump())
    db.add(hol)
    db.commit()
    db.refresh(hol)
    return hol

@router.delete("/holidays/{id}")
def delete_holiday(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    hol = db.query(Holiday).filter(Holiday.id == id).first()
    if not hol:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(hol)
    db.commit()
    return {"message": "Holiday deleted successfully"}

# ── Monthly Attendance Dynamic Calculation ────────────────────
@router.get("/reports/monthly", response_model=MonthlyReportResponse)
def get_monthly_attendance_report(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    class_id: int = Query(...),
    section_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cls = db.query(Class).filter(Class.id == class_id).first()
    sec = db.query(Section).filter(Section.id == section_id).first()
    if not cls or not sec:
        raise HTTPException(status_code=404, detail="Class or Section not found")

    settings = db.query(SchoolSettings).first()
    threshold = settings.attendance_threshold if settings else 75.0

    # Calculate month date range
    num_days = calendar.monthrange(year, month)[1]
    start_date = date(year, month, 1)
    end_date = date(year, month, num_days)

    # 1. Fetch holidays in this month
    holidays = db.query(Holiday).filter(
        Holiday.date >= start_date,
        Holiday.date <= end_date
    ).all()
    holiday_dates = {h.date for h in holidays}

    # 2. Determine potential working days (Mon-Fri and not holiday)
    working_days = 0
    cur = start_date
    while cur <= end_date:
        if cur.weekday() < 5 and cur not in holiday_dates:
            working_days += 1
        cur = cur.replace(day=cur.day + 1) if cur.day < num_days else end_date + calendar.sys.modules['datetime'].timedelta(days=1)

    # 3. Fetch attendance records for this class & section in the month
    att_records = db.query(Attendance).filter(
        Attendance.class_id == class_id,
        Attendance.section_id == section_id,
        Attendance.date >= start_date,
        Attendance.date <= end_date,
    ).all()

    # If attendance was taken on days, determine actual working days conducted so far
    distinct_dates_recorded = {r.date for r in att_records}
    actual_working_days = len(distinct_dates_recorded) if distinct_dates_recorded else working_days

    # 4. Fetch students
    students = db.query(Student).filter(
        Student.class_id == class_id,
        Student.section_id == section_id,
        Student.status == "active",
    ).order_by(Student.roll_number.asc(), Student.name.asc()).all()

    student_stats = []
    total_pct_sum = 0.0
    low_count = 0

    for s in students:
        s_recs = [r for r in att_records if r.student_id == s.id]
        present = sum(1 for r in s_recs if r.status in ("PRESENT", "LATE"))
        absent = sum(1 for r in s_recs if r.status == "ABSENT")
        leave = sum(1 for r in s_recs if r.status == "LEAVE")
        late = sum(1 for r in s_recs if r.status == "LATE")

        # Dynamic Formula: (Present Days / Working Days) * 100
        effective_days = actual_working_days if actual_working_days > 0 else 1
        pct = round((present / effective_days * 100), 2)
        if pct > 100.0:
            pct = 100.0

        is_low = pct < threshold
        if is_low:
            low_count += 1
        total_pct_sum += pct

        student_stats.append(
            StudentMonthlyAttendance(
                student_id=s.id,
                student_code=s.student_id,
                admission_number=s.admission_number,
                roll_number=s.roll_number,
                student_name=s.name,
                working_days=actual_working_days,
                present=present,
                absent=absent,
                leave=leave,
                late=late,
                percentage=pct,
                is_low_attendance=is_low,
            )
        )

    avg_attendance = round((total_pct_sum / len(students)), 2) if students else 0.0

    return MonthlyReportResponse(
        year=year,
        month=month,
        month_name=calendar.month_name[month],
        class_id=cls.id,
        class_name=cls.name,
        section_id=sec.id,
        section_name=sec.name,
        total_working_days=actual_working_days,
        threshold=threshold,
        students=student_stats,
        average_attendance=avg_attendance,
        low_attendance_count=low_count,
    )

@router.get("/reports/monthly/pdf")
def download_monthly_pdf(
    year: int = Query(...),
    month: int = Query(...),
    class_id: int = Query(...),
    section_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report_data = get_monthly_attendance_report(year, month, class_id, section_id, db, current_user).model_dump()
    settings = db.query(SchoolSettings).first()
    school_info = {
        "school_name": settings.school_name if settings else "School Attendance System",
        "address": settings.address if settings else "",
        "phone": settings.phone if settings else "",
        "email": settings.email if settings else "",
    }
    pdf_buffer = generate_pdf_report(report_data, school_info)
    filename = f"Attendance_{report_data['class_name']}_{report_data['section_name']}_{report_data['month_name']}_{year}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/reports/monthly/excel")
def download_monthly_excel(
    year: int = Query(...),
    month: int = Query(...),
    class_id: int = Query(...),
    section_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report_data = get_monthly_attendance_report(year, month, class_id, section_id, db, current_user).model_dump()
    settings = db.query(SchoolSettings).first()
    school_info = {
        "school_name": settings.school_name if settings else "School Attendance System",
    }
    excel_buffer = generate_excel_report(report_data, school_info)
    filename = f"Attendance_{report_data['class_name']}_{report_data['section_name']}_{report_data['month_name']}_{year}.xlsx"

    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
