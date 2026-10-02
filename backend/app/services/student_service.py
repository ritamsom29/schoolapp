from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, Tuple, List
from app.models.student import Student
from app.models.academic import Class, Section
from app.schemas.student import StudentCreate, StudentUpdate
from fastapi import HTTPException, status
import math

def create_student(db: Session, data: StudentCreate) -> Student:
    # Check unique student_id
    existing = db.query(Student).filter(Student.student_id == data.student_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Student ID '{data.student_id}' already exists")
    # Check unique admission_number
    existing = db.query(Student).filter(Student.admission_number == data.admission_number).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Admission number '{data.admission_number}' already exists")
    # Validate class_id and section_id exist if provided
    if data.class_id:
        cls = db.query(Class).filter(Class.id == data.class_id).first()
        if not cls:
            raise HTTPException(status_code=400, detail="Invalid class ID")
    if data.section_id:
        sec = db.query(Section).filter(Section.id == data.section_id).first()
        if not sec:
            raise HTTPException(status_code=400, detail="Invalid section ID")
    
    student = Student(**data.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

def get_student(db: Session, student_id: int) -> Student:
    student = db.query(Student).options(
        joinedload(Student.class_), joinedload(Student.section)
    ).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

def get_students(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    class_id: Optional[int] = None,
    section_id: Optional[int] = None,
    status_filter: Optional[str] = None,
) -> Tuple[List[Student], int]:
    query = db.query(Student)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Student.name.ilike(search_term),
                Student.student_id.ilike(search_term),
                Student.admission_number.ilike(search_term),
                Student.roll_number.ilike(search_term),
            )
        )
    
    if class_id:
        query = query.filter(Student.class_id == class_id)
    if section_id:
        query = query.filter(Student.section_id == section_id)
    if status_filter:
        query = query.filter(Student.status == status_filter)
    
    total = query.count()
    
    query = query.options(
        joinedload(Student.class_), joinedload(Student.section)
    )
    
    students = query.order_by(Student.name).offset((page - 1) * page_size).limit(page_size).all()
    return students, total

def update_student(db: Session, student_id: int, data: StudentUpdate) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)
    
    db.commit()
    db.refresh(student)
    return student

def deactivate_student(db: Session, student_id: int) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.status = "inactive"
    db.commit()
    db.refresh(student)
    return student
