import logging
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env", override=False)

from app.api.routes import router as chat_router

if not logging.getLogger().handlers:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

def _cors_origins() -> list[str]:
    raw = os.getenv("CHATBOT_CORS_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


logger = logging.getLogger(__name__)

app = FastAPI(
    title="Pharmacy AI Chatbot API",
    description="Advanced RAG backend for online pharmacy consulting and product search.",
    version="1.0.0"
)

cors_origins = _cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/v1")


@app.on_event("startup")
def startup_event() -> None:
    logger.info(
        "[chatbot-ai][startup] env_status GOOGLE_CLOUD_API_KEY=%s POSTGRES_URL=%s",
        "set" if bool((os.getenv("GOOGLE_CLOUD_API_KEY") or "").strip()) else "missing",
        "set" if bool((os.getenv("POSTGRES_URL") or "").strip()) else "missing",
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AI Service is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
