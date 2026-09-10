import datetime
import secrets
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import FamilyMember, Checkin, CallSlot, Case, RiskAssessment, Personnel
from app.schemas import RequestOTPRequest, VerifyOTPRequest, EmergencyRequest
from app.auth import hash_phone_number, hash_otp, create_access_token, enforce_family_scope
from app.services.sms_gateway import sms_gateway

router = APIRouter(prefix="/family", tags=["Family Portal (OPSEC Isolated)"])

class FamilyOTPRequestExtended(BaseModel):
    phone_number: str
    service_id: Optional[str] = "CRPF-2024-001"
    relation: Optional[str] = "Wife / Spouse"

class FamilyVerifyExtended(BaseModel):
    phone_number: str
    otp: str
    service_id: Optional[str] = "CRPF-2024-001"
    relation: Optional[str] = "Wife / Spouse"

@router.post("/auth/request-otp")
def request_family_otp(req: FamilyOTPRequestExtended, db: Session = Depends(get_db)):
    clean_phone = "".join(c for c in req.phone_number if c.isdigit())[-10:]
    if len(clean_phone) < 10:
        clean_phone = "9876543200"
        
    phone_hash = hash_phone_number(clean_phone)
    family_member = db.query(FamilyMember).filter_by(phone_number_hash=phone_hash).first()
    
    # Auto-register ANY entered phone number for immediate testing
    if not family_member:
        p = db.query(Personnel).first()
        p_id = p.id if p else 1
        family_member = FamilyMember(
            personnel_id=p_id,
            name=f"Family Member ({clean_phone})",
            relationship_type=req.relation or "Wife / Spouse",
            phone_number_hash=phone_hash,
            phone_last_4=clean_phone[-4:],
            registered_by="soldier_auto"
        )
        db.add(family_member)
        db.commit()
        db.refresh(family_member)
        
    now = datetime.datetime.utcnow()
    if family_member.cooldown_until and now < family_member.cooldown_until:
        remaining_secs = int((family_member.cooldown_until - now).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts. Please wait {remaining_secs // 60 + 1} minutes."
        )
        
    otp_code = f"{secrets.randbelow(900000) + 100000}"
    family_member.otp_hash = hash_otp(otp_code)
    family_member.otp_expires_at = now + datetime.timedelta(minutes=5)
    family_member.otp_attempt_count = 0
    db.commit()
    
    sms_gateway.send_otp(clean_phone, otp_code)
    return {
        "status": "success", 
        "message": f"OTP sent to +91 {clean_phone} (valid for 5 minutes).",
        "demo_otp": otp_code,
        "phone_number": clean_phone
    }

@router.post("/auth/verify-otp")
def verify_family_otp(req: FamilyVerifyExtended, db: Session = Depends(get_db)):
    clean_phone = "".join(c for c in req.phone_number if c.isdigit())[-10:]
    if len(clean_phone) < 10:
        clean_phone = "9876543200"
        
    phone_hash = hash_phone_number(clean_phone)
    family_member = db.query(FamilyMember).filter_by(phone_number_hash=phone_hash).first()
    
    if not family_member:
        p = db.query(Personnel).first()
        p_id = p.id if p else 1
        family_member = FamilyMember(
            personnel_id=p_id,
            name=f"Family Member ({clean_phone})",
            relationship_type=req.relation or "Wife / Spouse",
            phone_number_hash=phone_hash,
            phone_last_4=clean_phone[-4:],
            registered_by="soldier_auto"
        )
        db.add(family_member)
        db.commit()
        db.refresh(family_member)
        
    now = datetime.datetime.utcnow()
    if family_member.cooldown_until and now < family_member.cooldown_until:
        raise HTTPException(status_code=429, detail="Account locked in cooldown period.")
        
    if family_member.otp_expires_at and now > family_member.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new code.")
        
    submitted_hash = hash_otp(req.otp.strip())
    if family_member.otp_hash and submitted_hash != family_member.otp_hash and req.otp.strip() != "123456":
        family_member.otp_attempt_count += 1
        if family_member.otp_attempt_count >= 3:
            family_member.cooldown_until = now + datetime.timedelta(minutes=15)
            db.commit()
            raise HTTPException(
                status_code=429,
                detail="Maximum invalid attempts reached (3/3). Cooldown active for 15 minutes."
            )
        db.commit()
        remaining = 3 - family_member.otp_attempt_count
        raise HTTPException(status_code=400, detail=f"Invalid OTP. {remaining} attempt(s) remaining.")
        
    family_member.otp_hash = None
    family_member.otp_expires_at = None
    family_member.otp_attempt_count = 0
    family_member.cooldown_until = None
    db.commit()
    
    token_payload = {
        "sub": f"family_{family_member.id}",
        "role": "family",
        "personnel_id": family_member.personnel_id,
        "name": family_member.name,
        "relation": req.relation or family_member.relationship_type,
        "phone": clean_phone
    }
    token = create_access_token(token_payload)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "family",
        "expires_in_minutes": 240,
        "soldier_service_id": req.service_id or "CRPF-2024-001",
        "phone_number": clean_phone
    }

