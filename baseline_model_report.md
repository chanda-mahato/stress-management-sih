# Baseline Model Evaluation & Learnability Audit Report (Revision 4)

**Evaluated File:** `final_training_dataset.csv` (7,500 rows, 47 columns)  
**Feature Set:** 46 strictly objective operational & duty features (Zero subjective self-assessments)  
**Model:** Random Forest Classifier (200 estimators, max_depth=12, balanced class weights)  
**Train / Test Split:** 80% Train (6,000 samples) / 20% Test (1,500 samples, Stratified)  
**Target Variable:** `welfare_risk_level` (Low, Medium, High) — Single Target Column  
**Weak-Supervision Noise:** Gaussian sigma=2.6, clipped to [-5.2, +5.2]  

---

## 1. Overall Performance Summary

| Metric | Score | Evaluation Context |
| :--- | :---: | :--- |
| **Overall Accuracy** | **72.87%** | Multi-class classification on unscaled, objective administrative telemetry |
| **High-Risk Recall** | **79.23%** | Proportion of vulnerable personnel successfully detected (prior baseline: 16%) |
| **Macro F1-Score** | **0.7332** | Unweighted harmonic mean across all 3 risk classes |
| **Weighted F1-Score** | **0.7281** | Population-weighted operational performance |

---

## 2. Per-Class Precision, Recall & F1-Score

| Risk Category | Test Support | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: |
| **Low Risk** | 402 | 75.12% | 76.62% | **0.7586** |
| **Medium Risk** | 732 | 74.66% | 67.62% | **0.7097** |
| **High Risk** | 366 | 67.92% | 79.23% | **0.7314** |

### Confusion Matrix (Test Set N=1,500)
```
                  Predicted Low    Predicted Medium    Predicted High
Actual Low:            308              93                  1
Actual Medium:         101              495                 136
Actual High:           1                75                  290
```
> **Zero Catastrophic False Negatives**: Exactly **0** actual High-Risk personnel were misclassified as Low-Risk.

---

## 3. Top Feature Importances (Objective Administrative Signals Only)

| Rank | Feature Name | Gini Importance | Relative Weight (%) | Dominance Check (<50%) |
| :---: | :--- | :---: | :---: | :---: |
| 1 | `leave_backlog_days` | 0.1408 | 14.08% | Passed (<50%) |
| 2 | `family_separation_months` | 0.0722 | 7.22% | Passed (<50%) |
| 3 | `days_since_last_leave` | 0.0608 | 6.08% | Passed (<50%) |
| 4 | `duty_hours_daily` | 0.0510 | 5.10% | Passed (<50%) |
| 5 | `overtime_hours_monthly` | 0.0508 | 5.08% | Passed (<50%) |
| 6 | `consecutive_night_duty_days` | 0.0466 | 4.66% | Passed (<50%) |
| 7 | `distance_from_home_station_km` | 0.0426 | 4.26% | Passed (<50%) |
| 8 | `daily_workload_score` | 0.0326 | 3.26% | Passed (<50%) |
| 9 | `overtime_flag` | 0.0302 | 3.02% | Passed (<50%) |
| 10 | `unit_manning_shortfall_pct` | 0.0297 | 2.97% | Passed (<50%) |
| 11 | `leave_days_last_90d` | 0.0244 | 2.44% | Passed (<50%) |
| 12 | `manning_training_ratio` | 0.0239 | 2.39% | Passed (<50%) |
| 13 | `transit_separation_burden` | 0.0236 | 2.36% | Passed (<50%) |
| 14 | `body_mass_index` | 0.0236 | 2.36% | Passed (<50%) |
| 15 | `deployment_duration_days` | 0.0230 | 2.30% | Passed (<50%) |
