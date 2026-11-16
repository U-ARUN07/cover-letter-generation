import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.internship import (
    InternshipResponse,
    InternshipListResponse,
)
from app.schemas.cover_letter import MatchingAnalysisResult
from app.schemas.resume import ResumeData
from app.services.internship_service import InternshipService
from app.services.resume_service import ResumeService
from app.services.matching_service import MatchingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internships", tags=["Internships"])


@router.get("", response_model=InternshipListResponse)
def list_internships(
    query: Optional[str] = Query(None, description="Search term for title, company, or skills"),
    work_mode: Optional[str] = Query(None, description="Filter by work mode (Remote, Hybrid, On-site)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieve available internships with optional search and filters."""
    internships = InternshipService.get_all(db, query=query, work_mode=work_mode, limit=limit, offset=offset)
    total = InternshipService.count(db, query=query, work_mode=work_mode)
    return InternshipListResponse(total=total, internships=internships)


@router.get("/{internship_id}", response_model=InternshipResponse)
def get_internship_detail(
    internship_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve complete details for a specific internship by ID."""
    internship = InternshipService.get_by_id(db, internship_id)
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Internship with ID '{internship_id}' not found."
        )
    return internship


@router.post("/match", response_model=MatchingAnalysisResult)
def analyze_match(
    internship_id: str = Query(..., description="Target internship ID"),
    candidate_id: Optional[str] = Query(None, description="Candidate ID from registry"),
    resume_data: Optional[ResumeData] = None,
    db: Session = Depends(get_db)
):
    """
    Analyze requirement match between candidate qualifications and an internship.
    Returns matching skills, skill gaps, relevant projects, and match score.
    """
    internship = InternshipService.get_by_id(db, internship_id)
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Internship with ID '{internship_id}' not found."
        )

    resume: Optional[ResumeData] = resume_data
    if not resume and candidate_id:
        resume = ResumeService.get_by_candidate_id(candidate_id)

    if not resume:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either valid candidate_id or resume_data body must be provided."
        )

    return MatchingService.analyze_match(resume, internship)
