import io
import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional
import httpx
from app.config import settings
from app.schemas.resume import (
    ResumeData,
    EducationItem,
    ExperienceItem,
    ProjectItem,
)

logger = logging.getLogger(__name__)


class ResumeService:
    # In-memory candidate registry (seeded from sample resumes and user uploads)
    _registry: Dict[str, ResumeData] = {}

    @classmethod
    def initialize_registry(cls) -> None:
        """Load sample resumes from data/sample_resumes.json into registry."""
        sample_file = settings.DATA_DIR / "sample_resumes.json"
        if sample_file.exists():
            try:
                with open(sample_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        resume = ResumeData(**item)
                        cid = resume.candidate_id or f"CAND-{len(cls._registry) + 1:03d}"
                        resume.candidate_id = cid
                        cls._registry[cid] = resume
                logger.info(f"Loaded {len(cls._registry)} sample resumes into registry.")
            except Exception as e:
                logger.error(f"Error loading sample resumes: {e}")

    @classmethod
    def get_all_samples(cls) -> List[ResumeData]:
        if not cls._registry:
            cls.initialize_registry()
        return list(cls._registry.values())

    @classmethod
    def register_resume(cls, resume: ResumeData) -> ResumeData:
        """Register or update a candidate resume in memory."""
        if not resume.candidate_id:
            resume.candidate_id = f"CAND-USER-{len(cls._registry) + 1:04d}"
        cls._registry[resume.candidate_id] = resume
        return resume

    @classmethod
    def get_by_candidate_id(cls, candidate_id: str) -> Optional[ResumeData]:
        """
        Fetch resume by candidate_id.
        1. Checks local registry first.
        2. Tries to query external Resume Parsing API (https://github.com/U-ARUN07/resume-parsing-api).
        """
        if not cls._registry:
            cls.initialize_registry()

        if candidate_id in cls._registry:
            return cls._registry[candidate_id]

        # Attempt to fetch from external Resume Parsing API if configured
        if settings.RESUME_PARSING_API_URL:
            try:
                import requests
                url = f"{settings.RESUME_PARSING_API_URL.rstrip('/')}/api/v1/resumes/{candidate_id}"
                response = requests.get(url, timeout=2.0)
                if response.status_code == 200:
                    parsed_json = response.json()
                    resume = ResumeData(**parsed_json)
                    cls.register_resume(resume)
                    return resume
            except Exception as exc:
                logger.warning(
                    f"External resume parsing API unreachable at {settings.RESUME_PARSING_API_URL}: {exc}. "
                    "Falling back to local resume registry."
                )

        return None

    @classmethod
    def parse_pdf(cls, file_bytes: bytes) -> str:
        """Extract plain text from PDF bytes using PyMuPDF (fitz)."""
        import fitz  # PyMuPDF
        text = ""
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                text += page.get_text() + "\n"
        return text

    @classmethod
    def parse_docx(cls, file_bytes: bytes) -> str:
        """Extract plain text from DOCX bytes using python-docx."""
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text)
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    full_text.append(" | ".join(row_text))
        return "\n".join(full_text)

    @classmethod
    def extract_structured_resume_from_text(cls, raw_text: str, filename: str = "") -> ResumeData:
        """
        Fallback parser that extracts candidate attributes from raw text
        when external Resume Parsing API is unavailable.
        """
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

        # 1. Extract Candidate Name (First non-empty line or heuristic)
        name = "Candidate"
        if lines:
            first_line = lines[0]
            # Simple heuristic: names usually 2-4 words, no symbols
            if len(first_line.split()) <= 4 and not re.search(r"[@:/\\#]", first_line):
                name = first_line

        # 2. Extract Email
        email = None
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", raw_text)
        if email_match:
            email = email_match.group(0)

        # 3. Extract Phone
        phone = None
        phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", raw_text)
        if phone_match:
            phone = phone_match.group(0)

        # 4. Extract Skills using a broad technical skill lexicon
        known_skills = [
            "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "HTML", "CSS",
            "React", "Vue", "Angular", "Node.js", "Express", "FastAPI", "Flask",
            "Django", "Spring Boot", "SQL", "PostgreSQL", "MySQL", "MongoDB",
            "Redis", "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Git", "Linux",
            "LangChain", "OpenAI", "Gemini", "Machine Learning", "Deep Learning",
            "NLP", "PyTorch", "TensorFlow", "Pandas", "NumPy", "Scikit-learn",
            "Power BI", "Tableau", "Tailwind CSS", "RESTful APIs", "Microservices",
            "JUnit", "CI/CD", "Kafka", "Data Structures", "Algorithms"
        ]
        found_skills = []
        raw_text_lower = raw_text.lower()
        for skill in known_skills:
            # Match whole words or boundary
            pattern = r"\b" + re.escape(skill.lower()) + r"\b"
            if re.search(pattern, raw_text_lower):
                found_skills.append(skill)

        # 5. Extract Summary
        summary = None
        summary_section = re.search(
            r"(?:summary|objective|about me|profile)\s*[:\n\r]+(.*?)(?=\n\s*(?:skills|experience|education|projects|certifications|\Z))",
            raw_text,
            re.IGNORECASE | re.DOTALL
        )
        if summary_section:
            summary = summary_section.group(1).strip()[:500]
        else:
            summary = f"Aspiring technical candidate with focus in {', '.join(found_skills[:3]) if found_skills else 'software development'}."

        # 6. Education item fallback
        education = []
        edu_match = re.search(r"(b\.?tech|b\.?e|m\.?tech|bca|mca|bachelor|master|degree)[^\n\r]*", raw_text, re.IGNORECASE)
        if edu_match:
            education.append(EducationItem(degree=edu_match.group(0).strip()))

        # 7. Projects fallback
        projects = []
        proj_pattern = re.findall(r"project[:\s]+([^\n\r]+)", raw_text, re.IGNORECASE)
        for p in proj_pattern[:3]:
            projects.append(ProjectItem(name=p.strip(), description=p.strip(), technologies=[]))

        candidate_id = f"CAND-UP-{abs(hash(raw_text)) % 100000:05d}"

        resume = ResumeData(
            candidate_id=candidate_id,
            candidate_name=name,
            email=email,
            phone=phone,
            summary=summary,
            skills=found_skills,
            education=education,
            experience=[],
            projects=projects,
            certifications=[],
            achievements=[]
        )
        cls.register_resume(resume)
        return resume
