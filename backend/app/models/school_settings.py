from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database.session import Base

class SchoolSettings(Base):
    __tablename__ = 'school_settings'

    id = Column(Integer, primary_key=True)
    school_name = Column(String(300), nullable=False, default='School Name')
    logo = Column(String(500), nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    attendance_threshold = Column(Float, default=75.0)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    academic_year = relationship("AcademicYear", back_populates="school_settings")
