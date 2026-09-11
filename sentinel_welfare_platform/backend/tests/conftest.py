import os
import json
import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure test environment uses development settings with clean test keys
os.environ["ENVIRONMENT"] = "development"
if not os.environ.get("JWT_SECRET"):
    os.environ["JWT_SECRET"] = "test_jwt_secret_token_hex_32_secure_test_key_sentinel"
if not os.environ.get("TURN_SECRET"):
    os.environ["TURN_SECRET"] = "test_turn_secret_token_hex_32_secure_test_key_sentinel"

TEST_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "test_sentinel.db"))
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"
os.environ["DATABASE_URL"] = TEST_DB_URL

import app.database as app_db
from app.database import Base, get_db
from app.main import app
from app.models import Personnel, RiskAssessment, Case, FamilyMember, CallSlot, Checkin
from app.auth import hash_phone_number

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Monkey-patch database module attributes for full isolation from sentinel.db
app_db.engine = test_engine
app_db.SessionLocal = TestingSessionLocal

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

def seed_test_database(db):
    """Seed minimal self-contained records for the 8 acceptance tests to pass independently."""
    # 1. Personnel (Ct. Rajesh Kumar)
    p1 = Personnel(
        id=1,
        service_id_hash="CRPF_TEST_001_HASHED",
        name="Ct. Rajesh Kumar",
        rank="Constable",
        unit_type="CoBRA Strike Unit",
        deployment_theatre="LWE / Bastar (Anti-Naxal)",
        age=32.0,
        service_tenure_years=8.0,
        distance_from_home_station_km=900.0,
        num_dependents=3.0,
        rank_encoded=1,
        annual_fitness_grade_encoded=0,
        fitness_trend_score=0.0,
        deployment_duration_days=180.0,
        posting_transfer_count_last_2yrs=1.0,
        commute_transit_days=3.0,
        unit_manning_shortfall_pct=15.0,
        promotion_stagnation_years=2.0,
        duty_hours_daily=10.0,
        rest_hours_daily=7.0,
        overtime_hours_monthly=20.0,
        night_shift_frequency_monthly=8.0,
        consecutive_night_duty_days=2.0,
        overtime_flag=1,
        daily_workload_score=45.0,
        training_hours_last_year=30.0,
        leave_backlog_days=25.0,
        days_since_last_leave=90.0,
        leave_days_last_90d=5.0,
        absenteeism_hours_last_year=10.0,
        family_separation_months=6.0,
        conduct_flag=0,
        body_mass_index=23.5,
        stagnation_per_tenure_ratio=0.2,
        transit_separation_burden=5.0,
        manning_training_ratio=0.4,
        transfer_tenure_friction=0.1,
        manning_absenteeism_load=2.0,
        training_vs_unit_median=0.0,
        absenteeism_vs_rank_median=0.0,
        theatre_border_outpost=0,
        theatre_jk=0,
        theatre_lwe_bastar=1,
        theatre_northeast=0,
        theatre_peace=0,
        theatre_vip_security=0,
        unit_cobra=1,
        unit_gd=0,
        unit_medical=0,
        unit_raf=0,
        unit_signal=0,
        unit_vip=0
    )
    db.add(p1)
    db.flush()

    # 2. Risk Assessment (Medium tier, Orange color)
    risk1 = RiskAssessment(
        id=1,
        personnel_id=p1.id,
        risk_tier="Medium",
        risk_color="Orange",
        confidence=0.88,
        p_low=0.10,
        p_medium=0.55,
        p_high=0.35,
        top_factors=json.dumps([
            {"feature": "leave_backlog_days", "display_name": "Leave Backlog (Days)", "shap_value": 0.42, "impact_direction": "High"}
        ]),
        features_snapshot="{}"
    )
    db.add(risk1)
    db.flush()

    # 3. Clinical Case (Acknowledged status required for test_case_lifecycle)
    case1 = Case(
        id=1,
        personnel_id=p1.id,
        risk_assessment_id=risk1.id,
        status="Acknowledged",
        assigned_mo_id="MO-DR-SHARMA-409",
        clinical_notes="Flagged for command review.",
        action_plan="Supervisory Welfare Review"
    )
    db.add(case1)

    # 4. Family Members (9876543200 for cooldown test, 9876543201 for expiry test)
    fam1 = FamilyMember(
        id=1,
        personnel_id=p1.id,
        name="Spouse of Ct. Rajesh Kumar",
        relationship_type="Spouse",
        phone_number_hash=hash_phone_number("9876543200"),
        phone_last_4="3200",
        registered_by="ADMIN_01"
    )
    fam2 = FamilyMember(
        id=2,
        personnel_id=p1.id,
        name="Parent of Ct. Rajesh Kumar",
        relationship_type="Parent",
        phone_number_hash=hash_phone_number("9876543201"),
        phone_last_4="3201",
        registered_by="ADMIN_01"
    )
    db.add(fam1)
    db.add(fam2)
    db.flush()

    # 5. Call Slot (Required for test_opsec_isolation whitelisted call-slots check)
    slot1 = CallSlot(
        id=1,
        personnel_id=p1.id,
        family_member_id=fam1.id,
        scheduled_at=datetime.datetime.utcnow() + datetime.timedelta(days=1),
        slot_window_desc="18:00 - 18:20 IST",
        status="confirmed",
        duration_minutes=20
    )
    db.add(slot1)

    # 6. Checkin (Required for test_opsec_isolation whitelisted checkins check)
    chk1 = Checkin(
        id=1,
        personnel_id=p1.id,
        type="im_okay",
        message="Reached post safely. Duty routine in order."
    )
    db.add(chk1)
    db.commit()

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Session fixture creating an isolated test SQLite database and cleaning up after."""
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass

    # Build schema
    Base.metadata.create_all(bind=test_engine)

    # Seed isolated database
    db = TestingSessionLocal()
    seed_test_database(db)
    db.close()

    yield

    # Clean teardown
    test_engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except OSError:
            pass
