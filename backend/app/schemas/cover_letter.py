from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.resume import ResumeData


class CoverLetterGenerateRequest(BaseModel):
    candidate_id: str = Field(..., description="ID of the candidate whose resume is stored or cached")
    internship_id: str = Field(..., description="Target internship ID")
    tone: Optional[str] = Field("professional", description="Tone of the cover letter: professional, enthusiastic, concise")


class CoverLetterGenerateFromResumeRequest(BaseModel):
    internship_id: str = Field(..., description="Target internship ID")
    resume_data: ResumeData = Field(..., description="Candidate resume details in structured JSON")
    tone: Optional[str] = Field("professional", description="Tone of the cover letter: professional, enthusiastic, concise")


class MatchingAnalysisResult(BaseModel):
    internship_id: str
    internship_title: str
    company_name: str
    candidate_name: str
    matching_skills: List[str] = Field(default_factory=list)
    skill_gaps: List[str] = Field(default_factory=list)
    relevant_projects: List[str] = Field(default_factory=list)
    relevant_experience: List[str] = Field(default_factory=list)
    relevant_education: List[str] = Field(default_factory=list)
    match_percentage: float = Field(0.0, description="Match score from 0 to 100")
    recommendations: List[str] = Field(default_factory=list)


class CoverLetterResponse(BaseModel):
    cover_letter_id: str
    candidate_id: Optional[str] = None
    candidate_name: str
    internship_id: str
    internship_title: str
    company_name: str
    matching_skills: List[str]
    relevant_projects: List[str]
    relevant_experience: List[str]
    cover_letter: str
    generated_at: str

    model_config = ConfigDict(from_attributes=True)
