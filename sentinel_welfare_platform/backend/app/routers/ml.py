from fastapi import APIRouter, HTTPException, Depends
from app.schemas import PredictRequest, PredictResponse
from app.services.ml_engine import ml_engine
from app.auth import enforce_mo_scope

router = APIRouter(prefix="/ml", tags=["Machine Learning Inference"])

@router.post("/predict", response_model=PredictResponse)
def predict_welfare_risk(req: PredictRequest, user: dict = Depends(enforce_mo_scope)):
    """
    Evaluates 46 operational telemetry features.
    Restricted to Medical Officers and Unit Command.
    Returns:
    - risk_tier: Low, Medium, High
    - risk_color: Green, Yellow, Orange (if Medium and P(High)>=0.30), Red
    - confidence: float
    - top_factors: top 3 SHAP drivers with human-readable descriptions
    """
    try:
        res = ml_engine.predict(req.features)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference error: {str(e)}")
