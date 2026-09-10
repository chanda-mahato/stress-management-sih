import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentinel Welfare Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sentinel.db")
    
    # JWT Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "REDACTED_SECRET")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    FAMILY_TOKEN_EXPIRE_MINUTES: int = 60 * 4   # 4 hours
    
    # Coturn & WebRTC (§6a Security Directive)
    TURN_SECRET: str = os.getenv("TURN_SECRET", "REDACTED_SECRET")
    TURN_HOST: str = os.getenv("TURN_HOST", "localhost")
    TURN_PORT: int = int(os.getenv("TURN_PORT", "3478"))
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODEL_PATH: str = os.path.join(BASE_DIR, "ml_service", "wsi_production_model.cbm")
    FEATURE_SCHEMA_PATH: str = os.path.join(BASE_DIR, "ml_service", "feature_schema.json")
    
    # Redis (Optional, ephemeral memory fallback active)
    REDIS_URL: str = os.getenv("REDIS_URL", "")

settings = Settings()
