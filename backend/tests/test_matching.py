import pytest
from app.models.internship import Internship
from app.schemas.resume import ResumeData, ProjectItem, ExperienceItem
from app.services.matching_service import MatchingService, normalize_skill


def test_normalize_skill():
    assert normalize_skill("React.js") == "react"
    assert normalize_skill("PostgreSQL") == "postgresql"
    assert normalize_skill("Postgres") == "postgresql"
    assert normalize_skill("Spring Boot") == "spring boot"
    assert normalize_skill("REST API") == "restful apis"


def test_matching_service_finds_exact_and_synonym_skills():
    internship = Internship(
        internship_id="INT-M-01",
        title="Python Backend Intern",
        company="TechCorp",
        required_skills=["Python", "PostgreSQL", "RESTful APIs", "Docker"],
        preferred_skills=["Git", "Redis"]
    )
    resume = ResumeData(
        candidate_name="Alex Ray",
        skills=["Python", "Postgres", "REST API", "Git", "C++"]
    )

    result = MatchingService.analyze_match(resume, internship)

    # Candidate has Python, Postgres (matches PostgreSQL), REST API (matches RESTful APIs), and Git (preferred)
    assert "Python" in result.matching_skills
    assert "Postgres" in result.matching_skills
    assert "REST API" in result.matching_skills
    assert "Git" in result.matching_skills

    # Candidate does NOT have Docker
    assert "Docker" in result.skill_gaps

    # C++ was not required or preferred, so it should not be in matching_skills
    assert "C++" not in result.matching_skills

    # Never invent qualifications
    assert result.match_percentage > 50.0


def test_matching_service_identifies_relevant_projects():
    internship = Internship(
        internship_id="INT-M-02",
        title="AI Engineer Intern",
        company="AI Labs",
        required_skills=["Python", "LangChain", "FastAPI"],
        preferred_skills=["Docker"]
    )
    resume = ResumeData(
        candidate_name="Meera Sen",
        skills=["Python", "LangChain"],
        projects=[
            ProjectItem(
                name="RAG Document Chatbot",
                description="Built a generative QA system",
                technologies=["Python", "LangChain"]
            ),
            ProjectItem(
                name="Personal Portfolio",
                description="HTML and CSS static site",
                technologies=["HTML", "CSS"]
            )
        ]
    )

    result = MatchingService.analyze_match(resume, internship)
    assert len(result.relevant_projects) == 1
    assert "RAG Document Chatbot" in result.relevant_projects[0]
    assert "Personal Portfolio" not in str(result.relevant_projects)


def test_matching_service_empty_candidate_skills():
    internship = Internship(
        internship_id="INT-M-03",
        title="Java Developer",
        company="Enterprise Co",
        required_skills=["Java", "Spring Boot"]
    )
    resume = ResumeData(
        candidate_name="Fresher Without Skills",
        skills=[]
    )

    result = MatchingService.analyze_match(resume, internship)
    assert len(result.matching_skills) == 0
    assert "Java" in result.skill_gaps
    assert "Spring Boot" in result.skill_gaps
    assert result.match_percentage == 0.0
