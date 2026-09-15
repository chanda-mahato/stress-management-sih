import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    features: Dict[str, float]

class TopFactor(BaseModel):
    feature: str
    display_name: str
    shap_value: float
    actual_value: float
    impact_direction: str  # "Increases Stress Risk" or "Reduces Stress Risk"

class PredictResponse(BaseModel):
    risk_tier: str          # Low, Medium, High
    risk_color: str         # Green, Yellow, Orange, Red
    confidence: float
    probabilities: Dict[str, float]
    top_factors: List[TopFactor]

class PersonnelBase(BaseModel):
    name: str
    rank: str
    unit_type: str
    deployment_theatre: str

class PersonnelDetail(PersonnelBase):
    id: int
    service_id_hash: str
    duty_hours_daily: float
    rest_hours_daily: float
    leave_backlog_days: float
    consecutive_night_duty_days: float
    family_separation_months: float
    class Config:
        from_attributes = True

class CaseTransitionRequest(BaseModel):
    status: str             # Acknowledged, In Progress, Resolved
    clinical_notes: str
    action_plan: Optional[str] = "Supervisory Welfare Review"
    assigned_mo_id: Optional[str] = "MO-DUTY-OFFICER"

class CaseResponse(BaseModel):
    id: int
    personnel_id: int
    personnel_name: str
    personnel_rank: str
    unit_type: str
    deployment_theatre: str
    risk_tier: str
    risk_color: str
    confidence: float
    top_factors: List[Dict[str, Any]]
    status: str
    assigned_mo_id: str
    clinical_notes: str
    action_plan: str
    created_at: datetime.datetime
    acknowledged_at: Optional[datetime.datetime]
    resolved_at: Optional[datetime.datetime]
    flagged_personnel_objection: Optional[str] = None
    objection_filed_at: Optional[datetime.datetime] = None

class CaseObjectionRequest(BaseModel):
    objection_text: str

class CaseAccessLogResponse(BaseModel):
    id: int
    case_id: int
    accessed_by: str
    accessed_at: datetime.datetime
    action: str

    class Config:
        from_attributes = True

class RequestOTPRequest(BaseModel):
    phone_number: str

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    expires_in_minutes: int

class CheckinCreate(BaseModel):
    message: Optional[str] = "I am safe and doing well."

class CheckinResponse(BaseModel):
    id: int
    created_at: datetime.datetime
    message: str

class CallSlotResponse(BaseModel):
    id: int
    scheduled_at: datetime.datetime
    slot_window_desc: str
    status: str
    duration_minutes: int

class SelfCheckCreate(BaseModel):
    mood_score: int = Field(default=3, ge=1, le=5)
    sleep_score: int = Field(default=3, ge=1, le=5)
    fatigue_score: int = Field(default=3, ge=1, le=5)
    battery_percentage: Optional[int] = 75
    raw_answers: Optional[Dict[str, Any]] = None

class ChatMessageRequest(BaseModel):
    session_id: str
    message: str
    language: Optional[str] = "en"  # "en" or "hi"
    personnel_id: Optional[int] = None
    soldier_name: Optional[str] = None

class ChatMessageResponse(BaseModel):
    session_id: str
    reply: str
    language: str
    is_emergency_flagged: bool
    crisis_level: Optional[str] = "NONE"
    trigger_phrase: Optional[str] = None
    helpline_info: Optional[Dict[str, str]] = None

class CrisisAlertResponse(BaseModel):
    id: str
    session_id: str
    personnel_id: Optional[int] = None
    soldier_name: Optional[str] = "Anonymous Soldier"
    trigger_phrase: str
    category: str
    risk_level: str
    message_snippet: str
    timestamp: str
    acknowledged: bool = False

class EmergencyRequest(BaseModel):
    contact_phone: str
    urgency_level: str = "high"
    notes: str
