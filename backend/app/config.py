import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "ReviveAI - Autonomous Revenue Recovery Platform"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./reviveai.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("AI_API_KEY", ""))
    
    # Financial Action Guardrails (Deterministic Business Bounds)
    MAX_RETRIES: int = 2
    MAX_NOTIFICATIONS: int = 1
    APPROVAL_THRESHOLD_INR: float = 50000.0  # ₹50,000+ mandates human approval
    RECOVERY_WINDOW_HOURS: int = 24
    AUTO_TERMINATE_ON_SUCCESS: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
