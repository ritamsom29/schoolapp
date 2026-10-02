from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import math
from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse
from app.services import student_service

router = APIRouter(prefix="/api/students", tags=["Students"])

def _to_response(student) -> StudentResponse:
    return StudentResponse(
        id=student.id,
        student_id=student.student_id,
        admission_number=student.admission_number,
        name=student.name,
        photo=student.photo,
        date_of_birth=student.date_of_birth,
        gender=student.gender,
        class_id=student.class_id,
        section_id=student.section_id,
        class_name=student.class_.name if student.class_ else None,
        section_name=student.section.name if student.section else None,
        roll_number=student.roll_number,
        father_name=student.father_name,
        mother_name=student.mother_name,
        guardian_name=student.guardian_name,
        parent_phone=student.parent_phone,
        parent_email=student.parent_email,
        address=student.address,
        emergency_contact=student.emergency_contact,
        admission_date=student.admission_date,
        status=student.status,
        created_at=student.created_at,
        updated_at=student.updated_at,
    )

@router.post("", response_model=StudentResponse, status_code=201)
def create_student(
    data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    student = student_service.create_student(db, data)
    # Reload with relationships
    student = student_service.get_student(db, student.id)
    return _to_response(student)

@router.get("", response_model=StudentListResponse)
def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    section_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parsed_class_id = int(class_id) if class_id and class_id.strip().isdigit() else None
    parsed_section_id = int(section_id) if section_id and section_id.strip().isdigit() else None
    parsed_search = search.strip() if search and search.strip() else None
    parsed_status = status.strip() if status and status.strip() else None

    students, total = student_service.get_students(
        db, page=page, page_size=page_size,
        search=parsed_search, class_id=parsed_class_id,
        section_id=parsed_section_id, status_filter=parsed_status,
    )
    return StudentListResponse(
        students=[_to_response(s) for s in students],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = student_service.get_student(db, student_id)
    return _to_response(student)

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    student = student_service.update_student(db, student_id, data)
    student = student_service.get_student(db, student.id)
    return _to_response(student)

@router.delete("/{student_id}", response_model=StudentResponse)
def deactivate_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    student = student_service.deactivate_student(db, student_id)
    student = student_service.get_student(db, student.id)
    return _to_response(student)
