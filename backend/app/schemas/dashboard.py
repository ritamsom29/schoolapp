from pydantic import BaseModel
from typing import List, Optional, Dict

class TopStats(BaseModel):
    total_students: int
    total_teachers: int
    total_classes: int
    present_today: int
    absent_today: int
    average_attendance: float
    low_attendance_count: int

class TrendItem(BaseModel):
    date: str
    present: int
    absent: int
    percentage: float

class ClassAttendanceItem(BaseModel):
    class_name: str
    present: int
    absent: int
    percentage: float

class LowAttendanceStudent(BaseModel):
    id: int
    student_id: str
    name: str
    class_name: Optional[str] = None
    section_name: Optional[str] = None
    percentage: float
    threshold: float
    status: str

class AdminDashboardStats(BaseModel):
    top_stats: TopStats
    attendance_trends: List[TrendItem]
    class_wise_attendance: List[ClassAttendanceItem]
    low_attendance_students: List[LowAttendanceStudent]

class AssignedClassStatus(BaseModel):
    class_id: int
    class_name: str
    section_id: int
    section_name: str
    total_students: int
    attendance_completed_today: bool

class TeacherDashboardStats(BaseModel):
    teacher_name: str
    teacher_id: str
    today_date: str
    assigned_classes: List[AssignedClassStatus]
    recent_activity: List[dict]
