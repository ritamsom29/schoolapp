from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from ..database.session import Base

class Attendance(Base):
    __tablename__ = 'attendance'
    __table_args__ = (
        UniqueConstraint('student_id', 'date', name='uq_student_date'),
        Index('ix_attendance_class_section_date', 'class_id', 'section_id', 'date'),
    )

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey('students.id'), nullable=False)
    teacher_id = Column(Integer, ForeignKey('teachers.id'), nullable=True)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    section_id = Column(Integer, ForeignKey('sections.id'), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="attendance_records")
    teacher = relationship("Teacher")
    class_ = relationship("Class", back_populates="attendance_records")
    section = relationship("Section", back_populates="attendance_records")
