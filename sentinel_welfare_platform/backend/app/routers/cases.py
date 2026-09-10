import json
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Case, Personnel, RiskAssessment
from app.schemas import CaseTransitionRequest, CaseResponse
from app.auth import enforce_mo_scope

router = APIRouter(prefix="/cases", tags=["Case Management (Human-in-the-Loop)"])

@router.get("", response_model=List[CaseResponse])
def get_cases(status_filter: str = None, db: Session = Depends(get_db), user: dict = Depends(enforce_mo_scope)):
    """Retrieve all flagged welfare cases for the Medical Officer's live queue."""
    query = db.query(Case).join(Personnel).join(RiskAssessment)
    if status_filter:
        query = query.filter(Case.status == status_filter)
    cases = query.order_by(Case.created_at.desc()).all()
    
    out = []
    for c in cases:
        p = c.personnel
        r = c.risk_assessment
        factors = json.loads(r.top_factors) if r.top_factors else []
        out.append(CaseResponse(
            id=c.id,
            personnel_id=p.id,
            personnel_name=p.name,
            personnel_rank=p.rank,
            unit_type=p.unit_type,
            deployment_theatre=p.deployment_theatre,
            risk_tier=r.risk_tier,
            risk_color=r.risk_color,
            confidence=r.confidence,
            top_factors=factors,
            status=c.status,
            assigned_mo_id=c.assigned_mo_id,
            clinical_notes=c.clinical_notes or "",
            action_plan=c.action_plan or "",
            created_at=c.created_at,
            acknowledged_at=c.acknowledged_at,
            resolved_at=c.resolved_at
        ))
    return out

@router.post("/{case_id}/transition", response_model=CaseResponse)
def transition_case_status(
    case_id: int,
    req: CaseTransitionRequest,
    db: Session = Depends(get_db),
    user: dict = Depends(enforce_mo_scope)
):
    """
    Human-in-the-loop transition:
    Acknowledged -> In Progress -> Resolved
    Requires human Medical Officer interaction and clinical notes.
    """
    case = db.query(Case).filter_by(id=case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    valid_transitions = {
        "Acknowledged": ["In Progress", "Resolved"],
        "In Progress": ["Resolved", "Acknowledged"],
        "Resolved": ["In Progress"]
    }
    
    now = datetime.datetime.utcnow()
    case.status = req.status
    case.clinical_notes = (case.clinical_notes + f"\n[{now.strftime('%Y-%m-%d %H:%M')}] {req.clinical_notes}").strip()
    case.action_plan = req.action_plan
    case.assigned_mo_id = req.assigned_mo_id or user.get("sub", "MO-DUTY")
    
    if not case.acknowledged_at:
        case.acknowledged_at = now
    if req.status == "Resolved":
        case.resolved_at = now
        
    db.commit()
    db.refresh(case)
    
    p = case.personnel
    r = case.risk_assessment
    factors = json.loads(r.top_factors) if r.top_factors else []
    
    return CaseResponse(
        id=case.id,
        personnel_id=p.id,
        personnel_name=p.name,
        personnel_rank=p.rank,
        unit_type=p.unit_type,
        deployment_theatre=p.deployment_theatre,
        risk_tier=r.risk_tier,
        risk_color=r.risk_color,
        confidence=r.confidence,
        top_factors=factors,
        status=case.status,
        assigned_mo_id=case.assigned_mo_id,
        clinical_notes=case.clinical_notes,
        action_plan=case.action_plan,
        created_at=case.created_at,
        acknowledged_at=case.acknowledged_at,
        resolved_at=case.resolved_at
    )
