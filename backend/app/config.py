import os
from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_DB_PATH = (_BACKEND_DIR / "reviveai.db").as_posix()

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

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v):
        if not v or not str(v).strip():
            return f"sqlite:///{_DEFAULT_DB_PATH}"
        return str(v).strip()

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
