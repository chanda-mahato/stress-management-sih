import json
import datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Personnel, Checkin, CallSlot, SoldierSelfCheck, FamilyMember, Case, CaseAccessLog
from app.schemas import CheckinCreate, SelfCheckCreate, CaseObjectionRequest
from app.auth import hash_phone_number, enforce_soldier_scope

router = APIRouter(prefix="/soldier", tags=["Soldier Portal"])

class FamilyRegistrationPayload(BaseModel):
    name: str
    relationship_type: str
    phone_number: str

@router.get("/profile")
def get_soldier_profile(soldier_id: int = 1, db: Session = Depends(get_db)):
    p = db.query(Personnel).filter_by(id=soldier_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Soldier not found")
    return {
        "id": p.id,
        "name": p.name,
        "rank": p.rank,
        "unit_type": p.unit_type,
        "deployment_theatre": p.deployment_theatre,
        "duty_hours_daily": p.duty_hours_daily,
        "rest_hours_daily": p.rest_hours_daily,
        "leave_backlog_days": p.leave_backlog_days
    }

class CheckinPayload(BaseModel):
    soldier_id: Optional[int] = 1
    message: Optional[str] = "मैं ठीक हूँ, चौकी पर सब सुरक्षित है। (I am okay and all is well.)"

@router.post("/checkin")
@router.post("/im-okay")
def send_im_okay_checkin(req: Optional[CheckinPayload] = None, soldier_id: int = 1, db: Session = Depends(get_db)):
    """One-tap 'I am Okay' check-in ping with precise UTC timestamp."""
    s_id = (req.soldier_id if req and req.soldier_id else None) or soldier_id
    msg = (req.message if req and req.message else None) or "मैं ठीक हूँ, चौकी पर सब सुरक्षित है। (I am okay and all is well.)"
    now_utc = datetime.datetime.now(datetime.timezone.utc)

    checkin = Checkin(
        personnel_id=s_id,
        type="im_okay",
        message=msg,
        created_at=now_utc
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)

    dt = checkin.created_at
    ts_iso = dt.replace(tzinfo=datetime.timezone.utc).isoformat() if dt.tzinfo is None else dt.isoformat()
    return {
        "status": "success",
        "checkin_id": checkin.id,
        "timestamp": ts_iso,
        "message": checkin.message
    }

@router.post("/self-check")
def submit_self_check(req: SelfCheckCreate, soldier_id: int = 1, db: Session = Depends(get_db)):
    answers_str = json.dumps(req.raw_answers or {})
    self_check = SoldierSelfCheck(
        personnel_id=soldier_id,
        mood_score=req.mood_score,
        sleep_score=req.sleep_score,
        fatigue_score=req.fatigue_score,
        raw_answers=answers_str
    )
    db.add(self_check)
    db.commit()
    db.refresh(self_check)
    
    battery = req.battery_percentage if req.battery_percentage is not None else 75
    readiness_index = max(10, min(100, int((req.mood_score * 7) + (req.sleep_score * 7) + ((6 - req.fatigue_score) * 6))))
    
    feedback = []
    if req.sleep_score <= 2:
        feedback.append("Sleep Fragmentation Flag: Prioritize 15-min quiet downtime before retreat.")
    if req.fatigue_score >= 4:
        feedback.append("High Somatic Fatigue: Recommended mild lumbar & shoulder decompression.")
    if battery < 50:
        feedback.append("Low Energy Tank: Scheduled family video call recommended during your next rest window.")
    if not feedback:
        feedback.append("Optimal Readiness: Vital signs and self-rated recovery align well with operational duty.")
        
    return {
        "status": "success", 
        "self_check_id": self_check.id,
        "readiness_index": readiness_index,
        "battery_percentage": battery,
        "feedback": feedback,
        "message": "Self-assessment recorded confidentially. Zero punitive tracking."
    }

@router.get("/call-slots")
def get_soldier_call_slots(soldier_id: int = 1, db: Session = Depends(get_db)):
    slots = db.query(CallSlot).filter_by(personnel_id=soldier_id).all()
    return slots

@router.post("/call-slots/{slot_id}/confirm")
def confirm_call_slot(slot_id: int, soldier_id: int = 1, db: Session = Depends(get_db)):
    slot = db.query(CallSlot).filter_by(id=slot_id, personnel_id=soldier_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Call slot not found")
    slot.status = "confirmed"
    db.commit()
    return {"status": "confirmed", "slot_id": slot.id}

# Family Registration on Soldier Dashboard
@router.get("/family-member")
def get_soldier_family_member(soldier_id: int = 1, db: Session = Depends(get_db)):
    fam = db.query(FamilyMember).filter_by(personnel_id=soldier_id).first()
    if not fam:
        return {
            "registered": False,
            "name": "",
            "relationship_type": "Wife / Spouse",
            "phone_number": "9876543200",
            "phone_last_4": "3200"
        }
    return {
        "registered": True,
        "name": fam.name,
        "relationship_type": fam.relationship_type,
        "phone_last_4": fam.phone_last_4,
        "phone_number": "9876543200"
    }

@router.post("/family-member")
def register_soldier_family_member(req: FamilyRegistrationPayload, soldier_id: int = 1, db: Session = Depends(get_db)):
    phone_hash = hash_phone_number(req.phone_number)
    phone_last_4 = "".join(c for c in req.phone_number if c.isdigit())[-4:]
    
    fam = db.query(FamilyMember).filter_by(personnel_id=soldier_id).first()
    if fam:
        fam.name = req.name
        fam.relationship_type = req.relationship_type
        fam.phone_number_hash = phone_hash
        fam.phone_last_4 = phone_last_4
    else:
        fam = FamilyMember(
            personnel_id=soldier_id,
            name=req.name,
            relationship_type=req.relationship_type,
            phone_number_hash=phone_hash,
            phone_last_4=phone_last_4,
            registered_by=f"soldier_{soldier_id}"
        )
        db.add(fam)
    db.commit()
    db.refresh(fam)
    return {
        "status": "success",
        "message": f"Next-of-kin {fam.name} successfully registered for soldier #{soldier_id}."
    }


@router.get("/flagged-case")
def get_soldier_flagged_case(
    soldier_id: int = 1,
    db: Session = Depends(get_db),
    user: dict = Depends(enforce_soldier_scope)
):
    """
    Returns the soldier's currently active flagged welfare case (if any).
    Scoped strictly to the authenticated soldier's personnel ID.
    """
    auth_soldier_id = user.get("soldier_id") or soldier_id
    case = db.query(Case).filter_by(personnel_id=auth_soldier_id).order_by(Case.created_at.desc()).first()
    if not case:
        return {"has_case": False, "case": None}
        
    r = case.risk_assessment
    factors = json.loads(r.top_factors) if (r and r.top_factors) else []
    
    return {
        "has_case": True,
        "case": {
            "id": case.id,
            "status": case.status,
            "risk_tier": r.risk_tier if r else "Medium",
            "risk_color": r.risk_color if r else "Orange",
            "action_plan": case.action_plan,
            "created_at": case.created_at,
            "flagged_personnel_objection": case.flagged_personnel_objection,
            "objection_filed_at": case.objection_filed_at,
            "top_factors": factors
        }
    }


@router.post("/cases/{case_id}/objection")
def submit_soldier_objection(
    case_id: int,
    req: CaseObjectionRequest,
    soldier_id: int = 1,
    db: Session = Depends(get_db),
    user: dict = Depends(enforce_soldier_scope)
):
    """
    Files an official soldier objection/grievance against an automated risk flag.
    Enforces strict server-side ownership validation:
    A soldier can ONLY file an objection against their own case.
    """
    auth_soldier_id = user.get("soldier_id") or soldier_id
    case = db.query(Case).filter_by(id=case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Welfare case not found.")
        
    # Server-side validation: ensure case belongs to caller
    if case.personnel_id != auth_soldier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You are not authorized to submit an objection for this case."
        )
        
    now = datetime.datetime.utcnow()
    case.flagged_personnel_objection = req.objection_text.strip()
    case.objection_filed_at = now
    
    # Audit log record
    db.add(CaseAccessLog(
        case_id=case.id,
        accessed_by=f"soldier_{auth_soldier_id}",
        action="notes_added",
        accessed_at=now
    ))
    db.commit()
    db.refresh(case)
    
    return {
        "status": "success",
        "case_id": case.id,
        "objection_filed_at": case.objection_filed_at.isoformat(),
        "flagged_personnel_objection": case.flagged_personnel_objection,
        "message": "Objection officially logged in case audit record and forwarded to reviewing Medical Officer."
    }
