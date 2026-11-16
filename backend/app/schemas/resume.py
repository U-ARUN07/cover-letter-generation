from typing import List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict


class EducationItem(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[str] = None
    gpa: Optional[str] = None


class ExperienceItem(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    achievements: List[str] = Field(default_factory=list)


class ProjectItem(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    link: Optional[str] = None


class ResumeData(BaseModel):
    candidate_id: Optional[str] = Field(None, description="Unique candidate identifier")
    candidate_name: str = Field(..., description="Full name of the candidate")
    email: Optional[str] = Field(None, description="Contact email address")
    phone: Optional[str] = Field(None, description="Contact telephone number")
    summary: Optional[str] = Field(None, description="Professional or academic summary")
    skills: List[str] = Field(default_factory=list, description="Extracted candidate skills")
    education: List[EducationItem] = Field(default_factory=list, description="Education history")
    experience: List[ExperienceItem] = Field(default_factory=list, description="Internship and work experience")
    projects: List[ProjectItem] = Field(default_factory=list, description="Relevant technical projects")
    certifications: List[Union[str, dict]] = Field(default_factory=list, description="Certifications and licenses")
    achievements: List[str] = Field(default_factory=list, description="Honors and achievements")

    model_config = ConfigDict(extra="ignore")
