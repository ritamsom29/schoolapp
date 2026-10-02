from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class HolidayCreate(BaseModel):
    name: str
    date: date
    description: Optional[str] = None

class HolidayResponse(BaseModel):
    id: int
    name: str
    date: date
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class StudentMonthlyAttendance(BaseModel):
    student_id: int
    student_code: str
    admission_number: str
    roll_number: Optional[str] = None
    student_name: str
    working_days: int
    present: int
    absent: int
    leave: int
    late: int
    percentage: float
    is_low_attendance: bool

class MonthlyReportResponse(BaseModel):
    year: int
    month: int
    month_name: str
    class_id: int
    class_name: str
    section_id: int
    section_name: str
    total_working_days: int
    threshold: float
    students: List[StudentMonthlyAttendance]
    average_attendance: float
    low_attendance_count: int
