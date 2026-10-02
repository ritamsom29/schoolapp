from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class TeacherCreate(BaseModel):
    teacher_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = "teacher123"

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None

class TeacherAssignmentResponse(BaseModel):
    id: int
    class_id: int
    class_name: Optional[str] = None
    section_id: int
    section_name: Optional[str] = None
    academic_year_id: int
    academic_year_name: Optional[str] = None

    class Config:
        from_attributes = True

class TeacherResponse(BaseModel):
    id: int
    teacher_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    user_id: Optional[int] = None
    status: str
    assignments: List[TeacherAssignmentResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AssignTeacherRequest(BaseModel):
    teacher_id: int
    class_id: int
    section_id: int
    academic_year_id: Optional[int] = None
