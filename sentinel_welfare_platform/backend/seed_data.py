import os
import json
import datetime
import pandas as pd
from app.database import SessionLocal, Base, engine
from app.models import Personnel, RiskAssessment, Case, FamilyMember, CallSlot, Checkin
from app.auth import hash_phone_number
from app.services.ml_engine import ml_engine
from app.services.roster_scheduler import roster_scheduler

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    if db.query(Personnel).count() > 0:
        print("[Seed] Database already contains records. Skipping.")
        db.close()
        return

    backend_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(backend_dir, "final_training_dataset.csv")
    if not os.path.exists(csv_path):
        csv_path = os.path.join(os.path.dirname(backend_dir), "data", "processed", "final_training_dataset.csv")
        
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path).head(50)
        print(f"[Seed] Seeding from dataset CSV ({csv_path}): {len(df)} soldiers...")
    else:
        print("[Seed] CSV not found, generating programmatic sample soldiers...")
        df = pd.DataFrame([{
            "rank_encoded": i % 5, "age": 25 + (i * 2) % 20, "service_tenure_years": 3 + i % 15,
            "distance_from_home_station_km": 400 + (i * 100) % 1500, "num_dependents": 2 + i % 3,
            "annual_fitness_grade_encoded": i % 2, "fitness_trend_score": 0.5 + (i % 5) * 0.1,
            "deployment_duration_days": 60 + (i * 30) % 300, "posting_transfer_count_last_2yrs": i % 3,
            "commute_transit_days": 2 + i % 4, "unit_manning_shortfall_pct": 10 + (i * 5) % 30,
            "promotion_stagnation_years": i % 5, "duty_hours_daily": 8 + (i * 2) % 8,
            "rest_hours_daily": 5 + i % 4, "overtime_hours_monthly": 10 + (i * 10) % 40,
            "night_shift_frequency_monthly": 4 + (i * 2) % 10, "consecutive_night_duty_days": 1 + i % 4,
            "overtime_flag": i % 2, "daily_workload_score": 30 + (i * 10) % 60,
            "training_hours_last_year": 20 + i % 40, "leave_backlog_days": 10 + (i * 5) % 45,
            "days_since_last_leave": 30 + (i * 20) % 180, "leave_days_last_90d": 3 + i % 10,
            "absenteeism_hours_last_year": i * 2, "family_separation_months": 2 + i % 10,
            "conduct_flag": 0, "body_mass_index": 21.5 + (i % 6) * 1.2,
            "stagnation_per_tenure_ratio": 0.1, "transit_separation_burden": 3,
            "manning_training_ratio": 0.3, "transfer_tenure_friction": 0.1,
            "manning_absenteeism_load": 1, "training_vs_unit_median": 0,
            "absenteeism_vs_rank_median": 0, "theatre_Border Outpost (LoC/IB)": 1 if i % 4 == 0 else 0,
            "theatre_J&K (CI/Ops)": 1 if i % 4 == 1 else 0, "theatre_LWE / Bastar (Anti-Naxal)": 1 if i % 4 == 2 else 0,
            "theatre_Peace / Training Center": 1 if i % 4 == 3 else 0,
            "unit_CoBRA Strike Unit": 1 if i % 4 == 0 else 0, "unit_General Duty (GD)": 1 if i % 4 == 1 else 0,
            "unit_Rapid Action Force (RAF)": 1 if i % 4 == 2 else 0, "unit_VIP Security Wing": 1 if i % 4 == 3 else 0
        } for i in range(50)])

    
    ranks = ["Constable", "Head Constable", "ASI", "Sub-Inspector", "Inspector"]
    units = ["CoBRA Strike Unit", "General Duty (GD)", "Rapid Action Force (RAF)", "VIP Security Wing"]
    theatres = ["LWE / Bastar (Anti-Naxal)", "J&K (CI/Ops)", "Border Outpost (LoC/IB)", "Peace / Training Center"]
    names = [
        "Ct. Rajesh Kumar", "HC Manjeet Singh", "ASI Suresh Verma", "Ct. Amit Sharma",
        "SI Pradeep Yadav", "Ct. Rameshwar Gond", "HC Dalbir Sandhu", "Ct. Vikram Rathore",
        "Ct. Mohammed Tariq", "SI Gurpreet Singh", "Ct. Anil Chauhan", "HC Dinesh Patil"
    ]

    for idx, row in df.iterrows():
        p_name = names[idx % len(names)] if idx < len(names) else f"Personnel {idx+101}"
        p_rank = ranks[int(row.get("rank_encoded", 0)) % len(ranks)]
        
        # Determine unit from dummies
        p_unit = "General Duty (GD)"
        if row.get("unit_CoBRA Strike Unit", 0) == 1: p_unit = "CoBRA Strike Unit"
        elif row.get("unit_Rapid Action Force (RAF)", 0) == 1: p_unit = "Rapid Action Force (RAF)"
        elif row.get("unit_VIP Security Wing", 0) == 1: p_unit = "VIP Security Wing"
        
        # Determine theatre from dummies
        p_theatre = "Peace / Training Center"
        if row.get("theatre_LWE / Bastar (Anti-Naxal)", 0) == 1: p_theatre = "LWE / Bastar (Anti-Naxal)"
        elif row.get("theatre_J&K (CI/Ops)", 0) == 1: p_theatre = "J&K (CI/Ops)"
        elif row.get("theatre_Border Outpost (LoC/IB)", 0) == 1: p_theatre = "Border Outpost (LoC/IB)"

        personnel = Personnel(
            service_id_hash=f"CRPF_{idx+1001:05d}_HASHED",
            name=p_name,
            rank=p_rank,
            unit_type=p_unit,
            deployment_theatre=p_theatre,
            age=float(row.get("age", 32)),
            service_tenure_years=float(row.get("service_tenure_years", 8)),
            distance_from_home_station_km=float(row.get("distance_from_home_station_km", 900)),
            num_dependents=float(row.get("num_dependents", 3)),
            rank_encoded=int(row.get("rank_encoded", 1)),
            annual_fitness_grade_encoded=int(row.get("annual_fitness_grade_encoded", 0)),
            fitness_trend_score=float(row.get("fitness_trend_score", 0)),
            deployment_duration_days=float(row.get("deployment_duration_days", 180)),
            posting_transfer_count_last_2yrs=float(row.get("posting_transfer_count_last_2yrs", 1)),
            commute_transit_days=float(row.get("commute_transit_days", 3)),
            unit_manning_shortfall_pct=float(row.get("unit_manning_shortfall_pct", 15)),
            promotion_stagnation_years=float(row.get("promotion_stagnation_years", 2)),
            duty_hours_daily=float(row.get("duty_hours_daily", 10)),
            rest_hours_daily=float(row.get("rest_hours_daily", 7)),
            overtime_hours_monthly=float(row.get("overtime_hours_monthly", 20)),
            night_shift_frequency_monthly=float(row.get("night_shift_frequency_monthly", 8)),
            consecutive_night_duty_days=float(row.get("consecutive_night_duty_days", 2)),
            overtime_flag=int(row.get("overtime_flag", 1)),
            daily_workload_score=float(row.get("daily_workload_score", 45)),
            training_hours_last_year=float(row.get("training_hours_last_year", 30)),
            leave_backlog_days=float(row.get("leave_backlog_days", 25)),
            days_since_last_leave=float(row.get("days_since_last_leave", 90)),
            leave_days_last_90d=float(row.get("leave_days_last_90d", 5)),
            absenteeism_hours_last_year=float(row.get("absenteeism_hours_last_year", 10)),
            family_separation_months=float(row.get("family_separation_months", 6)),
            conduct_flag=int(row.get("conduct_flag", 0)),
            body_mass_index=float(row.get("body_mass_index", 23.5)),
            stagnation_per_tenure_ratio=float(row.get("stagnation_per_tenure_ratio", 0.2)),
            transit_separation_burden=float(row.get("transit_separation_burden", 5)),
            manning_training_ratio=float(row.get("manning_training_ratio", 0.4)),
            transfer_tenure_friction=float(row.get("transfer_tenure_friction", 0.1)),
            manning_absenteeism_load=float(row.get("manning_absenteeism_load", 2)),
            training_vs_unit_median=float(row.get("training_vs_unit_median", 0)),
            absenteeism_vs_rank_median=float(row.get("absenteeism_vs_rank_median", 0)),
            theatre_border_outpost=int(row.get("theatre_Border Outpost (LoC/IB)", 0)),
            theatre_jk=int(row.get("theatre_J&K (CI/Ops)", 0)),
            theatre_lwe_bastar=int(row.get("theatre_LWE / Bastar (Anti-Naxal)", 0)),
            theatre_northeast=int(row.get("theatre_North-East (Counter-Insurgency)", 0)),
            theatre_peace=int(row.get("theatre_Peace / Training Center", 0)),
            theatre_vip_security=int(row.get("theatre_Static Security / VIP", 0)),
            unit_cobra=int(row.get("unit_CoBRA Strike Unit", 0)),
            unit_gd=int(row.get("unit_General Duty (GD)", 0)),
            unit_medical=int(row.get("unit_Medical & Logistics", 0)),
            unit_raf=int(row.get("unit_Rapid Action Force (RAF)", 0)),
            unit_signal=int(row.get("unit_Signal & IT Wing", 0)),
            unit_vip=int(row.get("unit_VIP Security Wing", 0))
        )
        db.add(personnel)
        db.flush()
        
        # Run ML inference to generate initial RiskAssessment
        feat_dict = {col: float(row[col]) for col in ml_engine.feature_names if col in row}
        pred = ml_engine.predict(feat_dict)
        
        risk = RiskAssessment(
            personnel_id=personnel.id,
            risk_tier=pred["risk_tier"],
            risk_color=pred["risk_color"],
            confidence=pred["confidence"],
            p_low=pred["probabilities"]["Low"],
            p_medium=pred["probabilities"]["Medium"],
            p_high=pred["probabilities"]["High"],
            top_factors=json.dumps(pred["top_factors"]),
            features_snapshot=json.dumps(feat_dict)
        )
        db.add(risk)
        db.flush()
        
        # If High or Orange tier, create an initial case for the MO queue
        if pred["risk_color"] in ["Red", "Orange"]:
            initial_case = Case(
                personnel_id=personnel.id,
                risk_assessment_id=risk.id,
                status="Acknowledged",
                assigned_mo_id="MO-DR-SHARMA-409",
                clinical_notes="Flagged for command supervisory review due to acute duty-rest imbalance.",
                action_plan="Leave Prioritization & Rest Cycle Adjustment"
            )
            db.add(initial_case)
            
        # Register a sample family member for the first 10 soldiers
        if idx < 10:
            sample_phone = f"98765432{idx:02d}"
            fam = FamilyMember(
                personnel_id=personnel.id,
                name=f"Family of {p_name}",
                relationship_type="Spouse",
                phone_number_hash=hash_phone_number(sample_phone),
                phone_last_4=sample_phone[-4:],
                registered_by="ADMIN_01"
            )
            db.add(fam)
            db.flush()
            
            # Generate conflict-free call slots based on duty/rest hours
            slots = roster_scheduler.generate_slots_for_soldier(
                personnel.duty_hours_daily,
                personnel.rest_hours_daily,
                personnel.consecutive_night_duty_days
            )
            for s in slots:
                cs = CallSlot(
                    personnel_id=personnel.id,
                    family_member_id=fam.id,
                    scheduled_at=s["scheduled_at"],
                    slot_window_desc=s["slot_window_desc"],
                    status="confirmed",
                    duration_minutes=20
                )
                db.add(cs)
                
            # Add initial "I'm Okay" checkin
            chk = Checkin(
                personnel_id=personnel.id,
                type="im_okay",
                message="Reached post safely. Duty routine in order."
            )
            db.add(chk)

    db.commit()
    print(f"[Seed] Successfully seeded {db.query(Personnel).count()} personnel records and {db.query(Case).count()} cases.")
    db.close()

if __name__ == "__main__":
    seed_database()
