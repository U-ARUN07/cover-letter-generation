from datetime import datetime
from sqlalchemy import Column, String, Text, JSON, DateTime
from app.database import Base


class GeneratedCoverLetter(Base):
    __tablename__ = "generated_cover_letters"

    cover_letter_id = Column(String(64), primary_key=True, index=True)
    candidate_id = Column(String(128), nullable=True, index=True)
    candidate_name = Column(String(255), nullable=True)
    internship_id = Column(String(64), nullable=False, index=True)
    internship_title = Column(String(255), nullable=True)
    company_name = Column(String(255), nullable=True)
    cover_letter_content = Column(Text, nullable=False)
    matching_skills = Column(JSON, nullable=False, default=list)
    relevant_projects = Column(JSON, nullable=False, default=list)
    relevant_experience = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
