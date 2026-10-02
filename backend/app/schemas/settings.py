from pydantic import BaseModel
from typing import Optional

class SchoolSettingsUpdate(BaseModel):
    school_name: Optional[str] = None
    logo: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    attendance_threshold: Optional[float] = None
    academic_year_id: Optional[int] = None

class SchoolSettingsResponse(BaseModel):
    id: int
    school_name: str
    logo: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    attendance_threshold: float
    academic_year_id: Optional[int] = None

    class Config:
        from_attributes = True
