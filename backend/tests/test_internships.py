import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.routes.internships import list_internships, get_internship_detail, analyze_match
from app.schemas.resume import ResumeData
from app.main import health_check


def test_list_internships(db_session: Session):
    result = list_internships(query=None, work_mode=None, limit=50, offset=0, db=db_session)
    assert result.total >= 1
    assert any(i.internship_id == "INT-TEST-001" for i in result.internships)


def test_search_internships(db_session: Session):
    result = list_internships(query="Full Stack", work_mode=None, limit=50, offset=0, db=db_session)
    assert result.total >= 1
    assert "Full Stack" in result.internships[0].title


def test_filter_internships_by_work_mode(db_session: Session):
    result = list_internships(query=None, work_mode="Hybrid", limit=50, offset=0, db=db_session)
    assert result.total >= 1
    assert all("hybrid" in i.work_mode.lower() for i in result.internships)


def test_get_internship_detail_success(db_session: Session):
    detail = get_internship_detail(internship_id="INT-TEST-001", db=db_session)
    assert detail.internship_id == "INT-TEST-001"
    assert detail.company == "Infosys Limited"
    assert "Python" in detail.required_skills


def test_get_internship_detail_not_found(db_session: Session):
    with pytest.raises(HTTPException) as excinfo:
        get_internship_detail(internship_id="INT-NON-EXISTENT", db=db_session)
    assert excinfo.value.status_code == 404
    assert "not found" in excinfo.value.detail.lower()


def test_analyze_match_endpoint(db_session: Session, sample_resume: ResumeData):
    analysis = analyze_match(
        internship_id="INT-TEST-001",
        candidate_id=None,
        resume_data=sample_resume,
        db=db_session
    )
    assert analysis.internship_id == "INT-TEST-001"
    assert "Python" in analysis.matching_skills
    assert "FastAPI" in analysis.matching_skills
    assert analysis.match_percentage > 50.0


def test_health_check_endpoint():
    res = health_check()
    assert res["status"] == "healthy"
    assert "llm_provider" in res
    assert res["database"] == "connected"
