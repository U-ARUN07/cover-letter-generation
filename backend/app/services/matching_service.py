import logging
import re
from typing import Dict, List, Set, Tuple
from app.models.internship import Internship
from app.schemas.resume import ResumeData
from app.schemas.cover_letter import MatchingAnalysisResult

logger = logging.getLogger(__name__)

# Canonical synonym dictionary for common software engineering technologies
SYNONYM_MAP: Dict[str, str] = {
    "react": "react",
    "react.js": "react",
    "reactjs": "react",
    "python": "python",
    "python3": "python",
    "fastapi": "fastapi",
    "django": "django",
    "flask": "flask",
    "langchain": "langchain",
    "llm": "llm",
    "gemini": "gemini api",
    "gemini api": "gemini api",
    "openai": "openai api",
    "openai api": "openai api",
    "gpt": "openai api",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "sql": "sql",
    "mysql": "mysql",
    "docker": "docker",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "java": "java",
    "spring": "spring boot",
    "spring boot": "spring boot",
    "springboot": "spring boot",
    "rest": "restful apis",
    "rest api": "restful apis",
    "restful apis": "restful apis",
    "restful api": "restful apis",
    "typescript": "typescript",
    "javascript": "javascript",
    "js": "javascript",
    "ts": "typescript",
    "tailwind": "tailwind css",
    "tailwind css": "tailwind css",
    "tailwindcss": "tailwind css",
    "git": "git",
    "github": "git",
    "junit": "junit",
    "linux": "linux",
    "bash": "bash",
    "pandas": "pandas",
    "numpy": "numpy",
    "scikit-learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "power bi": "power bi",
    "powerbi": "power bi",
    "tableau": "tableau",
    "faiss": "vector databases",
    "chromadb": "vector databases",
}


def normalize_skill(skill: str) -> str:
    """Normalize a skill string into a canonical representation for matching."""
    cleaned = re.sub(r"[^\w\s\+\#\.]", "", skill.lower()).strip()
    return SYNONYM_MAP.get(cleaned, cleaned)


class MatchingService:
    @classmethod
    def analyze_match(cls, resume: ResumeData, internship: Internship) -> MatchingAnalysisResult:
        """
        Compare candidate qualifications against internship requirements.
        Strict rule: Never invent candidate qualifications.
        """
        candidate_skills_raw = resume.skills or []
        candidate_skills_norm = {normalize_skill(s): s for s in candidate_skills_raw}

        required_skills = internship.required_skills or []
        preferred_skills = internship.preferred_skills or []
        all_internship_skills = required_skills + preferred_skills

        matching_skills: List[str] = []
        skill_gaps: List[str] = []

        # 1. Skill Matching & Gap Detection
        for req in required_skills:
            req_norm = normalize_skill(req)
            matched = False
            # Check exact or normalized match
            for c_norm, orig_skill in candidate_skills_norm.items():
                if req_norm == c_norm or req_norm in c_norm or c_norm in req_norm:
                    matching_skills.append(orig_skill)
                    matched = True
                    break
            if not matched:
                skill_gaps.append(req)

        # Check preferred skills
        for pref in preferred_skills:
            pref_norm = normalize_skill(pref)
            for c_norm, orig_skill in candidate_skills_norm.items():
                if (pref_norm == c_norm or pref_norm in c_norm or c_norm in pref_norm) and orig_skill not in matching_skills:
                    matching_skills.append(orig_skill)
                    break

        # Remove duplicates while preserving case
        unique_matching_skills = list(dict.fromkeys(matching_skills))

        # 2. Identify Relevant Projects
        relevant_projects: List[str] = []
        if resume.projects:
            for proj in resume.projects:
                proj_skills = proj.technologies or []
                proj_skills_norm = [normalize_skill(s) for s in proj_skills]

                # Check skill overlap with internship
                matched_proj_skills = [
                    s for s in proj_skills
                    if any(normalize_skill(s) == normalize_skill(req) or normalize_skill(req) in normalize_skill(s) for req in all_internship_skills)
                ]

                # Check keyword overlap in project description / name
                desc_text = f"{proj.name or ''} {proj.description or ''}".lower()
                role_keywords = (internship.title or "").lower().split() + [s.lower() for s in required_skills]
                has_keyword = any(k in desc_text for k in role_keywords if len(k) > 2)

                if matched_proj_skills or has_keyword:
                    tech_desc = f" ({', '.join(proj_skills)})" if proj_skills else ""
                    relevant_projects.append(f"{proj.name}{tech_desc}: {proj.description or ''}".strip())

        # 3. Identify Relevant Experience
        relevant_experience: List[str] = []
        if resume.experience:
            for exp in resume.experience:
                exp_text = f"{exp.title or ''} at {exp.company or ''} - {exp.description or ''}".lower()
                # Check if experience mentions role keywords or technologies
                matched = any(normalize_skill(req) in exp_text for req in all_internship_skills)
                if matched or exp.title:
                    achievements_str = f" | Achievements: {'; '.join(exp.achievements)}" if exp.achievements else ""
                    relevant_experience.append(
                        f"{exp.title or 'Role'} at {exp.company or 'Company'} ({exp.duration or 'Duration'}): "
                        f"{exp.description or ''}{achievements_str}".strip()
                    )

        # 4. Identify Relevant Education
        relevant_education: List[str] = []
        if resume.education:
            for edu in resume.education:
                edu_line = f"{edu.degree or 'Degree'} from {edu.institution or 'University'}"
                if edu.field_of_study:
                    edu_line += f" ({edu.field_of_study})"
                if edu.graduation_year:
                    edu_line += f", Class of {edu.graduation_year}"
                if edu.gpa:
                    edu_line += f" [GPA: {edu.gpa}]"
                relevant_education.append(edu_line)

        # 5. Calculate Match Percentage
        req_count = len(required_skills) or 1
        req_matches = sum(1 for req in required_skills if any(normalize_skill(req) == normalize_skill(m) for m in unique_matching_skills))
        req_score = (req_matches / req_count) * 60.0

        pref_count = len(preferred_skills) or 1
        pref_matches = sum(1 for pref in preferred_skills if any(normalize_skill(pref) == normalize_skill(m) for m in unique_matching_skills))
        pref_score = (pref_matches / pref_count) * 15.0

        proj_score = min(len(relevant_projects) * 10.0, 15.0)
        exp_score = min(len(relevant_experience) * 10.0, 10.0)

        total_score = round(min(req_score + pref_score + proj_score + exp_score, 100.0), 1)

        # 6. Actionable recommendations
        recommendations: List[str] = []
        if unique_matching_skills:
            recommendations.append(f"Emphasize your proven proficiency in {', '.join(unique_matching_skills[:4])}.")
        if relevant_projects:
            recommendations.append("Highlight your hands-on project accomplishments in the body paragraphs.")
        if skill_gaps:
            recommendations.append(f"Noticeable requirement gaps: {', '.join(skill_gaps[:3])}. Express proactive interest in quickly mastering these.")

        return MatchingAnalysisResult(
            internship_id=internship.internship_id,
            internship_title=internship.title,
            company_name=internship.company,
            candidate_name=resume.candidate_name,
            matching_skills=unique_matching_skills,
            skill_gaps=skill_gaps,
            relevant_projects=relevant_projects,
            relevant_experience=relevant_experience,
            relevant_education=relevant_education,
            match_percentage=total_score,
            recommendations=recommendations
        )
