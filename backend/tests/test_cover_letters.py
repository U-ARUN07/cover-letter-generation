import pytest
from unittest.mock import patch
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.routes.cover_letters import (
    generate_cover_letter,
    generate_cover_letter_from_resume,
    get_cover_letter_by_id,
)
from app.services.resume_service import ResumeService
from app.schemas.cover_letter import (
    CoverLetterGenerateRequest,
    CoverLetterGenerateFromResumeRequest,
)
from app.schemas.resume import ResumeData
from app.config import settings


def test_generate_cover_letter_success(db_session: Session, sample_resume: ResumeData, mock_llm_chain):
    ResumeService.register_resume(sample_resume)

    payload = CoverLetterGenerateRequest(
        candidate_id=sample_resume.candidate_id,
        internship_id="INT-TEST-001",
        tone="professional"
    )
    result = generate_cover_letter(payload, db=db_session)

    assert result.cover_letter_id.startswith("CL-")
    assert result.candidate_name == sample_resume.candidate_name
    assert result.internship_title == "Full Stack AI Intern"
    assert result.company_name == "Infosys Limited"
    assert "Python" in result.matching_skills
    assert len(result.relevant_projects) >= 1
    assert "Dear Hiring Team" in result.cover_letter
    assert result.generated_at != ""

    # Test retrieval by ID
    retrieved = get_cover_letter_by_id(result.cover_letter_id, db=db_session)
    assert retrieved.cover_letter_id == result.cover_letter_id
    assert retrieved.candidate_name == sample_resume.candidate_name


def test_generate_from_resume_success(db_session: Session, sample_resume: ResumeData, mock_llm_chain):
    payload = CoverLetterGenerateFromResumeRequest(
        internship_id="INT-TEST-001",
        resume_data=sample_resume,
        tone="enthusiastic"
    )
    result = generate_cover_letter_from_resume(payload, db=db_session)
    assert result.candidate_name == sample_resume.candidate_name
    assert result.company_name == "Infosys Limited"
    assert result.cover_letter != ""


def test_generate_from_resume_empty_name(db_session: Session):
    payload = CoverLetterGenerateFromResumeRequest(
        internship_id="INT-TEST-001",
        resume_data=ResumeData(candidate_name="   "),
        tone="professional"
    )
    with pytest.raises(HTTPException) as excinfo:
        generate_cover_letter_from_resume(payload, db=db_session)
    assert excinfo.value.status_code == 422
    assert "candidate_name" in excinfo.value.detail.lower()


def test_generate_from_resume_missing_internship(db_session: Session, sample_resume: ResumeData):
    payload = CoverLetterGenerateFromResumeRequest(
        internship_id="INT-UNKNOWN-888",
        resume_data=sample_resume,
        tone="professional"
    )
    with pytest.raises(HTTPException) as excinfo:
        generate_cover_letter_from_resume(payload, db=db_session)
    assert excinfo.value.status_code == 404



def test_generate_cover_letter_missing_internship(db_session: Session, sample_resume: ResumeData):
    ResumeService.register_resume(sample_resume)
    payload = CoverLetterGenerateRequest(
        candidate_id=sample_resume.candidate_id,
        internship_id="INT-DOES-NOT-EXIST"
    )
    with pytest.raises(HTTPException) as excinfo:
        generate_cover_letter(payload, db=db_session)
    assert excinfo.value.status_code == 404
    assert "not found" in excinfo.value.detail.lower()


def test_generate_cover_letter_missing_candidate(db_session: Session):
    payload = CoverLetterGenerateRequest(
        candidate_id="CAND-NON-EXISTENT-XYZ",
        internship_id="INT-TEST-001"
    )
    with pytest.raises(HTTPException) as excinfo:
        generate_cover_letter(payload, db=db_session)
    assert excinfo.value.status_code == 404
    assert "candidate resume" in excinfo.value.detail.lower()


def test_get_cover_letter_not_found(db_session: Session):
    with pytest.raises(HTTPException) as excinfo:
        get_cover_letter_by_id("CL-NOTFOUND999", db=db_session)
    assert excinfo.value.status_code == 404
    assert "not found" in excinfo.value.detail.lower()


def test_missing_api_key_configuration_error(db_session: Session, sample_resume: ResumeData):
    ResumeService.register_resume(sample_resume)

    # Ensure no API keys are present
    with patch.object(settings, "GEMINI_API_KEY", None), \
         patch.object(settings, "OPENAI_API_KEY", None), \
         patch.dict("os.environ", {}, clear=True):

        payload = CoverLetterGenerateRequest(
            candidate_id=sample_resume.candidate_id,
            internship_id="INT-TEST-001"
        )
        with pytest.raises(HTTPException) as excinfo:
            generate_cover_letter(payload, db=db_session)
        assert excinfo.value.status_code == 400
        assert "api key is not configured" in excinfo.value.detail.lower()
