import pytest
from fastapi import HTTPException
from app.routes.resumes import get_sample_resumes, get_resume_by_id, register_resume
from app.services.resume_service import ResumeService
from app.schemas.resume import ResumeData


def test_get_sample_resumes():
    samples = get_sample_resumes()
    assert isinstance(samples, list)
    assert len(samples) >= 1
    assert hasattr(samples[0], "candidate_name")
    assert samples[0].candidate_name != ""


def test_get_resume_by_id(sample_resume: ResumeData):
    ResumeService.register_resume(sample_resume)
    found = get_resume_by_id(sample_resume.candidate_id)
    assert found.candidate_id == sample_resume.candidate_id
    assert found.candidate_name == sample_resume.candidate_name


def test_get_resume_not_found():
    with pytest.raises(HTTPException) as excinfo:
        get_resume_by_id("CAND-UNKNOWN-999")
    assert excinfo.value.status_code == 404
    assert "not found" in excinfo.value.detail.lower()


def test_register_new_resume():
    new_resume = ResumeData(
        candidate_id="CAND-REG-001",
        candidate_name="Deepika Patel",
        email="deepika@example.com",
        phone="+91 98111 22233",
        summary="Full stack enthusiast.",
        skills=["JavaScript", "React", "Node.js"]
    )
    created = register_resume(new_resume)
    assert created.candidate_name == "Deepika Patel"
    assert created.candidate_id == "CAND-REG-001"


def test_extract_structured_resume_from_text():
    sample_text = """
    Aakash Sharma
    aakash.sharma@example.com | +91 98765 12345
    Summary: Computer science student passionate about backend systems.
    Skills: Python, FastAPI, Docker, SQL, Git
    B.Tech Computer Science from Delhi Technological University
    Project: Task Management API using FastAPI and Docker
    """
    resume = ResumeService.extract_structured_resume_from_text(sample_text)
    assert resume.candidate_name == "Aakash Sharma"
    assert resume.email == "aakash.sharma@example.com"
    assert "Python" in resume.skills
    assert "FastAPI" in resume.skills
    assert "Docker" in resume.skills
    assert len(resume.education) >= 1
