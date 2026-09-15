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

@router.get("/self-check-status")
@router.get("/self-check/status")
def get_self_check_status(
    soldier_id: int = 1,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(enforce_soldier_scope)
):
    """Checks whether the soldier is currently eligible to submit a monthly self-assessment."""
    auth_soldier_id = user.get("soldier_id") if user else soldier_id
    last_check = db.query(SoldierSelfCheck).filter_by(personnel_id=auth_soldier_id).order_by(SoldierSelfCheck.created_at.desc()).first()
    
    if not last_check or not last_check.created_at:
        return {
            "can_submit": True,
            "last_submitted_at": None,
            "next_available_date": None,
            "days_remaining": 0
        }
        
    now = datetime.datetime.utcnow()
    created = last_check.created_at.replace(tzinfo=None) if hasattr(last_check.created_at, "replace") else now
    diff_days = (now - created).days
    
    if diff_days < 30:
        next_date_dt = created + datetime.timedelta(days=30)
        next_date_str = next_date_dt.strftime("%d %B %Y")
        return {
            "can_submit": False,
            "last_submitted_at": created.strftime("%d %B %Y"),
            "next_available_date": next_date_str,
            "days_remaining": 30 - diff_days
        }
        
    return {
        "can_submit": True,
        "last_submitted_at": created.strftime("%d %B %Y"),
        "next_available_date": None,
        "days_remaining": 0
    }

@router.post("/self-check")
def submit_self_check(
    req: SelfCheckCreate,
    soldier_id: int = 1,
    db: Session = Depends(get_db),
    user: Optional[dict] = Depends(enforce_soldier_scope)
):
    auth_soldier_id = user.get("soldier_id") if user else soldier_id
    
    # 1. Enforce actual 30-day monthly cadence (Reject if < 30 days since last submission)
    last_check = db.query(SoldierSelfCheck).filter_by(personnel_id=auth_soldier_id).order_by(SoldierSelfCheck.created_at.desc()).first()
    if last_check and last_check.created_at:
        now = datetime.datetime.utcnow()
        created = last_check.created_at.replace(tzinfo=None) if hasattr(last_check.created_at, "replace") else now
        diff_days = (now - created).days
        if diff_days < 30:
            next_date_dt = created + datetime.timedelta(days=30)
            next_date_str = next_date_dt.strftime("%d %B %Y")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Your next assessment window opens on {next_date_str}."
            )

    answers_str = json.dumps(req.raw_answers or {})
    self_check = SoldierSelfCheck(
        personnel_id=auth_soldier_id,
        mood_score=req.mood_score,
        sleep_score=req.sleep_score,
        fatigue_score=req.fatigue_score,
        raw_answers=answers_str
    )
    db.add(self_check)
    db.commit()
    db.refresh(self_check)
    
    battery = req.battery_percentage if req.battery_percentage is not None else 75
    
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
        "battery_percentage": battery,
        "feedback": feedback,
        "message": "Thank you - your monthly check-in has been recorded."
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

# Family Registration on Soldier Dashboard (Multi-Member Support)
@router.get("/family-members")
def get_soldier_family_members(
    soldier_id: int = 1,
    db: Session = Depends(get_db),
    user: dict = Depends(enforce_soldier_scope)
):
    auth_soldier_id = user.get("soldier_id") or soldier_id
    members = db.query(FamilyMember).filter_by(personnel_id=auth_soldier_id).all()
    return [
        {
            "id": m.id,
            "name": m.name,
            "relationship_type": m.relationship_type,
            "phone_last_4": m.phone_last_4,
            "registered_at": m.created_at.isoformat() if hasattr(m, "created_at") and m.created_at else None
        }
        for m in members
    ]

@router.get("/family-member")
def get_soldier_family_member_legacy(
    soldier_id: int = 1,
    db: Session = Depends(get_db),
    user: dict = Depends(enforce_soldier_scope)
):
    members = get_soldier_family_members(soldier_id=soldier_id, db=db, user=user)
    if not members:
        return {
            "registered": False,
            "name": "",
            "relationship_type": "Wife / Spouse",
            "phone_number": "9876543200",
            "phone_last_4": "3200"
        }
    m = members[0]
    return {
        "registered": True,
        "name": m["name"],
        "relationship_type": m["relationship_type"],
        "phone_last_4": m["phone_last_4"],
        "phone_number": "9876543200"
    }

@router.post("/family-members")
def register_soldier_family_member(
    req: FamilyRegistrationPayload,
    soldier_id: int = 1,
    db: Session = Depends(get_db),
    user: dict = Depends(enforce_soldier_scope)
):
    auth_soldier_id = user.get("soldier_id") or soldier_id
    
    # 1. Enforce max 5 family members limit per soldier
    current_count = db.query(FamilyMember).filter_by(personnel_id=auth_soldier_id).count()
    if current_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum limit of 5 registered family members reached for this soldier."
        )
        
    # 2. Check global phone number uniqueness across all family records
    phone_hash = hash_phone_number(req.phone_number)
    existing_phone = db.query(FamilyMember).filter_by(phone_number_hash=phone_hash).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This phone number is already registered to a family member."
        )
        
    phone_last_4 = "".join(c for c in req.phone_number if c.isdigit())[-4:]
    fam = FamilyMember(
        personnel_id=auth_soldier_id,
        name=req.name.strip(),
        relationship_type=req.relationship_type.strip(),
        phone_number_hash=phone_hash,
        phone_last_4=phone_last_4,
        registered_by=f"soldier_{auth_soldier_id}"
    )
    db.add(fam)
    db.commit()
    db.refresh(fam)
    return {
        "status": "success",
        "id": fam.id,
        "name": fam.name,
        "relationship_type": fam.relationship_type,
        "phone_last_4": fam.phone_last_4,
        "message": f"Next-of-kin {fam.name} successfully registered for soldier #{auth_soldier_id}."
    }

@router.post("/family-member")
def register_soldier_family_member_legacy(
    req: FamilyRegistrationPayload,
    soldier_id: int = 1,
    db: Session = Depends(get_db),
    user: dict = Depends(enforce_soldier_scope)
):
    return register_soldier_family_member(req=req, soldier_id=soldier_id, db=db, user=user)

@router.delete("/family-members/{family_member_id}")
def delete_soldier_family_member(
    family_member_id: int,
    soldier_id: int = 1,
    db: Session = Depends(get_db),
    user: dict = Depends(enforce_soldier_scope)
):
    auth_soldier_id = user.get("soldier_id") or soldier_id
    fam = db.query(FamilyMember).filter_by(id=family_member_id).first()
    if not fam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family member not found.")
        
    if fam.personnel_id != auth_soldier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You are not authorized to delete this family member record."
        )
        
    db.delete(fam)
    db.commit()
    return {
        "status": "success",
        "message": f"Family member record #{family_member_id} successfully deleted."
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
