import json
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.config import settings

logger = logging.getLogger(__name__)

# Engine configuration (compatible with PostgreSQL and SQLite)
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides an independent database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all database tables and seed sample internships if empty."""
    from app.models.internship import Internship
    from app.models.cover_letter import GeneratedCoverLetter

    Base.metadata.create_all(bind=engine)

    # Seed sample internships if table is empty
    with SessionLocal() as db:
        count = db.query(Internship).count()
        if count == 0:
            sample_file = settings.DATA_DIR / "sample_internships.json"
            if sample_file.exists():
                try:
                    with open(sample_file, "r", encoding="utf-8") as f:
                        internships_data = json.load(f)
                        for item in internships_data:
                            internship = Internship(
                                internship_id=item["internship_id"],
                                title=item["title"],
                                company=item["company"],
                                description=item.get("description", ""),
                                required_skills=item.get("required_skills", []),
                                preferred_skills=item.get("preferred_skills", []),
                                responsibilities=item.get("responsibilities", []),
                                requirements=item.get("requirements", []),
                                education_requirements=item.get("education_requirements", ""),
                                experience_requirements=item.get("experience_requirements", ""),
                                location=item.get("location", ""),
                                work_mode=item.get("work_mode", "Remote"),
                                duration=item.get("duration", ""),
                                stipend=item.get("stipend", "")
                            )
                            db.add(internship)
                        db.commit()
                        logger.info(f"Successfully seeded {len(internships_data)} sample internships.")
                except Exception as e:
                    logger.error(f"Failed to seed sample internships: {e}")
                    db.rollback()
