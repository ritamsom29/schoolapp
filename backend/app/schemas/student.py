from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class StudentCreate(BaseModel):
    student_id: str = Field(..., min_length=1, max_length=50)
    admission_number: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    photo: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    class_id: Optional[int] = None
    section_id: Optional[int] = None
    roll_number: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    admission_date: Optional[date] = None
    status: str = "active"

class StudentUpdate(BaseModel):
    # All optional for partial updates
    name: Optional[str] = None
    photo: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    class_id: Optional[int] = None
    section_id: Optional[int] = None
    roll_number: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    admission_date: Optional[date] = None
    status: Optional[str] = None

class StudentResponse(BaseModel):
    id: int
    student_id: str
    admission_number: str
    name: str
    photo: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    class_id: Optional[int] = None
    section_id: Optional[int] = None
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    roll_number: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    guardian_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    admission_date: Optional[date] = None
    status: str = "active"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudentListResponse(BaseModel):
    students: List[StudentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
