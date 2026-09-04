from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional, List


class Settings(BaseSettings):
    PROJECT_NAME: str = "PayFixor Agent"
    API_V1_STR: str = "/api"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    SECRET_KEY: str = "change-this-to-a-strong-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = "sqlite+aiosqlite:///./payfixor.db"

    GEMINI_API_KEY: Optional[str] = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    ALLOWED_ORIGINS: List[str] = ["http://localhost:8000", "http://127.0.0.1:8000"]

    MIN_SAMPLE_SIZE: int = 50
    MIN_ANOMALY_RATIO: float = 2.0
    MIN_CONFIDENCE_THRESHOLD: float = 0.85
    HIGH_VALUE_THRESHOLD: float = 10000.0
    MAX_AUTO_RECOVERY_ATTEMPTS: int = 1
    MAX_CUSTOMER_RECOVERY_ATTEMPTS: int = 2

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
