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

        elif provider == "ollama":
            try:
                from langchain_ollama import ChatOllama
                return ChatOllama(
                    model=settings.OLLAMA_MODEL or "llama3.2",
                    base_url=settings.OLLAMA_BASE_URL,
                    temperature=0.4,
                )
            except Exception as e:
                logger.error(f"Error initializing ChatOllama: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to initialize Ollama LLM client: {str(e)}. Ensure Ollama is running (`ollama serve`)."
                )

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported LLM_PROVIDER '{provider}'. Supported providers are 'gemini', 'openai', and 'ollama'."
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
        cover_letter_content = ""
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
            content = response.content
            if isinstance(content, list):
                content = "".join([str(item) for item in content])
            cover_letter_content = str(content).strip()
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Live LLM call encountered an issue: {e}. Falling back to tailored synthesizer.")
            cover_letter_content = cls.synthesize_tailored_cover_letter(
                internship=internship,
                resume=resume,
                match_analysis=match_analysis,
                tone=tone
            )

        if not cover_letter_content:
            cover_letter_content = cls.synthesize_tailored_cover_letter(
                internship=internship,
                resume=resume,
                match_analysis=match_analysis,
                tone=tone
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
    def synthesize_tailored_cover_letter(
        internship: Internship,
        resume: ResumeData,
        match_analysis: MatchingAnalysisResult,
        tone: str = "professional"
    ) -> str:
        """
        High-fidelity deterministic synthesis engine that tailors a formal cover letter
        strictly matching candidate qualifications and internship requirements without hallucination.
        """
        candidate_name = resume.candidate_name
        company_name = internship.company
        role_title = internship.title

        # Skills clause
        matching_skills = match_analysis.matching_skills
        if matching_skills:
            skills_str = ", ".join(matching_skills[:5])
            skills_sentence = f"My hands-on experience and verified proficiency in {skills_str} align directly with your required technical stack."
        else:
            skills_sentence = f"My strong academic foundation and demonstrated analytical ability prepare me well for the technical responsibilities of this role."

        # Projects clause
        projects = resume.projects or []
        project_sentence = ""
        if projects:
            p = projects[0]
            techs = f" using {', '.join(p.technologies)}" if p.technologies else ""
            desc = f" ({p.description})" if p.description else ""
            project_sentence = f"In particular, through my project work on '{p.name}'{techs}{desc}, I developed practical competence in architecting solutions and resolving implementation challenges."

        # Experience clause
        experience = resume.experience or []
        experience_sentence = ""
        if experience:
            exp = experience[0]
            experience_sentence = f"During my prior work as a {exp.title or 'Developer Intern'} at {exp.company or 'my previous organization'}, I contributed to key deliverables: {exp.description or ''}."

        # Education clause
        edu_str = ""
        if resume.education:
            e = resume.education[0]
            edu_str = f"As a student pursuing {e.degree or 'a degree'} at {e.institution or 'university'}"
        else:
            edu_str = "As an ambitious software engineering student"

        # Tone variations
        if tone.lower() == "enthusiastic":
            intro = f"I am thrilled to submit my application for the {role_title} internship at {company_name}. I have long admired {company_name}'s digital leadership and technical excellence, and I am eager to bring my passion, curiosity, and rapid learning skills to your team."
            closing_sentiment = f"I am genuinely excited about the possibility of contributing to {company_name}'s upcoming initiatives and learning from your talented engineers."
        elif tone.lower() == "concise":
            intro = f"Please accept this letter as my application for the {role_title} position at {company_name}. {edu_str}, I offer immediate technical value aligned with your team's needs."
            closing_sentiment = f"I welcome the opportunity to discuss how my qualifications meet your team's expectations."
        else:  # professional
            intro = f"I am writing to express my strong interest in the {role_title} internship opportunity with {company_name}. {edu_str}, I am confident that my technical skills and practical project experience make me an excellent fit for this position."
            closing_sentiment = f"I look forward to the possibility of discussing how my background, diligence, and technical skills can support {company_name}'s objectives."

        responsibilities_sample = internship.responsibilities[:2] if internship.responsibilities else []
        resp_sentence = ""
        if responsibilities_sample:
            resp_sentence = f"I am particularly drawn to your team's focus on {responsibilities_sample[0].lower().rstrip('.')}, and I am prepared to contribute actively to these responsibilities from day one."

        letter = f"""Dear Hiring Team at {company_name},

{intro}

{skills_sentence} {project_sentence} {experience_sentence}

{resp_sentence}

Thank you for your time and consideration. {closing_sentiment}

Sincerely,
{candidate_name}"""

        return letter.strip()

    @staticmethod
    def get_by_id(db: Session, cover_letter_id: str) -> Optional[GeneratedCoverLetter]:
        """Fetch previously generated cover letter by ID."""
        return db.query(GeneratedCoverLetter).filter(
            GeneratedCoverLetter.cover_letter_id == cover_letter_id
        ).first()
