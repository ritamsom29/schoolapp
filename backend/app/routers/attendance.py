from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime

from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_teacher, require_admin
from app.models.user import User
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.academic import Class, Section
from app.models.teacher_assignment import TeacherAssignment
from app.models.attendance import Attendance
from app.schemas.attendance import (
    AttendanceBatchCreate,
    AttendanceUpdate,
    AttendanceRecordResponse,
    StudentAttendanceStats,
)

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

def _format_record(r: Attendance) -> AttendanceRecordResponse:
    return AttendanceRecordResponse(
        id=r.id,
        student_id=r.student_id,
        student_name=r.student.name if r.student else None,
        roll_number=r.student.roll_number if r.student else None,
        student_code=r.student.student_id if r.student else None,
        class_id=r.class_id,
        class_name=r.class_.name if r.class_ else None,
        section_id=r.section_id,
        section_name=r.section.name if r.section else None,
        teacher_id=r.teacher_id,
        teacher_name=r.teacher.name if r.teacher else None,
        date=r.date,
        status=r.status,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )

@router.post("", status_code=201)
def submit_attendance(
    data: AttendanceBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher),
):
    # Verify class and section exist
    cls = db.query(Class).filter(Class.id == data.class_id).first()
    sec = db.query(Section).filter(Section.id == data.section_id, Section.class_id == data.class_id).first()
    if not cls or not sec:
        raise HTTPException(status_code=400, detail="Invalid class or section")

    teacher_id = None
    if current_user.role == "teacher":
        teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
        if not teacher:
            raise HTTPException(status_code=403, detail="No teacher profile associated with this account")
        teacher_id = teacher.id

        # Verify teacher is assigned to this class and section
        assignment = db.query(TeacherAssignment).filter(
            TeacherAssignment.teacher_id == teacher.id,
            TeacherAssignment.class_id == data.class_id,
            TeacherAssignment.section_id == data.section_id,
        ).first()
        if not assignment:
            raise HTTPException(status_code=403, detail="You are not assigned to this class and section")

    if not data.records:
        raise HTTPException(status_code=400, detail="No attendance records submitted")

    # Check for existing records for this class, section and date
    existing_any = db.query(Attendance).filter(
        Attendance.class_id == data.class_id,
        Attendance.section_id == data.section_id,
        Attendance.date == data.date,
    ).first()
    if existing_any:
        raise HTTPException(
            status_code=400, 
            detail="Attendance has already been recorded for this class and date."
        )

    # Validate all students belong to the class and section
    submitted_student_ids = [item.student_id for item in data.records]
    valid_students = db.query(Student).filter(
        Student.id.in_(submitted_student_ids),
        Student.class_id == data.class_id,
        Student.section_id == data.section_id,
        Student.status == "active",
    ).all()
    valid_id_set = {s.id for s in valid_students}

    if len(valid_id_set) != len(submitted_student_ids):
        raise HTTPException(status_code=400, detail="Some students do not belong to this class/section or are inactive")

    # Save attendance records
    created_records = []
    for item in data.records:
        rec = Attendance(
            student_id=item.student_id,
            teacher_id=teacher_id,
            class_id=data.class_id,
            section_id=data.section_id,
            date=data.date,
            status=item.status.upper(),
        )
        db.add(rec)
        created_records.append(rec)

    db.commit()
    return {
        "message": "Attendance submitted successfully.",
        "count": len(created_records),
    }

@router.get("", response_model=List[AttendanceRecordResponse])
def get_attendance(
    class_id: Optional[int] = None,
    section_id: Optional[int] = None,
    date_val: Optional[date] = Query(None, alias="date"),
    student_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Attendance).options(
        joinedload(Attendance.student),
        joinedload(Attendance.class_),
        joinedload(Attendance.section),
        joinedload(Attendance.teacher),
    )

    if class_id:
        query = query.filter(Attendance.class_id == class_id)
    if section_id:
        query = query.filter(Attendance.section_id == section_id)
    if date_val:
        query = query.filter(Attendance.date == date_val)
    if student_id:
        query = query.filter(Attendance.student_id == student_id)
    if teacher_id:
        query = query.filter(Attendance.teacher_id == teacher_id)
    if status_filter:
        query = query.filter(Attendance.status == status_filter.upper())

    records = query.order_by(Attendance.date.desc(), Attendance.id.asc()).limit(500).all()
    return [_format_record(r) for r in records]

@router.put("/{id}", response_model=AttendanceRecordResponse)
def update_attendance_record(
    id: int,
    data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    record = db.query(Attendance).options(
        joinedload(Attendance.student),
        joinedload(Attendance.class_),
        joinedload(Attendance.section),
        joinedload(Attendance.teacher),
    ).filter(Attendance.id == id).first()

    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    record.status = data.status.upper()
    record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return _format_record(record)

@router.get("/student/{student_id}", response_model=StudentAttendanceStats)
def get_student_attendance_summary(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    records = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    total = len(records)
    present = sum(1 for r in records if r.status == "PRESENT")
    absent = sum(1 for r in records if r.status == "ABSENT")
    leave = sum(1 for r in records if r.status == "LEAVE")
    late = sum(1 for r in records if r.status == "LATE")

    pct = round((present / total * 100), 2) if total > 0 else 0.0

    return StudentAttendanceStats(
        student_id=student.id,
        student_name=student.name,
        roll_number=student.roll_number,
        total_days=total,
        present=present,
        absent=absent,
        leave=leave,
        late=late,
        percentage=pct,
    )
