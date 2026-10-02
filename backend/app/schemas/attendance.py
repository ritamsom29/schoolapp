from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

class AttendanceItem(BaseModel):
    student_id: int
    status: str  # PRESENT, ABSENT, LEAVE, LATE

class AttendanceBatchCreate(BaseModel):
    class_id: int
    section_id: int
    date: date
    records: List[AttendanceItem]

class AttendanceUpdate(BaseModel):
    status: str

class AttendanceRecordResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    student_code: Optional[str] = None
    class_id: int
    class_name: Optional[str] = None
    section_id: int
    section_name: Optional[str] = None
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    date: date
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudentAttendanceStats(BaseModel):
    student_id: int
    student_name: str
    roll_number: Optional[str] = None
    total_days: int
    present: int
    absent: int
    leave: int
    late: int
    percentage: float
