from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from ..database.session import Base

class AcademicYear(Base):
    __tablename__ = 'academic_years'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    classes = relationship("Class", back_populates="academic_year")
    school_settings = relationship("SchoolSettings", back_populates="academic_year")
    teacher_assignments = relationship("TeacherAssignment", back_populates="academic_year")

class Class(Base):
    __tablename__ = 'classes'
    __table_args__ = (UniqueConstraint('name', 'academic_year_id'),)

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    academic_year = relationship("AcademicYear", back_populates="classes")
    sections = relationship("Section", back_populates="class_")
    students = relationship("Student", back_populates="class_")
    attendance_records = relationship("Attendance", back_populates="class_")
    teacher_assignments = relationship("TeacherAssignment", back_populates="class_")

class Section(Base):
    __tablename__ = 'sections'
    __table_args__ = (UniqueConstraint('name', 'class_id'),)

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_ = relationship("Class", back_populates="sections")
    students = relationship("Student", back_populates="section")
    attendance_records = relationship("Attendance", back_populates="section")
    teacher_assignments = relationship("TeacherAssignment", back_populates="section")
