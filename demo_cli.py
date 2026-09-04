"""
SIH PS26186: Interactive Personnel Welfare & Stress Evaluation Demo.
Simulates command scenarios and outputs calibrated risk tier, SHAP root causes, and SOPs.
"""

import sys
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from src.predict import predict_personnel_welfare

def print_banner():
    print("=" * 80)
    print("  SIH 2026 PS26186: AI PERSONNEL STRESS & WELFARE MONITORING SYSTEM")
    print("  Uniformed Forces Command Triage Engine (Tri-Model Ensemble + SHAP XAI)")
    print("=" * 80)

def display_result(name, profile, res):
    print(f"\n[DOSSIER] Personnel: {name}")
    print("-" * 80)
    print(f"  Rank:                 {profile.get('rank', 'N/A')}")
    print(f"  Unit Type:            {profile.get('unit_type', 'N/A')}")
    print(f"  Deployment Theatre:   {profile.get('deployment_theatre', 'N/A')}")
    print(f"  Leave Backlog:        {profile.get('leave_backlog_days', 0)} days")
    print(f"  Consecutive Nights:   {profile.get('consecutive_night_duty_days', 0)} shifts")
    print(f"  Daily Duty Hours:     {profile.get('duty_hours_daily', 8)} hrs")
    print(f"  Family Separation:    {profile.get('family_separation_months', 0)} months")
    print(f"  Medical SHAPE:        {profile.get('annual_fitness_grade', 'SHAPE-1')}")
    print("-" * 80)
    
    tier = res['welfare_risk_tier']
    wsi = res.get('predicted_wsi_score')
    wsi_str = f" | Predicted WSI: {wsi:.1f}/100" if wsi is not None else ""
    tier_symbol = "[CRITICAL]" if tier == "High" else ("[ELEVATED]" if tier == "Medium" else "[NORMAL]")
    
    print(f"  PREDICTED WELFARE RISK:  {tier_symbol} {tier.upper()} RISK ({res['confidence_pct']}% Confidence{wsi_str})")
    print(f"  Probability Breakdown:   Low: {res['probability_distribution']['Low']}% | "
          f"Medium: {res['probability_distribution']['Medium']}% | "
          f"High: {res['probability_distribution']['High']}%")
    print("-" * 80)

    if 'top_risk_drivers' in res and res['top_risk_drivers']:
        print("  PRIMARY STRESSORS IDENTIFIED (SHAP Explainability):")
        for i, driver in enumerate(res['top_risk_drivers'], 1):
            print(f"    {i}. {driver['label']} = {driver['value']}  (Risk Impact: +{driver['shap_val']:.3f})")

    if 'protective_factors' in res and res['protective_factors']:
        print("\n  PROTECTIVE RESILIENCE FACTORS:")
        for i, prot in enumerate(res['protective_factors'], 1):
            print(f"    • {prot['label']} = {prot['value']}  (Mitigation: {prot['shap_val']:.3f})")

    sop = res['sop_guidance']
    print("-" * 80)
    print(f"  COMMAND ACTION: [{sop['action_code']}] {sop['title']}")
    print(f"  Urgency: {sop['urgency']}")
    print("  Standard Operating Directives:")
    for directive in sop['directives']:
        print(f"    [ ] {directive}")
    print("=" * 80)

