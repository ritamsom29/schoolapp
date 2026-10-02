from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from ..database.session import Base

class TeacherAssignment(Base):
    __tablename__ = 'teacher_assignments'
    __table_args__ = (
        UniqueConstraint('teacher_id', 'class_id', 'section_id', 'academic_year_id'),
    )

    id = Column(Integer, primary_key=True)
    teacher_id = Column(Integer, ForeignKey('teachers.id'), nullable=False)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    section_id = Column(Integer, ForeignKey('sections.id'), nullable=False)
    academic_year_id = Column(Integer, ForeignKey('academic_years.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("Teacher", back_populates="assignments")
    class_ = relationship("Class", back_populates="teacher_assignments")
    section = relationship("Section", back_populates="teacher_assignments")
    academic_year = relationship("AcademicYear", back_populates="teacher_assignments")
