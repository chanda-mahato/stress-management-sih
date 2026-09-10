import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Personnel(Base):
    __tablename__ = "personnel"
    
    id = Column(Integer, primary_key=True, index=True)
    service_id_hash = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    rank = Column(String(50), nullable=False)
    unit_type = Column(String(100), nullable=False)
    deployment_theatre = Column(String(100), nullable=False)
    
    # Core Telemetry Features (46 features snapshot)
    age = Column(Float, nullable=False)
    service_tenure_years = Column(Float, nullable=False)
    distance_from_home_station_km = Column(Float, nullable=False)
    num_dependents = Column(Float, nullable=False)
    rank_encoded = Column(Integer, nullable=False)
    annual_fitness_grade_encoded = Column(Integer, nullable=False)
    fitness_trend_score = Column(Float, nullable=False)
    deployment_duration_days = Column(Float, nullable=False)
    posting_transfer_count_last_2yrs = Column(Float, nullable=False)
    commute_transit_days = Column(Float, nullable=False)
    unit_manning_shortfall_pct = Column(Float, nullable=False)
    promotion_stagnation_years = Column(Float, nullable=False)
    duty_hours_daily = Column(Float, nullable=False)
    rest_hours_daily = Column(Float, nullable=False)
    overtime_hours_monthly = Column(Float, nullable=False)
    night_shift_frequency_monthly = Column(Float, nullable=False)
    consecutive_night_duty_days = Column(Float, nullable=False)
    overtime_flag = Column(Integer, nullable=False)
    daily_workload_score = Column(Float, nullable=False)
    training_hours_last_year = Column(Float, nullable=False)
    leave_backlog_days = Column(Float, nullable=False)
    days_since_last_leave = Column(Float, nullable=False)
    leave_days_last_90d = Column(Float, nullable=False)
    absenteeism_hours_last_year = Column(Float, nullable=False)
    family_separation_months = Column(Float, nullable=False)
    conduct_flag = Column(Integer, nullable=False)
    body_mass_index = Column(Float, nullable=False)
    stagnation_per_tenure_ratio = Column(Float, nullable=False)
    transit_separation_burden = Column(Float, nullable=False)
    manning_training_ratio = Column(Float, nullable=False)
    transfer_tenure_friction = Column(Float, nullable=False)
    manning_absenteeism_load = Column(Float, nullable=False)
    training_vs_unit_median = Column(Float, nullable=False)
    absenteeism_vs_rank_median = Column(Float, nullable=False)
    theatre_border_outpost = Column(Integer, nullable=False, default=0)
    theatre_jk = Column(Integer, nullable=False, default=0)
    theatre_lwe_bastar = Column(Integer, nullable=False, default=0)
    theatre_northeast = Column(Integer, nullable=False, default=0)
    theatre_peace = Column(Integer, nullable=False, default=0)
    theatre_vip_security = Column(Integer, nullable=False, default=0)
    unit_cobra = Column(Integer, nullable=False, default=0)
    unit_gd = Column(Integer, nullable=False, default=0)
    unit_medical = Column(Integer, nullable=False, default=0)
    unit_raf = Column(Integer, nullable=False, default=0)
    unit_signal = Column(Integer, nullable=False, default=0)
    unit_vip = Column(Integer, nullable=False, default=0)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    risk_assessments = relationship("RiskAssessment", back_populates="personnel")
    cases = relationship("Case", back_populates="personnel")
    family_members = relationship("FamilyMember", back_populates="personnel")
    call_slots = relationship("CallSlot", back_populates="personnel")
    checkins = relationship("Checkin", back_populates="personnel")
    self_checks = relationship("SoldierSelfCheck", back_populates="personnel")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    risk_tier = Column(String(20), nullable=False)      # Low, Medium, High
    risk_color = Column(String(20), nullable=False)     # Green, Yellow, Orange, Red
    confidence = Column(Float, nullable=False)
    p_low = Column(Float, nullable=False)
    p_medium = Column(Float, nullable=False)
    p_high = Column(Float, nullable=False)
    top_factors = Column(Text, nullable=False)           # JSON string of top-3 SHAP items
    features_snapshot = Column(Text, nullable=False)     # JSON string of 46 feature values
    computed_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    personnel = relationship("Personnel", back_populates="risk_assessments")
    cases = relationship("Case", back_populates="risk_assessment")


class Case(Base):
    """Human-in-the-loop clinical case management table."""
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    risk_assessment_id = Column(Integer, ForeignKey("risk_assessments.id"), nullable=False)
    status = Column(String(30), nullable=False, default="Acknowledged")  # Acknowledged -> In Progress -> Resolved
    assigned_mo_id = Column(String(50), nullable=False)                  # MO identifier
    clinical_notes = Column(Text, nullable=True, default="")
    action_plan = Column(String(100), nullable=True, default="Supervisory Welfare Review")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    personnel = relationship("Personnel", back_populates="cases")
    risk_assessment = relationship("RiskAssessment", back_populates="cases")


class FamilyMember(Base):
    __tablename__ = "family_members"
    
    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    relationship_type = Column(String(50), nullable=False)  # Spouse, Parent, Child
    phone_number_hash = Column(String(64), unique=True, index=True, nullable=False)
    phone_last_4 = Column(String(4), nullable=False)
    registered_by = Column(String(50), nullable=False)       # Admin ID or Soldier ID
    otp_hash = Column(String(64), nullable=True)
    otp_expires_at = Column(DateTime, nullable=True)
    otp_attempt_count = Column(Integer, default=0)
    cooldown_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    personnel = relationship("Personnel", back_populates="family_members")
    call_slots = relationship("CallSlot", back_populates="family_member")


class CallSlot(Base):
    __tablename__ = "call_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    family_member_id = Column(Integer, ForeignKey("family_members.id"), nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    slot_window_desc = Column(String(100), nullable=False)
    status = Column(String(30), nullable=False, default="confirmed")  # proposed, confirmed, completed, cancelled
    duration_minutes = Column(Integer, default=20)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    personnel = relationship("Personnel", back_populates="call_slots")
    family_member = relationship("FamilyMember", back_populates="call_slots")


class Checkin(Base):
    __tablename__ = "checkins"
    
    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    type = Column(String(30), nullable=False, default="im_okay")
    message = Column(String(200), default="I am safe and doing well.")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    
    personnel = relationship("Personnel", back_populates="checkins")


class SoldierSelfCheck(Base):
    """
    Self-check responses.
    NOTE: Stored for clinical MO view, NOT yet fed to ML model as documented in KNOWN_LIMITATIONS.md.
    """
    __tablename__ = "soldier_self_checks"
    
    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False, index=True)
    mood_score = Column(Integer, nullable=False)     # 1 to 5
    sleep_score = Column(Integer, nullable=False)    # 1 to 5
    fatigue_score = Column(Integer, nullable=False)  # 1 to 5
    raw_answers = Column(Text, nullable=False)        # JSON string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    personnel = relationship("Personnel", back_populates="self_checks")
