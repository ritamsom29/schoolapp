from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from ..database.session import Base

class Holiday(Base):
    __tablename__ = 'holidays'

    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    date = Column(Date, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