def run_scenarios():
    print_banner()

    # Scenario 1: High Stress Combat Patrol (J&K)
    p1 = {
        'age': 34,
        'service_tenure_years': 7.5,
        'distance_from_home_station_km': 45.0,
        'num_dependents': 2,
        'rank': 'Constable',
        'unit_type': 'CoBRA Strike Unit',
        'deployment_theatre': 'J&K (CI/Ops)',
        'deployment_duration_days': 410,
        'posting_transfer_count_last_2yrs': 2,
        'duty_hours_daily': 14,
        'rest_hours_daily': 5,
        'overtime_hours_monthly': 48,
        'night_shift_frequency_monthly': 16,
        'consecutive_night_duty_days': 15,
        'overtime_flag': 1,
        'daily_workload_score': 12.5,
        'training_hours_last_year': 12,
        'leave_backlog_days': 38,
        'days_since_last_leave': 240,
        'leave_days_last_90d': 0,
        'absenteeism_hours_last_year': 24,
        'family_separation_months': 18,
        'conduct_flag': 0,
        'satisfaction_score': 1.5,
        'work_life_balance_score': 1.2,
        'stress_score': 8.5,
        'sleep_quality_score': 3.2,
        'fatigue_score': 8.9,
        'social_support_score': 2.1,
        'emotional_wellbeing_score': 2.0,
        'body_mass_index': 27.2,
        'annual_fitness_grade': 'SHAPE-2',
        'fitness_trend_score': -1,
        'unit_manning_shortfall_pct': 32.5,
        'promotion_stagnation_years': 4.5,
        'commute_transit_days': 3.5
    }
    r1 = predict_personnel_welfare(p1)
    display_result("Constable R. Kumar (CRPF CoBRA Battalion)", p1, r1)

    # Scenario 2: Medium Load (Border Outpost)
    p2 = {
        'age': 41,
        'service_tenure_years': 14.0,
        'distance_from_home_station_km': 30.0,
        'num_dependents': 3,
        'rank': 'Head Constable',
        'unit_type': 'General Duty (GD)',
        'deployment_theatre': 'Border Outpost (LoC/IB)',
        'deployment_duration_days': 210,
        'posting_transfer_count_last_2yrs': 1,
        'duty_hours_daily': 10,
        'rest_hours_daily': 8,
        'overtime_hours_monthly': 18,
        'night_shift_frequency_monthly': 8,
        'consecutive_night_duty_days': 6,
        'overtime_flag': 0,
        'daily_workload_score': 9.2,
        'training_hours_last_year': 35,
        'leave_backlog_days': 22,
        'days_since_last_leave': 110,
        'leave_days_last_90d': 5,
        'absenteeism_hours_last_year': 12,
        'family_separation_months': 9,
        'conduct_flag': 0,
        'satisfaction_score': 2.8,
        'work_life_balance_score': 2.5,
        'stress_score': 5.2,
        'sleep_quality_score': 6.0,
        'fatigue_score': 5.5,
        'social_support_score': 3.4,
        'emotional_wellbeing_score': 3.2,
        'body_mass_index': 24.8,
        'annual_fitness_grade': 'SHAPE-1',
        'fitness_trend_score': 0,
        'unit_manning_shortfall_pct': 15.0,
        'promotion_stagnation_years': 2.0,
        'commute_transit_days': 2.0
    }
    r2 = predict_personnel_welfare(p2)
    display_result("Head Constable S. Singh (Border Security GD)", p2, r2)

    # Scenario 3: Low Stress (Peace / Training Center)
    p3 = {
        'age': 46,
        'service_tenure_years': 19.5,
        'distance_from_home_station_km': 15.0,
        'num_dependents': 2,
        'rank': 'Inspector',
        'unit_type': 'Medical & Logistics',
        'deployment_theatre': 'Peace / Training Center',
        'deployment_duration_days': 90,
        'posting_transfer_count_last_2yrs': 0,
        'duty_hours_daily': 8,
        'rest_hours_daily': 10,
        'overtime_hours_monthly': 0,
        'night_shift_frequency_monthly': 2,
        'consecutive_night_duty_days': 0,
        'overtime_flag': 0,
        'daily_workload_score': 7.5,
        'training_hours_last_year': 60,
        'leave_backlog_days': 4,
        'days_since_last_leave': 25,
        'leave_days_last_90d': 14,
        'absenteeism_hours_last_year': 4,
        'family_separation_months': 1,
        'conduct_flag': 0,
        'satisfaction_score': 3.8,
        'work_life_balance_score': 3.6,
        'stress_score': 2.1,
        'sleep_quality_score': 8.8,
        'fatigue_score': 2.0,
        'social_support_score': 4.5,
        'emotional_wellbeing_score': 4.2,
        'body_mass_index': 23.5,
        'annual_fitness_grade': 'SHAPE-1',
        'fitness_trend_score': 1,
        'unit_manning_shortfall_pct': 5.0,
        'promotion_stagnation_years': 0.5,
        'commute_transit_days': 1.0
    }
    r3 = predict_personnel_welfare(p3)
    display_result("Inspector V. Sharma (Base Training HQ)", p3, r3)

if __name__ == '__main__':
    run_scenarios()

