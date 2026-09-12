import json
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Case, Personnel, RiskAssessment, CaseAccessLog
from app.schemas import CaseTransitionRequest, CaseResponse, CaseAccessLogResponse
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
            resolved_at=c.resolved_at,
            flagged_personnel_objection=c.flagged_personnel_objection,
            objection_filed_at=c.objection_filed_at
        ))
    return out

@router.get("/{case_id}", response_model=CaseResponse)
def get_case_detail(case_id: int, db: Session = Depends(get_db), user: dict = Depends(enforce_mo_scope)):
    """
    Retrieve single case details.
    MHA Audit Log: Automatically records a 'viewed' action in CaseAccessLog.
    """
    case = db.query(Case).filter_by(id=case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    viewer_id = user.get("sub") or user.get("officer_id") or "MO-DUTY-OFFICER"
    audit = CaseAccessLog(
        case_id=case.id,
        accessed_by=viewer_id,
        action="viewed",
        accessed_at=datetime.datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    db.refresh(case)
    
    p = case.personnel
    r = case.risk_assessment
    factors = json.loads(r.top_factors) if (r and r.top_factors) else []
    
    return CaseResponse(
        id=case.id,
        personnel_id=p.id if p else case.personnel_id,
        personnel_name=p.name if p else f"Personnel #{case.personnel_id}",
        personnel_rank=p.rank if p else "Jawan",
        unit_type=p.unit_type if p else "CAPF Battalion",
        deployment_theatre=p.deployment_theatre if p else "Northern Command",
        risk_tier=r.risk_tier if r else "Medium",
        risk_color=r.risk_color if r else "Orange",
        confidence=r.confidence if r else 0.85,
        top_factors=factors,
        status=case.status,
        assigned_mo_id=case.assigned_mo_id,
        clinical_notes=case.clinical_notes or "",
        action_plan=case.action_plan or "",
        created_at=case.created_at,
        acknowledged_at=case.acknowledged_at,
        resolved_at=case.resolved_at,
        flagged_personnel_objection=case.flagged_personnel_objection,
        objection_filed_at=case.objection_filed_at
    )

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
    Logs 'status_changed' and 'notes_added' to CaseAccessLog.
    """
    case = db.query(Case).filter_by(id=case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    now = datetime.datetime.utcnow()
    mo_id = req.assigned_mo_id or user.get("sub", "MO-DUTY")
    
    status_changed = (case.status != req.status)
    notes_added = bool(req.clinical_notes and req.clinical_notes.strip())
    
    case.status = req.status
    if notes_added:
        case.clinical_notes = (case.clinical_notes + f"\n[{now.strftime('%Y-%m-%d %H:%M')}] {req.clinical_notes}").strip()
    case.action_plan = req.action_plan
    case.assigned_mo_id = mo_id
    
    if not case.acknowledged_at:
        case.acknowledged_at = now
    if req.status == "Resolved":
        case.resolved_at = now
        
    if status_changed:
        db.add(CaseAccessLog(
            case_id=case.id,
            accessed_by=mo_id,
            action="status_changed",
            accessed_at=now
        ))
    if notes_added:
        db.add(CaseAccessLog(
            case_id=case.id,
            accessed_by=mo_id,
            action="notes_added",
            accessed_at=now
        ))
        
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
        resolved_at=case.resolved_at,
        flagged_personnel_objection=case.flagged_personnel_objection,
        objection_filed_at=case.objection_filed_at
    )

@router.get("/{case_id}/access-logs", response_model=List[CaseAccessLogResponse])
def get_case_access_logs(
    case_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(enforce_mo_scope)
):
    """
    Admin/MO-only endpoint: Retrieve full immutable audit trail for a given case.
    Shows who viewed, modified, or annotated the case.
    """
    case = db.query(Case).filter_by(id=case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    logs = db.query(CaseAccessLog).filter_by(case_id=case_id).order_by(CaseAccessLog.accessed_at.desc()).all()
    return logs
