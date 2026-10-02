from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database.session import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.auth.password import hash_password
from app.models.user import User
from app.models.teacher import Teacher
from app.models.academic import Class, Section, AcademicYear
from app.models.teacher_assignment import TeacherAssignment
from app.schemas.teacher import (
    TeacherCreate,
    TeacherUpdate,
    TeacherResponse,
    TeacherAssignmentResponse,
    AssignTeacherRequest,
)

router = APIRouter(prefix="/api/teachers", tags=["Teachers"])

def _format_teacher(teacher: Teacher) -> TeacherResponse:
    assignments = []
    for a in teacher.assignments:
        assignments.append(
            TeacherAssignmentResponse(
                id=a.id,
                class_id=a.class_id,
                class_name=a.class_.name if a.class_ else None,
                section_id=a.section_id,
                section_name=a.section.name if a.section else None,
                academic_year_id=a.academic_year_id,
                academic_year_name=a.academic_year.name if a.academic_year else None,
            )
        )
    return TeacherResponse(
        id=teacher.id,
        teacher_id=teacher.teacher_id,
        name=teacher.name,
        email=teacher.email,
        phone=teacher.phone,
        user_id=teacher.user_id,
        status=teacher.status,
        assignments=assignments,
        created_at=teacher.created_at,
        updated_at=teacher.updated_at,
    )

@router.get("", response_model=List[TeacherResponse])
def get_teachers(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Teacher).options(
        joinedload(Teacher.assignments).joinedload(TeacherAssignment.class_),
        joinedload(Teacher.assignments).joinedload(TeacherAssignment.section),
        joinedload(Teacher.assignments).joinedload(TeacherAssignment.academic_year),
    )
    if status_filter:
        query = query.filter(Teacher.status == status_filter)
    teachers = query.order_by(Teacher.name).all()
    return [_format_teacher(t) for t in teachers]

@router.get("/{id}", response_model=TeacherResponse)
def get_teacher(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    teacher = (
        db.query(Teacher)
        .options(
            joinedload(Teacher.assignments).joinedload(TeacherAssignment.class_),
            joinedload(Teacher.assignments).joinedload(TeacherAssignment.section),
            joinedload(Teacher.assignments).joinedload(TeacherAssignment.academic_year),
        )
        .filter(Teacher.id == id)
        .first()
    )
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return _format_teacher(teacher)

@router.post("", response_model=TeacherResponse, status_code=201)
def create_teacher(
    data: TeacherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(Teacher).filter(Teacher.teacher_id == data.teacher_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Teacher ID '{data.teacher_id}' already exists")

    user_id = None
    account_username = (data.username or (data.email.split("@")[0] if data.email else data.teacher_id.lower())).strip()
    account_email = data.email or f"{data.teacher_id.lower()}@school.internal"

    existing_user = db.query(User).filter(User.username == account_username).first()
    if existing_user:
        account_username = f"{account_username}_{data.teacher_id.lower()}"

    user = User(
        username=account_username,
        email=account_email,
        password_hash=hash_password(data.password or "teacher123"),
        role="teacher",
        is_active=True,
    )
    db.add(user)
    db.flush()
    user_id = user.id

    teacher = Teacher(
        teacher_id=data.teacher_id,
        name=data.name,
        email=data.email,
        phone=data.phone,
        user_id=user_id,
        status="active",
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    return _format_teacher(teacher)

@router.put("/{id}", response_model=TeacherResponse)
def update_teacher(
    id: int,
    data: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    teacher = db.query(Teacher).filter(Teacher.id == id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(teacher, field, val)

    db.commit()
    db.refresh(teacher)
    return _format_teacher(teacher)

@router.delete("/{id}")
def deactivate_teacher(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    teacher = db.query(Teacher).filter(Teacher.id == id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    teacher.status = "inactive"
    if teacher.user_id:
        u = db.query(User).filter(User.id == teacher.user_id).first()
        if u:
            u.is_active = False
    db.commit()
    return {"message": "Teacher deactivated successfully"}

# ── Teacher Assignments ──────────────────────────────────────────
@router.post("/assign", status_code=201)
def assign_teacher_to_class(
    data: AssignTeacherRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    teacher = db.query(Teacher).filter(Teacher.id == data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    cls = db.query(Class).filter(Class.id == data.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Class not found")

    sec = db.query(Section).filter(Section.id == data.section_id, Section.class_id == data.class_id).first()
    if not sec:
        raise HTTPException(status_code=400, detail="Invalid section for this class")

    ay_id = data.academic_year_id or cls.academic_year_id
    if not ay_id:
        active_ay = db.query(AcademicYear).filter(AcademicYear.is_active == True).first()
        ay_id = active_ay.id if active_ay else None

    if not ay_id:
        raise HTTPException(status_code=400, detail="Academic year could not be determined")

    existing = db.query(TeacherAssignment).filter(
        TeacherAssignment.teacher_id == data.teacher_id,
        TeacherAssignment.class_id == data.class_id,
        TeacherAssignment.section_id == data.section_id,
        TeacherAssignment.academic_year_id == ay_id,
    ).first()

    if existing:
        return {"message": "Teacher already assigned to this class and section", "id": existing.id}

    assignment = TeacherAssignment(
        teacher_id=data.teacher_id,
        class_id=data.class_id,
        section_id=data.section_id,
        academic_year_id=ay_id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return {"message": "Teacher assigned successfully", "id": assignment.id}

@router.delete("/assign/{assignment_id}")
def remove_teacher_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    assignment = db.query(TeacherAssignment).filter(TeacherAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment removed successfully"}