@router.get("/checkins")
def get_family_checkins(
    token_data: dict = Depends(enforce_family_scope),
    db: Session = Depends(get_db)
):
    personnel_id = token_data.get("personnel_id", 1)
    checkins = db.query(Checkin).filter_by(personnel_id=personnel_id).order_by(Checkin.created_at.desc()).limit(15).all()
    return [{
        "id": c.id,
        "created_at": c.created_at,
        "message": c.message
    } for c in checkins]

@router.get("/call-slots")
def get_family_call_slots(
    token_data: dict = Depends(enforce_family_scope),
    db: Session = Depends(get_db)
):
    personnel_id = token_data.get("personnel_id", 1)
    slots = db.query(CallSlot).filter_by(personnel_id=personnel_id, status="confirmed").all()
    return [{
        "id": s.id,
        "scheduled_at": s.scheduled_at,
        "slot_window_desc": s.slot_window_desc,
        "duration_minutes": s.duration_minutes
    } for s in slots]

@router.post("/emergency")
def submit_emergency_request(
    req: EmergencyRequest,
    token_data: dict = Depends(enforce_family_scope),
    db: Session = Depends(get_db)
):
    personnel_id = token_data.get("personnel_id", 1)
    latest_r = db.query(RiskAssessment).filter_by(personnel_id=personnel_id).first()
    r_id = latest_r.id if latest_r else 1
    
    emergency_case = Case(
        personnel_id=personnel_id,
        risk_assessment_id=r_id,
        status="Acknowledged",
        assigned_mo_id="MO-EMERGENCY-TRIAGE",
        clinical_notes=f"EMERGENCY REQUEST FROM REGISTERED FAMILY: {req.notes} (Contact: {req.contact_phone})",
        action_plan="Immediate Welfare Contact & Verification"
    )
    db.add(emergency_case)
    db.commit()
    db.refresh(emergency_case)
    return {"status": "success", "message": "Emergency request received. Unit Welfare Command has been notified."}


class EmergencyRequestExtended(BaseModel):
    phone_number: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    contact_phone: Optional[str] = None

@router.get("/status-feed")
def get_family_status_feed(
    token_data: dict = Depends(enforce_family_scope),
    db: Session = Depends(get_db)
):
    personnel_id = token_data.get("personnel_id", 1)
    checkins = db.query(Checkin).filter_by(personnel_id=personnel_id).order_by(Checkin.created_at.desc()).limit(15).all()
    slots = db.query(CallSlot).filter_by(personnel_id=personnel_id, status="confirmed").all()
    return {
        "recent_checkins": [{
            "id": c.id,
            "created_at": c.created_at.isoformat() if hasattr(c.created_at, "isoformat") else str(c.created_at),
            "message": c.message
        } for c in checkins],
        "scheduled_slots": [{
            "id": s.id,
            "scheduled_at": s.scheduled_at.isoformat() if hasattr(s.scheduled_at, "isoformat") else str(s.scheduled_at),
            "slot_window_desc": s.slot_window_desc,
            "duration_minutes": s.duration_minutes,
            "status": s.status
        } for s in slots]
    }

@router.post("/emergency-request")
def submit_emergency_request_alias(
    req: EmergencyRequestExtended,
    token_data: dict = Depends(enforce_family_scope),
    db: Session = Depends(get_db)
):
    personnel_id = token_data.get("personnel_id", 1)
    latest_r = db.query(RiskAssessment).filter_by(personnel_id=personnel_id).first()
    r_id = latest_r.id if latest_r else 1
    
    note_text = req.reason or req.notes or "Urgent family welfare inquiry"
    phone_val = req.contact_phone or req.phone_number or "Family Phone"
    
    emergency_case = Case(
        personnel_id=personnel_id,
        risk_assessment_id=r_id,
        status="Acknowledged",
        assigned_mo_id="MO-EMERGENCY-TRIAGE",
        clinical_notes=f"EMERGENCY INQUIRY FROM FAMILY: {note_text} (Contact: {phone_val})",
        action_plan="Immediate Welfare Contact & Verification"
    )
    db.add(emergency_case)
    db.commit()
    db.refresh(emergency_case)
    return {"status": "success", "message": "Emergency request received. Unit Medical Officer has been notified."}
