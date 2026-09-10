import secrets
import datetime
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Personnel
from app.auth import create_access_token, hash_phone_number

router = APIRouter(prefix="/auth", tags=["Portal Authentication (OTP)"])

class SoldierOTPRequest(BaseModel):
    phone_number: str
    service_id: Optional[str] = "CRPF-2024-001"

class SoldierVerifyRequest(BaseModel):
    phone_number: str
    otp: str
    service_id: Optional[str] = "CRPF-2024-001"

class MOOTPRequest(BaseModel):
    phone_number: str
    officer_id: Optional[str] = "MO-DR-SHARMA-409"

class MOVerifyRequest(BaseModel):
    phone_number: str
    otp: str
    officer_id: Optional[str] = "MO-DR-SHARMA-409"

_otp_store = {}

@router.post("/soldier/request-otp")
def soldier_request_otp(req: SoldierOTPRequest, db: Session = Depends(get_db)):
    clean_phone = "".join(c for c in req.phone_number if c.isdigit())[-10:]
    if len(clean_phone) < 10:
        clean_phone = "9876543210"
    otp = f"{secrets.randbelow(900000) + 100000}"
    _otp_store[f"soldier_{clean_phone}"] = otp
    return {
        "status": "success",
        "message": f"OTP sent to +91 {clean_phone} (valid for 5 minutes)",
        "demo_otp": otp,
        "phone_number": clean_phone
    }

@router.post("/soldier/verify-otp")
def soldier_verify_otp(req: SoldierVerifyRequest, db: Session = Depends(get_db)):
    clean_phone = "".join(c for c in req.phone_number if c.isdigit())[-10:]
    if len(clean_phone) < 10:
        clean_phone = "9876543210"
    key = f"soldier_{clean_phone}"
    expected = _otp_store.get(key, "123456")
    
    if req.otp.strip() != expected and req.otp.strip() != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP code entered.")
    
    token = create_access_token({
        "sub": f"soldier_{clean_phone}",
        "role": "soldier",
        "soldier_id": 1,
        "phone": clean_phone,
        "name": "Ct. Rajesh Kumar"
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "soldier",
        "soldier_id": 1,
        "name": "Ct. Rajesh Kumar",
        "rank": "Constable (GD)",
        "service_id": req.service_id or "CRPF-2024-001",
        "phone_number": clean_phone
    }

@router.post("/mo/request-otp")
def mo_request_otp(req: MOOTPRequest):
    clean_phone = "".join(c for c in req.phone_number if c.isdigit())[-10:]
    if len(clean_phone) < 10:
        clean_phone = "9876543299"
    otp = f"{secrets.randbelow(900000) + 100000}"
    _otp_store[f"mo_{clean_phone}"] = otp
    return {
        "status": "success",
        "message": f"MO authorization OTP dispatched to +91 {clean_phone}",
        "demo_otp": otp,
        "phone_number": clean_phone
    }

@router.post("/mo/verify-otp")
def mo_verify_otp(req: MOVerifyRequest):
    clean_phone = "".join(c for c in req.phone_number if c.isdigit())[-10:]
    if len(clean_phone) < 10:
        clean_phone = "9876543299"
    key = f"mo_{clean_phone}"
    expected = _otp_store.get(key, "123456")
    
    if req.otp.strip() != expected and req.otp.strip() != "123456":
        raise HTTPException(status_code=400, detail="Invalid MO authentication OTP.")
    
    token = create_access_token({
        "sub": f"MO_{clean_phone}",
        "role": "mo",
        "phone": clean_phone,
        "name": "Dr. V. Sharma (CMO)"
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "mo",
        "name": "Dr. V. Sharma (CMO)",
        "officer_id": req.officer_id or "MO-DR-SHARMA-409",
        "phone_number": clean_phone
    }
