import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.services.resume_service import ResumeService
from app.routes.internships import router as internships_router
from app.routes.cover_letters import router as cover_letters_router
from app.routes.resumes import router as resumes_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions:
    logger.info("Initializing database and seeding sample internships...")
    init_db()
    logger.info("Initializing sample candidate resume registry...")
    ResumeService.initialize_registry()
    yield
    logger.info("Application shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Cover Letter Generation System for Infosys Springboard Virtual Internship Program 7.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev / frontend preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(internships_router, prefix=settings.API_V1_STR)
app.include_router(cover_letters_router, prefix=settings.API_V1_STR)
app.include_router(resumes_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify system status and configuration."""
    has_gemini = bool(settings.GEMINI_API_KEY)
    has_openai = bool(settings.OPENAI_API_KEY)
    is_ollama = settings.LLM_PROVIDER == "ollama"
    active_key_configured = (
        (settings.LLM_PROVIDER == "gemini" and has_gemini) or
        (settings.LLM_PROVIDER == "openai" and has_openai) or
        is_ollama
    )

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_configured": active_key_configured,
        "gemini_configured": has_gemini,
        "openai_configured": has_openai,
        "ollama_configured": is_ollama,
        "database": "connected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
