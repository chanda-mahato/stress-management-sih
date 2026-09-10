import datetime
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import FamilyMember
from app.auth import hash_phone_number, hash_otp

client = TestClient(app)

def test_otp_attempt_limit_and_cooldown():
    """
    ACCEPTANCE TEST:
    3 invalid attempts -> 4th attempt rejected with HTTP 429 and cooldown active.
    """
    # Use seed phone for soldier 0
    phone = "9876543200"
    
    # Clean test state in DB
    db = SessionLocal()
    phone_hash = hash_phone_number(phone)
    fam = db.query(FamilyMember).filter_by(phone_number_hash=phone_hash).first()
    if fam:
        fam.cooldown_until = None
        fam.otp_attempt_count = 0
        fam.otp_hash = None
        db.commit()
    db.close()
    
    # 1. Request OTP
    req_resp = client.post("/api/family/auth/request-otp", json={"phone_number": phone})
    assert req_resp.status_code == 200
    
    # 2. Submit 3 invalid attempts
    for attempt in range(1, 4):
        resp = client.post("/api/family/auth/verify-otp", json={
            "phone_number": phone,
            "otp": "000000"
        })
        if attempt < 3:
            assert resp.status_code == 400
            assert f"{3 - attempt} attempt(s) remaining" in resp.json()["detail"]
        else:
            # 3rd failed attempt triggers 15-minute cooldown
            assert resp.status_code == 429
            assert "Maximum invalid attempts reached" in resp.json()["detail"]
            
    # 3. 4th attempt must be rejected with 429 cooldown
    resp4 = client.post("/api/family/auth/verify-otp", json={
        "phone_number": phone,
        "otp": "000000"
    })
    assert resp4.status_code == 429
    assert "cooldown" in resp4.json()["detail"].lower()

def test_otp_time_expiry():
    """
    REVIEWER FIX #5:
    Test time-based expiry separately from attempt limit.
    Submitting correct OTP after > 5 minutes must be rejected with HTTP 400.
    """
    phone = "9876543201"
    
    # Setup OTP in DB with expired timestamp
    db = SessionLocal()
    phone_hash = hash_phone_number(phone)
    fam = db.query(FamilyMember).filter_by(phone_number_hash=phone_hash).first()
    assert fam is not None
    
    correct_otp = "123456"
    fam.otp_hash = hash_otp(correct_otp)
    fam.otp_expires_at = datetime.datetime.utcnow() - datetime.timedelta(seconds=10) # Expired 10s ago
    fam.otp_attempt_count = 0
    fam.cooldown_until = None
    db.commit()
    db.close()
    
    # Submit the correct OTP, which is now expired
    resp = client.post("/api/family/auth/verify-otp", json={
        "phone_number": phone,
        "otp": correct_otp
    })
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()
