import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.cover_letter import (
    CoverLetterGenerateRequest,
    CoverLetterGenerateFromResumeRequest,
    CoverLetterResponse,
)
from app.services.internship_service import InternshipService
from app.services.resume_service import ResumeService
from app.services.cover_letter_service import CoverLetterService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cover-letters", tags=["Cover Letters"])


@router.post("/generate", response_model=CoverLetterResponse)
def generate_cover_letter(
    payload: CoverLetterGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a tailored professional cover letter using candidate_id and internship_id.
    """
    # 1. Fetch internship
    internship = InternshipService.get_by_id(db, payload.internship_id)
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Internship '{payload.internship_id}' was not found."
        )

    # 2. Fetch candidate resume
    resume = ResumeService.get_by_candidate_id(payload.candidate_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Candidate resume for ID '{payload.candidate_id}' not found. "
                "Please verify the candidate ID, upload a resume, or use /generate-from-resume."
            )
        )

    # 3. Generate cover letter
    return CoverLetterService.generate_cover_letter(
        db=db,
        internship=internship,
        resume=resume,
        tone=payload.tone or "professional"
    )


@router.post("/generate-from-resume", response_model=CoverLetterResponse)
def generate_cover_letter_from_resume(
    payload: CoverLetterGenerateFromResumeRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a tailored cover letter using directly supplied candidate resume JSON and internship_id.
    """
    # 1. Fetch internship
    internship = InternshipService.get_by_id(db, payload.internship_id)
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Internship '{payload.internship_id}' was not found."
        )

    # 2. Validate resume data presence
    resume = payload.resume_data
    if not resume or not resume.candidate_name or not resume.candidate_name.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Candidate resume must include at least a valid 'candidate_name'."
        )

    # 3. Generate cover letter
    return CoverLetterService.generate_cover_letter(
        db=db,
        internship=internship,
        resume=resume,
        tone=payload.tone or "professional"
    )


@router.get("/{cover_letter_id}", response_model=CoverLetterResponse)
def get_cover_letter_by_id(
    cover_letter_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve previously generated cover letter by ID."""
    record = CoverLetterService.get_by_id(db, cover_letter_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cover letter with ID '{cover_letter_id}' was not found."
        )

    return CoverLetterResponse(
        cover_letter_id=record.cover_letter_id,
        candidate_id=record.candidate_id,
        candidate_name=record.candidate_name or "Candidate",
        internship_id=record.internship_id,
        internship_title=record.internship_title or "",
        company_name=record.company_name or "",
        matching_skills=record.matching_skills or [],
        relevant_projects=record.relevant_projects or [],
        relevant_experience=record.relevant_experience or [],
        cover_letter=record.cover_letter_content,
        generated_at=record.created_at.isoformat()
    )
