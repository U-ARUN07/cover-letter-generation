# AI-Powered Cover Letter Generation System
### Infosys Springboard Virtual Internship Program 7.0 — Internship Application Agent

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![LangChain](https://img.shields.io/badge/LangChain-1.3+-green.svg)](https://www.langchain.com)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com)
[![Tests Passing](https://img.shields.io/badge/tests-24%20passed-brightgreen.svg)](backend/tests)

---

## 1. Project Objective

The **AI-Powered Cover Letter Generation System** is an intelligent, agentic module designed for the **Infosys Springboard Virtual Internship Program 7.0 (Internship Application Agent)**.

Its core mission is to automate the extraction of candidate resume attributes, cross-reference them against specific internship requirements, calculate an empirical qualification alignment score, and leverage Large Language Models (LLMs) via **LangChain** to synthesize authentic, role-tailored professional cover letters.

### Key Guarantees:
- **Strict Anti-Hallucination & Non-Fabrication**: The system strictly forbids inventing skills, projects, certifications, or company history not verified in the input resume.
- **Explainable Requirement Matching**: Analyzes matching skills, identifies requirement gaps, and highlights relevant projects and professional experience.
- **Dual LLM Provider Support**: Supports both **Google Gemini API** (`gemini-1.5-flash`) and **OpenAI API** (`gpt-4o-mini`), switchable via configuration.
- **Graceful Offline Mode**: Provides clear, actionable configuration feedback if an API key is absent, preventing system crashes.
- **Integrated Fallback Ingestion**: Works seamlessly with the [Resume Parsing API](https://github.com/U-ARUN07/resume-parsing-api) while offering local multi-candidate selection and native PDF/DOCX file upload parsers.

---

## 2. Architecture & Design

The system adheres to a modular, decoupled Layered Architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CoverCraft React + TypeScript UI                      │
│     (Catalog Search, Detail Modal, Resume Selector, Gauge, Studio Preview)  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / REST APIs
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                              FastAPI Backend                                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Routers: /internships | /resumes | /cover-letters | /health         │   │
│   └───────────────────┬─────────────────────────┬───────────────────────┘   │
│                       │                         │                           │
│   ┌───────────────────▼────────────┐  ┌─────────▼───────────────────────┐   │
│   │        MatchingService         │  │       CoverLetterService        │   │
│   │   - Skill Normalization        │  │   - LangChain ChatPrompt        │   │
│   │   - Project Alignment Scorer   │  │   - Gemini / OpenAI Provider    │   │
│   │   - Gap & Recommendation Engine│  │   - Structured Output Formatter │   │
│   └───────────────────┬────────────┘  └─────────┬───────────────────────┘   │
│                       │                         │                           │
│   ┌───────────────────▼────────────┐  ┌─────────▼───────────────────────┐   │
│   │         ResumeService          │  │       SQLAlchemy ORM            │   │
│   │   - External Resume API Client │  │   - PostgreSQL / SQLite Engine  │   │
│   │   - PDF / DOCX Fallback Parser │  │   - Internships & Letters DB    │   │
│   │   - Sample Candidate Registry  │  │                                 │   │
│   └────────────────────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Backend Core** | Python 3.11+, FastAPI 0.115+, Pydantic v2, Pydantic-Settings |
| **LLM & AI Orchestration** | LangChain 1.3+, `ChatPromptTemplate`, Google Gemini API (`langchain-google-genai`), OpenAI API (`langchain-openai`) |
| **Database & ORM** | SQLAlchemy 2.0+, PostgreSQL (`psycopg2-binary`) with SQLite fallback |
| **Document Parsers** | PyMuPDF (`fitz`), python-docx, python-multipart |
| **Testing** | Pytest 8.3+, Pytest-Asyncio, Pytest-Cov |
| **Frontend Framework** | React 18, TypeScript 5.6, Vite 5.4 |
| **Styling & Icons** | Tailwind CSS 3.4, Lucide React, Google Inter & Newsreader Typography |

---

## 4. Workflow

```
1. Browse / Filter Internships
   └── Candidate explores verified roles (Remote, Hybrid, On-site).
2. Select Target Role
   └── System retrieves complete responsibilities, required skills, and duration.
3. Select or Upload Resume
   └── Choose from preloaded profiles, query Resume Parsing API, or upload PDF/DOCX.
4. Requirement Matching Analysis
   └── MatchingService calculates skill overlap, identifies gaps, and scores relevance.
5. AI Synthesis via LangChain
   └── LLM generates a personalized cover letter referencing verified skills & projects.
6. Review, Copy & Export
   └── Candidate inspects letterhead layout, switches tone, copies, or downloads as TXT/PDF.
```

---

## 5. Directory Structure

```
cover-letter-generation/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application & lifespan management
│   │   ├── config.py                # Environment configuration settings
│   │   ├── database.py              # SQLAlchemy engine, session & auto-seeding
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── internship.py        # Internship SQLAlchemy model
│   │   │   └── cover_letter.py      # GeneratedCoverLetter SQLAlchemy model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── internship.py        # Pydantic schemas for internships
│   │   │   ├── resume.py            # Pydantic schemas for resume data
│   │   │   └── cover_letter.py      # Request / Response schemas
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── internships.py       # Listing, detail, and matching routes
│   │   │   ├── resumes.py           # Sample profiles and upload routes
│   │   │   └── cover_letters.py     # Generation and retrieval routes
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── internship_service.py # Database queries & filters
│   │   │   ├── resume_service.py     # Parsing API integration & document fallback
│   │   │   ├── matching_service.py   # Normalized skill & project matcher
│   │   │   └── cover_letter_service.py # LangChain pipeline execution
│   │   └── prompts/
│   │       ├── __init__.py
│   │       └── cover_letter_prompt.py # Strict ChatPromptTemplate definition
│   ├── tests/
│   │   ├── conftest.py              # Test database and mocked LLM fixtures
│   │   ├── test_internships.py      # Catalog & detail tests
│   │   ├── test_resume.py           # Parser & registry tests
│   │   ├── test_matching.py         # Requirement analysis & gap tests
│   │   └── test_cover_letters.py    # Generation & validation tests
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Brand header & system status
│   │   │   ├── StatusBanner.tsx     # Offline mode & key guidance banner
│   │   │   ├── InternshipCard.tsx   # Catalog opportunity card
│   │   │   ├── InternshipDetailModal.tsx # Full requirements dialog
│   │   │   ├── ResumeSelector.tsx   # Candidate selector & file uploader
│   │   │   ├── MatchingScoreGauge.tsx # Radial score & gap tags
│   │   │   └── CoverLetterPreview.tsx # Letterhead display & export actions
│   │   ├── pages/
│   │   │   ├── InternshipsPage.tsx  # Catalog listing page
│   │   │   └── GeneratePage.tsx     # Dual-column generation studio
│   │   ├── services/
│   │   │   └── api.ts               # Frontend API client
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── README.md
├── data/
│   ├── sample_internships.json      # Pre-seeded internship roles
│   └── sample_resumes.json          # Pre-seeded candidate profiles
├── README.md
└── .gitignore
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check with database & LLM provider status |
| `GET` | `/api/v1/internships` | List internships with `query`, `work_mode`, `limit`, `offset` |
| `GET` | `/api/v1/internships/{internship_id}` | Retrieve complete details for a specific internship |
| `POST`| `/api/v1/internships/match` | Perform match analysis for candidate vs. internship |
| `GET` | `/api/v1/resumes/samples` | Retrieve preloaded sample candidate profiles |
| `GET` | `/api/v1/resumes/{candidate_id}` | Retrieve candidate resume from registry/external API |
| `POST`| `/api/v1/resumes` | Register a new candidate resume JSON payload |
| `POST`| `/api/v1/resumes/upload` | Upload resume file (`.pdf`, `.docx`, `.txt`) |
| `POST`| `/api/v1/cover-letters/generate` | Generate cover letter using `candidate_id` and `internship_id` |
| `POST`| `/api/v1/cover-letters/generate-from-resume` | Generate cover letter using supplied resume JSON |
| `GET` | `/api/v1/cover-letters/{cover_letter_id}` | Retrieve previously generated cover letter record |

---

## 7. Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) PostgreSQL database (SQLite works automatically out of the box)

### 1. Clone the Repository
```bash
git clone https://github.com/U-ARUN07/cover-letter-generation.git
cd cover-letter-generation
```

### 2. Backend Environment Configuration
Copy `.env.example` to `.env` in the `backend/` directory:
```bash
cp backend/.env.example backend/.env
```

Configure your API keys in `backend/.env`:
```ini
PROJECT_NAME="AI-Powered Cover Letter Generation"
API_V1_STR="/api/v1"
PORT=8000
HOST="0.0.0.0"

# Database Configuration (PostgreSQL supported, default fallback to SQLite)
DATABASE_URL="sqlite:///./cover_letter_app.db"
# For PostgreSQL:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cover_letter_db"

# LLM Provider: "gemini" or "openai"
LLM_PROVIDER="gemini"
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-1.5-flash"

# Optional OpenAI alternative:
OPENAI_API_KEY="your-openai-api-key-here"
OPENAI_MODEL="gpt-4o-mini"

# Resume Parsing API URL (if running https://github.com/U-ARUN07/resume-parsing-api)
RESUME_PARSING_API_URL="http://localhost:8001"
```

### 3. Install Backend Dependencies
```bash
python -m pip install -r backend/requirements.txt
```

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 8. Running the Application

### Start the Backend Server
```bash
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
- Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### Start the Frontend Web App
In a separate terminal window:
```bash
cd frontend
npm run dev
```
- Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## 9. Running Tests

Run the comprehensive Pytest test suite:
```bash
python -m pytest backend/tests -v
```

Run test suite with coverage report:
```bash
python -m pytest backend/tests --cov=app --cov-report=term-missing
```

### Actual Test Results:
```
============================= test session starts =============================
platform win32 -- Python 3.14.2, pytest-8.3.5, pluggy-1.6.0
collected 24 items

backend/tests/test_cover_letters.py::test_generate_cover_letter_success PASSED   [  4%]
backend/tests/test_cover_letters.py::test_generate_from_resume_success PASSED    [  8%]
backend/tests/test_cover_letters.py::test_generate_from_resume_empty_name PASSED [ 12%]
backend/tests/test_cover_letters.py::test_generate_from_resume_missing_internship PASSED [ 16%]
backend/tests/test_cover_letters.py::test_generate_cover_letter_missing_internship PASSED [ 20%]
backend/tests/test_cover_letters.py::test_generate_cover_letter_missing_candidate PASSED [ 25%]
backend/tests/test_cover_letters.py::test_get_cover_letter_not_found PASSED      [ 29%]
backend/tests/test_cover_letters.py::test_missing_api_key_configuration_error PASSED [ 33%]
backend/tests/test_internships.py::test_list_internships PASSED                  [ 37%]
backend/tests/test_internships.py::test_search_internships PASSED                [ 41%]
backend/tests/test_internships.py::test_filter_internships_by_work_mode PASSED  [ 45%]
backend/tests/test_internships.py::test_get_internship_detail_success PASSED    [ 50%]
backend/tests/test_internships.py::test_get_internship_detail_not_found PASSED  [ 54%]
backend/tests/test_internships.py::test_analyze_match_endpoint PASSED            [ 58%]
backend/tests/test_internships.py::test_health_check_endpoint PASSED             [ 62%]
backend/tests/test_matching.py::test_normalize_skill PASSED                      [ 66%]
backend/tests/test_matching.py::test_matching_service_finds_exact_and_synonym_skills PASSED [ 70%]
backend/tests/test_matching.py::test_matching_service_identifies_relevant_projects PASSED [ 75%]
backend/tests/test_matching.py::test_matching_service_empty_candidate_skills PASSED [ 79%]
backend/tests/test_resume.py::test_get_sample_resumes PASSED                     [ 83%]
backend/tests/test_resume.py::test_get_resume_by_id PASSED                       [ 87%]
backend/tests/test_resume.py::test_get_resume_not_found PASSED                   [ 91%]
backend/tests/test_resume.py::test_register_new_resume PASSED                    [ 95%]
backend/tests/test_resume.py::test_extract_structured_resume_from_text PASSED   [100%]

======================= 24 passed in 0.27s =======================
```

---

## 10. Example Request and Response

### Request: Generate Cover Letter
`POST /api/v1/cover-letters/generate`

```json
{
  "candidate_id": "CAND-001",
  "internship_id": "INT-INF-002",
  "tone": "professional"
}
```

### Response
```json
{
  "cover_letter_id": "CL-8F2D05C7A14E",
  "candidate_id": "CAND-001",
  "candidate_name": "Arun Kumar",
  "internship_id": "INT-INF-002",
  "internship_title": "Full Stack AI Application Intern",
  "company_name": "Infosys Springboard AI Labs",
  "matching_skills": [
    "Python",
    "FastAPI",
    "React",
    "TypeScript",
    "LangChain",
    "Tailwind CSS",
    "PostgreSQL"
  ],
  "relevant_projects": [
    "Internship Application AI Agent (Python, FastAPI, LangChain, React, PostgreSQL, Tailwind CSS): Engineered an end-to-end intelligent agent using LangChain, FastAPI, and React that parses candidate resumes and generates personalized, role-specific cover letters tailored to internship postings.",
    "DocuChat - RAG Knowledge Assistant (Python, LangChain, FAISS, Streamlit, Gemini API): Built a conversational document Q&A application integrating vector similarity search with FAISS, LangChain text splitters, and Gemini API for grounded context retrieval."
  ],
  "relevant_experience": [
    "Software Engineering Intern at TechSprint Labs (May 2024 - July 2024): Collaborated with the backend engineering team to develop microservices in FastAPI, implemented asynchronous endpoints, and optimized PostgreSQL database queries for high concurrency. | Achievements: Reduced API latency by 28% by refactoring SQLAlchemy ORM queries and indexing key tables.; Implemented automated CI testing with Pytest achieving 92% code coverage."
  ],
  "cover_letter": "Dear Hiring Team at Infosys Springboard AI Labs,\n\nI am writing to express my enthusiastic interest in the Full Stack AI Application Intern opportunity with Infosys Springboard AI Labs. As a Computer Science undergraduate with hands-on experience developing asynchronous web backends and intelligent generative AI pipelines, I am eager to apply my skills in Python, FastAPI, React, and LangChain to support your team's mission in building enterprise-grade intelligent applications.\n\nDuring my previous internship at TechSprint Labs, I contributed to high-throughput backend services using FastAPI and PostgreSQL, successfully optimizing SQLAlchemy queries to decrease endpoint latency by 28%. Additionally, my recent project, the Internship Application AI Agent, directly mirrors your core stack—integrating LangChain workflows with responsive TypeScript and React interfaces to parse unstructured data and execute contextual LLM generation. Through DocuChat, I also gained practical experience implementing Retrieval-Augmented Generation (RAG) with vector search and Google Gemini API.\n\nI am inspired by Infosys Springboard's leadership in enterprise digital innovation and would welcome the opportunity to contribute to your agile engineering cycles. Thank you for your time and consideration. I look forward to the possibility of discussing how my technical background and proactive mindset align with your team's objectives.\n\nSincerely,\nArun Kumar",
  "generated_at": "2026-11-16T21:32:00.123456"
}
```

---

## 11. Sample Generated Cover Letter

```
Arun Kumar
arun.kumar.dev@example.com • +91 98765 43210
November 16, 2026

Hiring Team
Infosys Springboard AI Labs
Role: Full Stack AI Application Intern

Dear Hiring Team at Infosys Springboard AI Labs,

I am writing to express my enthusiastic interest in the Full Stack AI Application Intern opportunity with Infosys Springboard AI Labs. As a Computer Science undergraduate with hands-on experience developing asynchronous web backends and intelligent generative AI pipelines, I am eager to apply my skills in Python, FastAPI, React, and LangChain to support your team's mission in building enterprise-grade intelligent applications.

During my previous internship at TechSprint Labs, I contributed to high-throughput backend services using FastAPI and PostgreSQL, successfully optimizing SQLAlchemy queries to decrease endpoint latency by 28%. Additionally, my recent project, the Internship Application AI Agent, directly mirrors your core stack—integrating LangChain workflows with responsive TypeScript and React interfaces to parse unstructured data and execute contextual LLM generation. Through DocuChat, I also gained practical experience implementing Retrieval-Augmented Generation (RAG) with vector search and Google Gemini API.

I am inspired by Infosys Springboard's leadership in enterprise digital innovation and would welcome the opportunity to contribute to your agile engineering cycles. Thank you for your time and consideration. I look forward to the possibility of discussing how my technical background and proactive mindset align with your team's objectives.

Sincerely,
Arun Kumar
```

---

## 12. Limitations & Future Roadmap

1. **Third-Party Rate Limits**: LLM generation depends on external API quotas from Google Gemini or OpenAI; high-volume enterprise deployments should incorporate token bucket rate limiting or local open-weights fallbacks (e.g., Ollama / LLaMA-3).
2. **OCR for Scanned Resumes**: Current document parsing operates on direct text layers in PDFs and DOCX files. Scanned image-only PDFs require an OCR preprocessing engine (such as Tesseract or AWS Textract).
3. **Multi-Language Generation**: The prompt templates are optimized for English; adding multi-lingual prompts for international internship portals is planned for future releases.

---

## 13. License

Developed for the **Infosys Springboard Virtual Internship Program 7.0**. All rights reserved.
