import logging
from typing import List
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.resume import ResumeData
from app.services.resume_service import ResumeService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.get("/samples", response_model=List[ResumeData])
def get_sample_resumes():
    """Retrieve preloaded sample candidate resumes for quick selection."""
    return ResumeService.get_all_samples()


@router.get("/{candidate_id}", response_model=ResumeData)
def get_resume_by_id(candidate_id: str):
    """Retrieve candidate resume by candidate_id."""
    resume = ResumeService.get_by_candidate_id(candidate_id)
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate resume '{candidate_id}' not found."
        )
    return resume


@router.post("", response_model=ResumeData, status_code=status.HTTP_201_CREATED)
def register_resume(resume_data: ResumeData):
    """Register or save candidate resume JSON."""
    return ResumeService.register_resume(resume_data)


@router.post("/upload", response_model=ResumeData)
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload resume file (PDF or DOCX) as a fallback when external Resume Parsing API
    is unavailable. Parses text and returns structured ResumeData.
    """
    filename = file.filename or "uploaded_resume"
    extension = filename.split(".")[-1].lower() if "." in filename else ""

    if extension not in ["pdf", "docx", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{extension}'. Please upload a PDF, DOCX, or TXT file."
        )

    try:
        content = await file.read()
        if extension == "pdf":
            raw_text = ResumeService.parse_pdf(content)
        elif extension == "docx":
            raw_text = ResumeService.parse_docx(content)
        else:
            raw_text = content.decode("utf-8", errors="ignore")

        if not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file appears to be empty or unreadable."
            )

        structured_resume = ResumeService.extract_structured_resume_from_text(raw_text, filename=filename)
        return structured_resume
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing resume upload: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse resume file: {str(e)}"
        )
