from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.services.ml_engine import ml_engine
from app.routers import ml, personnel, cases, soldier, family, chatbot, signaling, auth_portal

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("[Lifespan] Database initialized.")
    print(f"[Lifespan] ML Engine ready with {len(ml_engine.feature_names)} features.")
    yield
    print("[Lifespan] Server shutdown cleanly.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Predictive Personnel Stress & Welfare Monitoring System (Team Mavericks, SIH 2026, PS 26186)",
    lifespan=lifespan
)

def get_cors_origins() -> list[str]:
    """
    Computes explicitly allowed CORS origins.
    Permits wildcard '*' or explicitly declared origins to enable cross-domain requests.
    """
    if settings.CORS_ORIGINS:
        origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
        if origins:
            return origins
    return ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_portal.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)
app.include_router(personnel.router, prefix=settings.API_V1_STR)
app.include_router(cases.router, prefix=settings.API_V1_STR)
app.include_router(soldier.router, prefix=settings.API_V1_STR)
app.include_router(family.router, prefix=settings.API_V1_STR)
app.include_router(chatbot.router, prefix=settings.API_V1_STR)
app.include_router(signaling.router, prefix=settings.API_V1_STR)

from sqlalchemy import text
from fastapi.responses import JSONResponse

def perform_health_check():
    db_status = "connected"
    ml_status = "loaded" if ml_engine.model is not None else "not_loaded"
    is_healthy = True

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = f"unhealthy: {str(exc)}"
        is_healthy = False

    if ml_status != "loaded":
        is_healthy = False

    status_code = 200 if is_healthy else 503
    payload = {
        "status": "healthy" if is_healthy else "unhealthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "db": db_status,
        "ml_model": ml_status,
        "features_loaded": len(ml_engine.feature_names)
    }
    return JSONResponse(status_code=status_code, content=payload)

@app.get("/health")
def health_check():
    return perform_health_check()

@app.get("/api/health")
def api_health_check():
    return perform_health_check()

