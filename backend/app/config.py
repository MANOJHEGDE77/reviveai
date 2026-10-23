import os
from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_IS_VERCEL = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
_DEFAULT_DB_PATH = "/tmp/reviveai.db" if _IS_VERCEL else (_BACKEND_DIR / "reviveai.db").as_posix()

from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "ReviveAI - Autonomous Revenue Recovery Platform"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = f"sqlite:///{_DEFAULT_DB_PATH}"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("AI_API_KEY", ""))
    
    # Financial Action Guardrails (Deterministic Business Bounds)
    MAX_RETRIES: int = 2
    MAX_NOTIFICATIONS: int = 1
    APPROVAL_THRESHOLD_INR: float = 50000.0  # ₹50,000+ mandates human approval
    RECOVERY_WINDOW_HOURS: int = 24
    AUTO_TERMINATE_ON_SUCCESS: bool = True

    # Security & CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://reviveai.vercel.app"
    ]
    STRICT_AUTH: bool = False
    DEV_AUTO_AUTH: bool = True

    # Honest Payment Provider Configuration
    # Modes: "simulation", "razorpay_test", "razorpay_live"
    PAYMENT_PROVIDER_MODE: str = os.getenv("PAYMENT_PROVIDER_MODE", "simulation")
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")

    # Idempotency & Scheduler
    IDEMPOTENCY_EXPIRY_SECONDS: int = 86400
    RETRY_SCHEDULER_ENABLED: bool = True

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v):
        if not v or not str(v).strip():
            return f"sqlite:///{_DEFAULT_DB_PATH}"
        return str(v).strip()

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
