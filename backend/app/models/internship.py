from sqlalchemy import Column, String, Text, JSON
from app.database import Base


class Internship(Base):
    __tablename__ = "internships"

    internship_id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    required_skills = Column(JSON, nullable=False, default=list)
    preferred_skills = Column(JSON, nullable=True, default=list)
    responsibilities = Column(JSON, nullable=True, default=list)
    requirements = Column(JSON, nullable=True, default=list)
    education_requirements = Column(Text, nullable=True)
    experience_requirements = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    work_mode = Column(String(100), nullable=True, default="Remote")
    duration = Column(String(100), nullable=True)
    stipend = Column(String(100), nullable=True)
