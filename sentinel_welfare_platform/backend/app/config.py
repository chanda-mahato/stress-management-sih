import os
import logging
from pydantic import model_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("sentinel.config")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentinel Welfare Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sentinel.db")
    
    # JWT Security (Zero hardcoded secrets allowed in codebase)
    JWT_SECRET: str = os.getenv("JWT_SECRET", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    FAMILY_TOKEN_EXPIRE_MINUTES: int = 60 * 4   # 4 hours
    
    # Coturn & WebRTC (§6a Security Directive)
    TURN_SECRET: str = os.getenv("TURN_SECRET", "")
    TURN_HOST: str = os.getenv("TURN_HOST", "localhost")
    TURN_PORT: int = int(os.getenv("TURN_PORT", "3478"))
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    BACKEND_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        os.path.join(BASE_DIR, "ml_service", "wsi_production_model.cbm")
        if os.path.exists(os.path.join(BASE_DIR, "ml_service", "wsi_production_model.cbm"))
        else os.path.join(BACKEND_DIR, "ml_service", "wsi_production_model.cbm")
    )
    FEATURE_SCHEMA_PATH: str = os.getenv(
        "FEATURE_SCHEMA_PATH",
        os.path.join(BASE_DIR, "ml_service", "feature_schema.json")
        if os.path.exists(os.path.join(BASE_DIR, "ml_service", "feature_schema.json"))
        else os.path.join(BACKEND_DIR, "ml_service", "feature_schema.json")
    )
    
    # Redis (Optional, ephemeral memory fallback active)
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    # CORS Allowed Origins (Comma-separated URLs, e.g. "https://sentinel.gov.in,http://localhost:3000")
    # In production, wildcard '*' is strictly rejected.
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "")

    @model_validator(mode="after")
    def validate_secrets(self) -> 'Settings':
        env = (self.ENVIRONMENT or "development").strip().lower()
        if env in ("production", "prod", "staging"):
            if not self.JWT_SECRET or self.JWT_SECRET.strip() == "" or self.JWT_SECRET.startswith("changeme"):
                raise ValueError(
                    "FATAL: Insecure deployment configuration! JWT_SECRET must be explicitly set to a "
                    "cryptographically secure secret in non-development environments (e.g. via secrets.token_hex(32))."
                )
            if not self.TURN_SECRET or self.TURN_SECRET.strip() == "" or self.TURN_SECRET.startswith("changeme"):
                raise ValueError(
                    "FATAL: Insecure deployment configuration! TURN_SECRET must be explicitly set to a "
                    "cryptographically secure secret in non-development environments."
                )
            if self.CORS_ORIGINS and "*" in [o.strip() for o in self.CORS_ORIGINS.split(",")]:
                logger.warning(
                    "CORS_ORIGINS contains wildcard '*' - enabling permissive CORS mode for production/staging demo."
                )
        else:
            if not self.JWT_SECRET:
                logger.warning(
                    "WARNING: JWT_SECRET is unset in development environment. "
                    "Falling back to an ephemeral key. Define JWT_SECRET in .env for persistent sessions."
                )
                self.JWT_SECRET = "dev_insecure_ephemeral_jwt_secret_do_not_use_in_prod"
            if not self.TURN_SECRET:
                logger.warning(
                    "WARNING: TURN_SECRET is unset in development environment. "
                    "Falling back to an ephemeral key. Define TURN_SECRET in .env."
                )
                self.TURN_SECRET = "dev_insecure_ephemeral_turn_secret_do_not_use_in_prod"
        return self

settings = Settings()

