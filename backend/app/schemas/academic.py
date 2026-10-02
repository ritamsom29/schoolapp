from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class AcademicYearCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_active: bool = False


class AcademicYearResponse(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClassCreate(BaseModel):
    name: str
    academic_year_id: Optional[int] = None


class ClassResponse(BaseModel):
    id: int
    name: str
    academic_year_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClassWithSectionsResponse(ClassResponse):
    sections: List["SectionResponse"] = []


class SectionCreate(BaseModel):
    name: str
    class_id: int


class SectionResponse(BaseModel):
    id: int
    name: str
    class_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
