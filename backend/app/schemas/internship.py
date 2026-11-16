from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class InternshipBase(BaseModel):
    title: str = Field(..., description="Title of the internship")
    company: str = Field(..., description="Company name offering the internship")
    description: Optional[str] = Field(None, description="Detailed description of the role")
    required_skills: List[str] = Field(default_factory=list, description="Mandatory technical and soft skills")
    preferred_skills: List[str] = Field(default_factory=list, description="Desirable or bonus skills")
    responsibilities: List[str] = Field(default_factory=list, description="Day-to-day responsibilities")
    requirements: List[str] = Field(default_factory=list, description="Eligibility and prerequisites")
    education_requirements: Optional[str] = Field(None, description="Required education level or field")
    experience_requirements: Optional[str] = Field(None, description="Required experience or level")
    location: Optional[str] = Field(None, description="Geographic location")
    work_mode: Optional[str] = Field("Remote", description="Remote, Hybrid, or On-site")
    duration: Optional[str] = Field(None, description="Duration in weeks or months")
    stipend: Optional[str] = Field(None, description="Stipend or compensation details")


class InternshipCreate(InternshipBase):
    internship_id: str = Field(..., description="Unique alphanumeric identifier for the internship")


class InternshipResponse(InternshipBase):
    internship_id: str

    model_config = ConfigDict(from_attributes=True)


class InternshipListResponse(BaseModel):
    total: int
    internships: List[InternshipResponse]
