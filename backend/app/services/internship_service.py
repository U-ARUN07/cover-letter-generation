import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.internship import Internship
from app.schemas.internship import InternshipCreate

logger = logging.getLogger(__name__)


class InternshipService:
    @staticmethod
    def get_all(
        db: Session,
        query: Optional[str] = None,
        work_mode: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Internship]:
        """Retrieve internships with optional keyword search and filtering."""
        q = db.query(Internship)

        if query:
            search_filter = f"%{query.strip()}%"
            q = q.filter(
                or_(
                    Internship.title.ilike(search_filter),
                    Internship.company.ilike(search_filter),
                    Internship.description.ilike(search_filter),
                    Internship.location.ilike(search_filter)
                )
            )

        if work_mode and work_mode.lower() != "all":
            q = q.filter(Internship.work_mode.ilike(f"%{work_mode.strip()}%"))

        return q.offset(offset).limit(limit).all()

    @staticmethod
    def count(
        db: Session,
        query: Optional[str] = None,
        work_mode: Optional[str] = None
    ) -> int:
        """Count total matching internships."""
        q = db.query(Internship)

        if query:
            search_filter = f"%{query.strip()}%"
            q = q.filter(
                or_(
                    Internship.title.ilike(search_filter),
                    Internship.company.ilike(search_filter),
                    Internship.description.ilike(search_filter),
                    Internship.location.ilike(search_filter)
                )
            )

        if work_mode and work_mode.lower() != "all":
            q = q.filter(Internship.work_mode.ilike(f"%{work_mode.strip()}%"))

        return q.count()

    @staticmethod
    def get_by_id(db: Session, internship_id: str) -> Optional[Internship]:
        """Fetch a specific internship by ID."""
        return db.query(Internship).filter(Internship.internship_id == internship_id).first()

    @staticmethod
    def create(db: Session, data: InternshipCreate) -> Internship:
        """Create a new internship record."""
        internship = Internship(
            internship_id=data.internship_id,
            title=data.title,
            company=data.company,
            description=data.description,
            required_skills=data.required_skills,
            preferred_skills=data.preferred_skills,
            responsibilities=data.responsibilities,
            requirements=data.requirements,
            education_requirements=data.education_requirements,
            experience_requirements=data.experience_requirements,
            location=data.location,
            work_mode=data.work_mode,
            duration=data.duration,
            stipend=data.stipend
        )
        db.add(internship)
        db.commit()
        db.refresh(internship)
        return internship
