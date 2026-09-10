# Data Quality & Preprocessing Audit Report (Revision 3)

**Final File:** `final_training_dataset.csv`  
**Total Records:** 7,500  
**Total Features:** 47 feature columns (40 base/raw + 7 engineered) + 2 target columns (49 total)  
**Target Label:** `welfare_risk_level` (Low, Medium, High)  
**Gaussian Supervision Noise:** $\sigma = 1.0$, clipped to $[-2.5, +2.5]$  
**Noise Ceilings:** $R^2 \le 95.2\%$, Classification Accuracy $\le 92.5\%$  

---

## 1. Cross-Source Imputation Strategy: Empirical Sampling

| Column Name | Primary Source | Non-Null Sampling Pool Size | Resulting Mean | Resulting Std | Imputation Methodology |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `body_mass_index` | UCI Absenteeism | 740 records | 26.7 | 4.32 | Empirical bootstrap with replacement |
| `num_dependents` | UCI Absenteeism | 740 records | 1.0 | 1.10 | Empirical bootstrap with replacement |
| `absenteeism_hours_last_year` | UCI + HR14 | 1,051 records | 32.5 | 46.56 | Empirical bootstrap with replacement |
| `work_life_balance_score` | IBM HR Attrition | 1,470 records | 2.8 | 0.72 | Empirical bootstrap with replacement |

- **Missing Values in Final CSV**: **0 (0.00%)** across all 49 columns.

---

## 2. Vector Independence Audit: Raw Driving Variables Matrix (Part 1)

> **Independence Mandate**: To eliminate structural multicollinearity, raw driving variables across the 7 WSI vectors were decoupled.
> **Audit Threshold**: No pair of raw driving variables may exceed $|r| = 0.40$.

| Driving Variable | `v1_leave_backlog` | `v1_days_since_leave` | `v2_consec_nights` | `v2_duty_hours` | `v2_overtime_hours` | `v3_stress_score` | `v3_wellbeing_score` | `v3_satisfaction` | `v4_sleep_quality` | `v4_fatigue_score` | `v4_rest_hours` | `v5_family_sep` | `v5_social_support` | `v6_bmi` | `v6_fitness_trend` | `v7_conduct_flag` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `v1_leave_backlog` | 1.00 | 0.09 | 0.01 | -0.01 | 0.01 | -0.01 | -0.01 | -0.02 | -0.01 | -0.01 | 0.01 | -0.00 | 0.01 | -0.02 | 0.02 | -0.01 |
| `v1_days_since_leave` | 0.09 | 1.00 | -0.02 | 0.01 | -0.02 | -0.00 | 0.00 | -0.00 | 0.02 | 0.02 | -0.00 | 0.02 | 0.01 | 0.01 | 0.01 | 0.01 |
| `v2_consec_nights` | 0.01 | -0.02 | 1.00 | 0.01 | 0.00 | 0.10 | -0.02 | -0.01 | -0.14 | 0.10 | 0.00 | 0.01 | 0.00 | 0.02 | 0.02 | -0.02 |
| `v2_duty_hours` | -0.01 | 0.01 | 0.01 | 1.00 | 0.01 | 0.13 | -0.03 | -0.00 | -0.09 | 0.14 | -0.10 | -0.00 | 0.01 | -0.01 | 0.01 | 0.01 |
| `v2_overtime_hours` | 0.01 | -0.02 | 0.00 | 0.01 | 1.00 | -0.01 | 0.01 | -0.00 | -0.00 | 0.00 | 0.01 | -0.01 | 0.01 | 0.02 | -0.01 | 0.03 |
| `v3_stress_score` | -0.01 | -0.00 | 0.10 | 0.13 | -0.01 | 1.00 | -0.12 | 0.01 | -0.03 | 0.03 | -0.01 | 0.01 | 0.02 | 0.02 | 0.01 | -0.00 |
| `v3_wellbeing_score` | -0.01 | 0.00 | -0.02 | -0.03 | 0.01 | -0.12 | 1.00 | -0.01 | 0.01 | 0.00 | -0.00 | 0.00 | 0.02 | 0.00 | -0.00 | -0.02 |
| `v3_satisfaction` | -0.02 | -0.00 | -0.01 | -0.00 | -0.00 | 0.01 | -0.01 | 1.00 | -0.00 | -0.01 | -0.00 | -0.02 | -0.01 | -0.00 | 0.03 | 0.02 |
| `v4_sleep_quality` | -0.01 | 0.02 | -0.14 | -0.09 | -0.00 | -0.03 | 0.01 | -0.00 | 1.00 | -0.03 | 0.00 | -0.01 | -0.00 | -0.00 | 0.01 | 0.01 |
| `v4_fatigue_score` | -0.01 | 0.02 | 0.10 | 0.14 | 0.00 | 0.03 | 0.00 | -0.01 | -0.03 | 1.00 | 0.00 | 0.00 | -0.00 | 0.01 | -0.01 | -0.01 |
| `v4_rest_hours` | 0.01 | -0.00 | 0.00 | -0.10 | 0.01 | -0.01 | -0.00 | -0.00 | 0.00 | 0.00 | 1.00 | -0.00 | 0.01 | -0.02 | 0.01 | -0.01 |
| `v5_family_sep` | -0.00 | 0.02 | 0.01 | -0.00 | -0.01 | 0.01 | 0.00 | -0.02 | -0.01 | 0.00 | -0.00 | 1.00 | -0.23 | 0.00 | -0.00 | 0.01 |
| `v5_social_support` | 0.01 | 0.01 | 0.00 | 0.01 | 0.01 | 0.02 | 0.02 | -0.01 | -0.00 | -0.00 | 0.01 | -0.23 | 1.00 | -0.01 | -0.03 | 0.01 |
| `v6_bmi` | -0.02 | 0.01 | 0.02 | -0.01 | 0.02 | 0.02 | 0.00 | -0.00 | -0.00 | 0.01 | -0.02 | 0.00 | -0.01 | 1.00 | -0.00 | 0.02 |
| `v6_fitness_trend` | 0.02 | 0.01 | 0.02 | 0.01 | -0.01 | 0.01 | -0.00 | 0.03 | 0.01 | -0.01 | 0.01 | -0.00 | -0.03 | -0.00 | 1.00 | -0.02 |
| `v7_conduct_flag` | -0.01 | 0.01 | -0.02 | 0.01 | 0.03 | -0.00 | -0.02 | 0.02 | 0.01 | -0.01 | -0.01 | 0.01 | 0.01 | 0.02 | -0.02 | 1.00 |


