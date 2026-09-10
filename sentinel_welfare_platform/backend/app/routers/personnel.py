import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Personnel, RiskAssessment
from app.auth import enforce_mo_scope
from app.services.ml_engine import ml_engine

router = APIRouter(prefix="/personnel", tags=["Personnel Management"])

@router.get("")
def list_personnel(db: Session = Depends(get_db), user: dict = Depends(enforce_mo_scope)):
    """List personnel records with their latest risk status (MO/Admin only)."""
    personnel_list = db.query(Personnel).limit(100).all()
    out = []
    for p in personnel_list:
        latest_risk = db.query(RiskAssessment).filter_by(personnel_id=p.id).order_by(RiskAssessment.computed_at.desc()).first()
        out.append({
            "id": p.id,
            "service_id_hash": p.service_id_hash[:12] + "...",
            "name": p.name,
            "rank": p.rank,
            "unit_type": p.unit_type,
            "deployment_theatre": p.deployment_theatre,
            "leave_backlog_days": p.leave_backlog_days,
            "consecutive_night_duty_days": p.consecutive_night_duty_days,
            "duty_hours_daily": p.duty_hours_daily,
            "rest_hours_daily": p.rest_hours_daily,
            "family_separation_months": p.family_separation_months,
            "latest_risk": {
                "risk_tier": latest_risk.risk_tier if latest_risk else "Pending",
                "risk_color": latest_risk.risk_color if latest_risk else "Gray",
                "confidence": latest_risk.confidence if latest_risk else 0.0,
                "top_factors": json.loads(latest_risk.top_factors) if latest_risk else []
            } if latest_risk else None
        })
    return out

@router.get("/{personnel_id}")
def get_personnel_detail(personnel_id: int, db: Session = Depends(get_db), user: dict = Depends(enforce_mo_scope)):
    p = db.query(Personnel).filter_by(id=personnel_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Personnel not found")
    latest_risk = db.query(RiskAssessment).filter_by(personnel_id=p.id).order_by(RiskAssessment.computed_at.desc()).first()
    return {
        "personnel": p,
        "latest_risk": latest_risk
    }
