import sys
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import MagicMock

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_path))

from app.database import Base
from app.services.resume_service import ResumeService
from app.services.internship_service import InternshipService
from app.schemas.internship import InternshipCreate
from app.schemas.resume import ResumeData, EducationItem, ExperienceItem, ProjectItem

# In-memory SQLite for isolated, ultra-fast tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    Base.metadata.create_all(bind=engine)
    ResumeService.initialize_registry()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Provides a clean transactional database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed test internship
    existing = session.query(Base.metadata.tables["internships"]).count()
    if existing == 0:
        InternshipService.create(session, InternshipCreate(
            internship_id="INT-TEST-001",
            title="Full Stack AI Intern",
            company="Infosys Limited",
            description="Build scalable AI-powered web applications using FastAPI and React.",
            required_skills=["Python", "FastAPI", "React", "SQL"],
            preferred_skills=["Docker", "LangChain", "PostgreSQL"],
            responsibilities=["Develop backend APIs", "Build frontend components"],
            requirements=["Degree in Computer Science"],
            location="Bengaluru, India",
            work_mode="Hybrid",
            duration="6 Months",
            stipend="₹30,000 / month"
        ))

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def sample_resume():
    return ResumeData(
        candidate_id="CAND-TEST-001",
        candidate_name="Test Applicant",
        email="applicant@example.com",
        phone="+91 9876543210",
        summary="Passionate developer skilled in Python, FastAPI, and React.",
        skills=["Python", "FastAPI", "React", "PostgreSQL", "Git"],
        education=[
            EducationItem(degree="B.Tech Computer Science", institution="Test University", graduation_year="2025")
        ],
        experience=[
            ExperienceItem(title="Junior Developer Intern", company="Acme Corp", duration="3 months", description="Built APIs using Python and FastAPI")
        ],
        projects=[
            ProjectItem(name="Smart Cover Letter App", description="AI agent for personalized cover letters", technologies=["Python", "FastAPI", "React"])
        ],
        certifications=["Infosys Springboard Certified"],
        achievements=["Dean's List 2024"]
    )


@pytest.fixture
def mock_llm_chain(monkeypatch):
    """Mocks LangChain LLM generation so tests run deterministically without real API calls."""
    letter_text = (
        "Dear Hiring Team at Infosys Limited,\n\n"
        "I am writing to express my enthusiastic interest in the Full Stack AI Intern role at Infosys Limited. "
        "With my proven foundation in Python, FastAPI, and React, combined with hands-on project experience "
        "building the Smart Cover Letter App, I am eager to contribute effectively to your development initiatives.\n\n"
        "Throughout my academic and internship experience at Acme Corp, I designed asynchronous RESTful APIs "
        "and connected user interfaces with clean state management. My technical expertise closely aligns with your "
        "core requirements for backend API development.\n\n"
        "Thank you for your time and consideration. I look forward to the possibility of discussing how my skills "
        "can support Infosys Limited's objectives.\n\n"
        "Sincerely,\nTest Applicant"
    )

    from langchain_core.runnables import RunnableLambda
    from langchain_core.messages import AIMessage
    from app.services.cover_letter_service import CoverLetterService

    mock_runnable = RunnableLambda(lambda _: AIMessage(content=letter_text))
    monkeypatch.setattr(CoverLetterService, "get_llm", lambda: mock_runnable)
