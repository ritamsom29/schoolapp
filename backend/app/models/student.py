from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..database.session import Base

class Student(Base):
    __tablename__ = 'students'

    id = Column(Integer, primary_key=True)
    student_id = Column(String(50), unique=True, nullable=False, index=True)
    admission_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    photo = Column(String(500), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=True)
    section_id = Column(Integer, ForeignKey('sections.id'), nullable=True)
    roll_number = Column(String(20), nullable=True)
    father_name = Column(String(200), nullable=True)
    mother_name = Column(String(200), nullable=True)
    guardian_name = Column(String(200), nullable=True)
    parent_phone = Column(String(20), nullable=True)
    parent_email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String(20), nullable=True)
    admission_date = Column(Date, nullable=True)
    status = Column(String(20), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_ = relationship("Class", back_populates="students")
    section = relationship("Section", back_populates="students")
    attendance_records = relationship("Attendance", back_populates="student")
