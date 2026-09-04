# Baseline Model Evaluation & Learnability Audit Report (Revision 3)

**Evaluated File:** `final_training_dataset.csv` (7,500 rows, 49 columns)  
**Model:** Random Forest Classifier (100 estimators, max_depth=12, balanced class weights)  
**Train / Test Split:** 80% Train (6,000 samples) / 20% Test (1,500 samples, Stratified)  
**Target Variable:** `welfare_risk_level` (Low, Medium, High)  
**Weak-Supervision Noise:** Gaussian sigma=2.6, clipped to [-5.2, +5.2]  

---

## 1. Overall Performance Summary

| Metric | Score | Evaluation Context |
| :--- | :---: | :--- |
| **Overall Accuracy** | **75.33%** | Honest classification across independent, non-leaking operational vectors |
| **Macro F1-Score** | **0.7004** | Unweighted harmonic mean across all 3 risk classes |
| **Weighted F1-Score** | **0.7500** | Population-weighted operational performance |

---

## 2. Per-Class Precision, Recall & F1-Score

| Risk Category | Test Support | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: |
| **Low Risk** | 504 | 75.57% | 78.57% | **0.7704** |
| **Medium Risk** | 823 | 76.77% | 79.10% | **0.7792** |
| **High Risk** | 173 | 64.84% | 47.98% | **0.5515** |

### Confusion Matrix (Test Set N=1,500)
```
                  Predicted Low    Predicted Medium    Predicted High
Actual Low:            396              108                 0
Actual Medium:         127              651                 45
Actual High:           1                89                  83
```

---

## 3. Feature Importance Distribution & Dominance Audit

> **Audit Criterion:** No single feature may account for more than 50.0% of total Gini importance.

| Rank | Feature Name | Gini Importance | Relative Weight (%) | Dominance Check (<50%) |
| :---: | :--- | :---: | :---: | :---: |
| 1 | `leave_backlog_days` | 0.0878 | 8.78% | Passed (<50%) |
| 2 | `family_separation_months` | 0.0651 | 6.51% | Passed (<50%) |
| 3 | `conduct_flag` | 0.0501 | 5.01% | Passed (<50%) |
| 4 | `fatigue_score` | 0.0438 | 4.38% | Passed (<50%) |
| 5 | `days_since_last_leave` | 0.0433 | 4.33% | Passed (<50%) |
| 6 | `stress_score` | 0.0413 | 4.13% | Passed (<50%) |
| 7 | `overtime_hours_monthly` | 0.0404 | 4.04% | Passed (<50%) |
| 8 | `consecutive_night_duty_days` | 0.0395 | 3.95% | Passed (<50%) |
| 9 | `sleep_quality_score` | 0.0371 | 3.71% | Passed (<50%) |
| 10 | `duty_hours_daily` | 0.0367 | 3.67% | Passed (<50%) |
| 11 | `social_support_score` | 0.0273 | 2.73% | Passed (<50%) |
| 12 | `emotional_wellbeing_score` | 0.0238 | 2.38% | Passed (<50%) |
| 13 | `overtime_flag` | 0.0234 | 2.34% | Passed (<50%) |
| 14 | `satisfaction_score` | 0.0223 | 2.23% | Passed (<50%) |
| 15 | `body_mass_index` | 0.0220 | 2.20% | Passed (<50%) |
| 16 | `daily_workload_score` | 0.0220 | 2.20% | Passed (<50%) |
| 17 | `transit_separation_burden` | 0.0217 | 2.17% | Passed (<50%) |
| 18 | `deployment_duration_days` | 0.0197 | 1.97% | Passed (<50%) |
| 19 | `stagnation_per_tenure_ratio` | 0.0183 | 1.83% | Passed (<50%) |
| 20 | `unit_manning_shortfall_pct` | 0.0182 | 1.82% | Passed (<50%) |
| 21 | `distance_from_home_station_km` | 0.0181 | 1.81% | Passed (<50%) |
| 22 | `manning_absenteeism_load` | 0.0177 | 1.77% | Passed (<50%) |
| 23 | `promotion_stagnation_years` | 0.0174 | 1.74% | Passed (<50%) |
| 24 | `manning_training_ratio` | 0.0170 | 1.70% | Passed (<50%) |
| 25 | `deployment_theatre_encoded` | 0.0168 | 1.68% | Passed (<50%) |
| 26 | `service_tenure_years` | 0.0167 | 1.67% | Passed (<50%) |
| 27 | `leave_days_last_90d` | 0.0161 | 1.61% | Passed (<50%) |
| 28 | `training_vs_unit_median` | 0.0159 | 1.59% | Passed (<50%) |
| 29 | `age` | 0.0153 | 1.53% | Passed (<50%) |
| 30 | `training_hours_last_year` | 0.0150 | 1.50% | Passed (<50%) |
| 31 | `rest_hours_daily` | 0.0135 | 1.35% | Passed (<50%) |
| 32 | `work_life_balance_score` | 0.0134 | 1.34% | Passed (<50%) |
| 33 | `night_shift_frequency_monthly` | 0.0134 | 1.34% | Passed (<50%) |
| 34 | `transfer_tenure_friction` | 0.0129 | 1.29% | Passed (<50%) |
| 35 | `fitness_trend_score` | 0.0125 | 1.25% | Passed (<50%) |
| 36 | `absenteeism_vs_rank_median` | 0.0122 | 1.22% | Passed (<50%) |
| 37 | `absenteeism_hours_last_year` | 0.0121 | 1.21% | Passed (<50%) |
| 38 | `annual_fitness_grade_encoded` | 0.0076 | 0.76% | Passed (<50%) |
| 39 | `rank_encoded` | 0.0071 | 0.71% | Passed (<50%) |
| 40 | `unit_type_encoded` | 0.0066 | 0.66% | Passed (<50%) |
| 41 | `commute_transit_days` | 0.0064 | 0.64% | Passed (<50%) |
| 42 | `num_dependents` | 0.0063 | 0.63% | Passed (<50%) |
| 43 | `posting_transfer_count_last_2yrs` | 0.0062 | 0.62% | Passed (<50%) |

### Dominance Audit Verdict: **PASSED**
- **Highest Contributing Feature**: `leave_backlog_days` at **8.78%** importance.
- **Key Insight**: Importance is smoothly distributed across leave friction, night duty vigilance, medical status, and family separation. No shortcut or dominant arithmetic proxy exists.
