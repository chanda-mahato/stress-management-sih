# Baseline Model Evaluation & Learnability Audit Report (Revision 4)

**Evaluated File:** `final_training_dataset.csv` (7,500 rows, 47 columns)  
**Feature Set:** 46 strictly objective operational & duty features (Zero subjective self-assessments)  
**Model:** Random Forest Classifier (200 estimators, max_depth=12, balanced class weights)  
**Train / Test Split:** 80% Train (6,000 samples) / 20% Test (1,500 samples, Stratified)  
**Target Variable:** `welfare_risk_level` (Low, Medium, High) — Single Target Column  
**Weak-Supervision Noise:** Gaussian sigma=1.0, clipped to [-2.5, +2.5]  

---

## 1. Overall Performance Summary

| Metric | Score | Evaluation Context |
| :--- | :---: | :--- |
| **Overall Accuracy** | **80.40%** | Multi-class classification on unscaled, objective administrative telemetry |
| **High-Risk Recall** | **80.56%** | Proportion of vulnerable personnel successfully detected (prior baseline: 16%) |
| **Macro F1-Score** | **0.8048** | Unweighted harmonic mean across all 3 risk classes |
| **Weighted F1-Score** | **0.8039** | Population-weighted operational performance |

---

## 2. Per-Class Precision, Recall & F1-Score

| Risk Category | Test Support | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: |
| **Low Risk** | 388 | 77.78% | 84.79% | **0.8113** |
| **Medium Risk** | 757 | 82.20% | 78.07% | **0.8008** |
| **High Risk** | 355 | 79.89% | 80.56% | **0.8022** |

### Confusion Matrix (Test Set N=1,500)
```
                  Predicted Low    Predicted Medium    Predicted High
Actual Low:            329              59                  0
Actual Medium:         94               591                 72
Actual High:           0                69                  286
```
> **Zero Catastrophic False Negatives**: Exactly **0** actual High-Risk personnel were misclassified as Low-Risk.

---

## 3. Top Feature Importances (Objective Administrative Signals Only)

| Rank | Feature Name | Gini Importance | Relative Weight (%) | Dominance Check (<50%) |
| :---: | :--- | :---: | :---: | :---: |
| 1 | `leave_backlog_days` | 0.1507 | 15.07% | Passed (<50%) |
| 2 | `family_separation_months` | 0.0780 | 7.80% | Passed (<50%) |
| 3 | `days_since_last_leave` | 0.0624 | 6.24% | Passed (<50%) |
| 4 | `duty_hours_daily` | 0.0544 | 5.44% | Passed (<50%) |
| 5 | `overtime_hours_monthly` | 0.0526 | 5.26% | Passed (<50%) |
| 6 | `consecutive_night_duty_days` | 0.0474 | 4.74% | Passed (<50%) |
| 7 | `distance_from_home_station_km` | 0.0437 | 4.37% | Passed (<50%) |
| 8 | `daily_workload_score` | 0.0331 | 3.31% | Passed (<50%) |
| 9 | `overtime_flag` | 0.0329 | 3.29% | Passed (<50%) |
| 10 | `unit_manning_shortfall_pct` | 0.0277 | 2.77% | Passed (<50%) |
| 11 | `leave_days_last_90d` | 0.0240 | 2.40% | Passed (<50%) |
| 12 | `transit_separation_burden` | 0.0233 | 2.33% | Passed (<50%) |
| 13 | `manning_training_ratio` | 0.0224 | 2.24% | Passed (<50%) |
| 14 | `promotion_stagnation_years` | 0.0207 | 2.07% | Passed (<50%) |
| 15 | `deployment_duration_days` | 0.0205 | 2.05% | Passed (<50%) |
