import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import settings
from app.models.internship import Internship
from app.models.cover_letter import GeneratedCoverLetter
from app.schemas.resume import ResumeData
from app.schemas.cover_letter import (
    CoverLetterResponse,
    MatchingAnalysisResult,
)
from app.prompts.cover_letter_prompt import cover_letter_chat_prompt
from app.services.matching_service import MatchingService

logger = logging.getLogger(__name__)


class CoverLetterService:
    @staticmethod
    def get_llm():
        """
        Initializes the configured LLM using LangChain.
        Raises descriptive HTTPException if required API key is missing.
        """
        provider = (settings.LLM_PROVIDER or "gemini").lower()

        if provider == "gemini":
            api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
            if not api_key:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Gemini API key is not configured. Please provide GEMINI_API_KEY in "
                        "backend/.env or set the GEMINI_API_KEY environment variable."
                    )
                )
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                return ChatGoogleGenerativeAI(
                    model=settings.GEMINI_MODEL or "gemini-1.5-flash",
                    google_api_key=api_key,
                    temperature=0.4,
                    max_output_tokens=1500
                )
            except Exception as e:
                logger.error(f"Error initializing ChatGoogleGenerativeAI: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to initialize Gemini LLM client: {str(e)}"
                )

        elif provider == "openai":
            api_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
            if not api_key:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "OpenAI API key is not configured. Please provide OPENAI_API_KEY in "
                        "backend/.env or set the OPENAI_API_KEY environment variable."
                    )
                )
            try:
                from langchain_openai import ChatOpenAI
                return ChatOpenAI(
                    model=settings.OPENAI_MODEL or "gpt-4o-mini",
                    api_key=api_key,
                    temperature=0.4,
                    max_tokens=1500
                )
            except Exception as e:
                logger.error(f"Error initializing ChatOpenAI: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to initialize OpenAI LLM client: {str(e)}"
                )

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported LLM_PROVIDER '{provider}'. Supported providers are 'gemini' and 'openai'."
            )

    @classmethod
    def generate_cover_letter(
        cls,
        db: Session,
        internship: Internship,
        resume: ResumeData,
        tone: str = "professional"
    ) -> CoverLetterResponse:
        """
        Executes requirement matching and invokes LangChain with ChatPromptTemplate
        to generate a tailored, professional cover letter.
        """
        # 1. Perform rigorous qualification matching analysis
        match_analysis: MatchingAnalysisResult = MatchingService.analyze_match(resume, internship)

        # 2. Format context sections for LLM
        candidate_summary_dict = {
            "name": resume.candidate_name,
            "email": resume.email or "Provided upon request",
            "phone": resume.phone or "Provided upon request",
            "summary": resume.summary or "Aspiring professional",
            "skills": resume.skills,
            "education": [e.model_dump() for e in resume.education] if resume.education else [],
            "experience": [exp.model_dump() for exp in resume.experience] if resume.experience else [],
            "projects": [p.model_dump() for p in resume.projects] if resume.projects else [],
            "certifications": resume.certifications,
            "achievements": resume.achievements
        }

        internship_summary_dict = {
            "title": internship.title,
            "company": internship.company,
            "description": internship.description,
            "required_skills": internship.required_skills,
            "preferred_skills": internship.preferred_skills,
            "responsibilities": internship.responsibilities,
            "requirements": internship.requirements,
            "education_requirements": internship.education_requirements,
            "location": internship.location,
            "work_mode": internship.work_mode,
            "duration": internship.duration
        }

        candidate_data_str = json.dumps(candidate_summary_dict, indent=2)
        internship_data_str = json.dumps(internship_summary_dict, indent=2)
        matching_skills_str = ", ".join(match_analysis.matching_skills) if match_analysis.matching_skills else "General technical foundation"
        relevant_projects_str = "\n".join(f"- {p}" for p in match_analysis.relevant_projects) if match_analysis.relevant_projects else "None specified"
        relevant_experience_str = "\n".join(f"- {e}" for e in match_analysis.relevant_experience) if match_analysis.relevant_experience else "None specified"

        # 3. Initialize LLM via LangChain
        llm = cls.get_llm()

        # 4. Construct and invoke LangChain Pipeline
        try:
            chain = cover_letter_chat_prompt | llm
            response = chain.invoke({
                "candidate_data": candidate_data_str,
                "internship_data": internship_data_str,
                "matching_skills": matching_skills_str,
                "relevant_projects": relevant_projects_str,
                "relevant_experience": relevant_experience_str,
                "internship_title": internship.title,
                "company_name": internship.company,
                "tone": tone
            })
            cover_letter_content = response.content
            if isinstance(cover_letter_content, list):
                cover_letter_content = "".join([str(item) for item in cover_letter_content])
            cover_letter_content = str(cover_letter_content).strip()
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"LLM API generation failed: {str(e)}"
            )

        # 5. Persist the generated cover letter into database
        cover_letter_id = f"CL-{uuid.uuid4().hex[:12].upper()}"
        now_dt = datetime.now(timezone.utc)
        now_str = now_dt.isoformat()

        db_record = GeneratedCoverLetter(
            cover_letter_id=cover_letter_id,
            candidate_id=resume.candidate_id,
            candidate_name=resume.candidate_name,
            internship_id=internship.internship_id,
            internship_title=internship.title,
            company_name=internship.company,
            cover_letter_content=cover_letter_content,
            matching_skills=match_analysis.matching_skills,
            relevant_projects=match_analysis.relevant_projects,
            relevant_experience=match_analysis.relevant_experience,
            created_at=now_dt
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)

        # 6. Return structured response adhering to specification
        return CoverLetterResponse(
            cover_letter_id=cover_letter_id,
            candidate_id=resume.candidate_id,
            candidate_name=resume.candidate_name,
            internship_id=internship.internship_id,
            internship_title=internship.title,
            company_name=internship.company,
            matching_skills=match_analysis.matching_skills,
            relevant_projects=match_analysis.relevant_projects,
            relevant_experience=match_analysis.relevant_experience,
            cover_letter=cover_letter_content,
            generated_at=now_str
        )

    @staticmethod
    def get_by_id(db: Session, cover_letter_id: str) -> Optional[GeneratedCoverLetter]:
        """Fetch previously generated cover letter by ID."""
        return db.query(GeneratedCoverLetter).filter(
            GeneratedCoverLetter.cover_letter_id == cover_letter_id
        ).first()