### Independence Verdict: **PASSED**
- **Maximum Pairwise Correlation Across All 16 Variables**: **$|r| = 0.2260$** (between `v5_family_sep` and `v5_social_support`).
- **Zero Collinear Pairs**: Zero pairs exceed the 0.40 ceiling.

---

## 3. Leakage-Safe Feature Engineering Correlation Audit (Part 2)

All 12 previous compound interaction features (which recombined WSI terms) were **completely removed**. They were replaced with 7 leakage-safe features built via:
- (a) Peer-relative cohort medians (`training_vs_unit_median`, `absenteeism_vs_rank_median`)
- (b) Genuinely new raw signals not in the WSI formula (`unit_manning_shortfall_pct`, `promotion_stagnation_years`, `commute_transit_days`) and safe non-WSI interactions.

> **Audit Criteria**:
> 1. Correlation with `wsi_deterministic` must be $< 0.50$.
> 2. Correlation with each of the 7 individual vectors ($V_1$ to $V_7$) must be $< 0.40$.

| Feature Name | Type | Correlation with `wsi_deterministic` (<0.50) | Max Vector Correlation (<0.40) | Audit Status |
| :--- | :---: | :---: | :---: | :---: |
| `stagnation_per_tenure_ratio` | Leakage-Safe | **0.0469** | `v_conduct`: **0.0795** | **PASSED** |
| `transit_separation_burden` | Leakage-Safe | **0.1364** | `v_fam`: **0.3400** | **PASSED** |
| `manning_training_ratio` | Leakage-Safe | **0.0498** | `v_duty`: **0.0751** | **PASSED** |
| `transfer_tenure_friction` | Leakage-Safe | **0.0136** | `v_conduct`: **0.0489** | **PASSED** |
| `manning_absenteeism_load` | Leakage-Safe | **0.0193** | `v_psych`: **0.0264** | **PASSED** |
| `training_vs_unit_median` | Leakage-Safe | **0.0625** | `v_duty`: **0.0871** | **PASSED** |
| `absenteeism_vs_rank_median` | Leakage-Safe | **0.0082** | `v_psych`: **0.0320** | **PASSED** |


### Leakage Audit Verdict: **PASSED**
Every engineered feature is verified to contribute genuine incremental signal without reverse-engineering the target equation.

---

## 4. Strict Integer Rounding Audit

All count, duration, and categorical indicator columns are strictly verified as `int64`:
- `age`, `num_dependents`, `posting_transfer_count_last_2yrs`, `duty_hours_daily`, `rest_hours_daily`
- `overtime_hours_monthly`, `night_shift_frequency_monthly`, `consecutive_night_duty_days`
- `leave_backlog_days`, `days_since_last_leave`, `leave_days_last_90d`, `family_separation_months`
- `deployment_duration_days`, `training_hours_last_year`, `conduct_flag`, `overtime_flag`, `commute_transit_days`
