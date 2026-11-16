from app.routes.internships import router as internships_router
from app.routes.cover_letters import router as cover_letters_router
from app.routes.resumes import router as resumes_router

__all__ = [
    "internships_router",
    "cover_letters_router",
    "resumes_router",
]
