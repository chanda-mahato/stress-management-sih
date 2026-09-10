# Data Dictionary: SIH 2026 PS26186 Final Training Dataset (Revision 3)

## 1. Dataset Provenance & Official Source Repositories

| Source Name | Platform / Repository | Official Identifier / URL & License | Extracted Signals |
| :--- | :--- | :--- | :--- |
| **UCI Absenteeism at Work** | UCI Machine Learning Repository | Identifier: [`https://archive.ics.uci.edu/dataset/445/absenteeism+at+work`](https://archive.ics.uci.edu/dataset/445/absenteeism+at+work)<br>License: CC BY 4.0 | Absenteeism hours, disciplinary failure, daily workload, commute distance, BMI, dependents |
| **IBM HR Analytics Employee Attrition** | Kaggle | Kaggle ID: [`pavansubhasht/ibm-hr-analytics-attrition-dataset`](https://www.kaggle.com/datasets/pavansubhasht/ibm-hr-analytics-attrition-dataset)<br>Description: IBM's publicly released synthetic/fictional HR sample dataset distributed via Kaggle.<br>License: Open Database License (ODbL) | Overtime flag, job satisfaction, work-life balance, tenure, commute distance |
| **Human Resources Data Set (v14)** | Kaggle | Kaggle ID: [`rhuebner/human-resources-data-set`](https://www.kaggle.com/datasets/rhuebner/human-resources-data-set)<br>Creator: Dr. Carla Patalano / Rich Huebner<br>License: CC0: Public Domain | Absence days, employee satisfaction, late days count, special project workload |
| **Human Resources Analytics (15k Benchmark)** | Kaggle | Kaggle ID: [`ludovicbe/hr-analytics`](https://www.kaggle.com/datasets/ludovicbe/hr-analytics)<br>Creator: Ludovic Benistant<br>Direct CSV: `HR_comma_sep.csv`<br>License: **CC0: Public Domain** (Permits unrestricted hackathon, research, and commercial reuse) | High-volume shift hours (average monthly hours), satisfaction level, tenure, work accident |
| **Synthetic Force-Context Layer** | Procedural Simulation Engine | Grounded in CRPF/CAPF operational standards and occupational health doctrine | Deployment theatre, unit type, rank hierarchy, leave backlog, night duty, family separation, manning shortfall |

> [!IMPORTANT]
> **Defense Personnel Telemetry Classification Notice (Part 6):**
> Actual operational, medical, and psychological telemetry of Indian Uniformed Forces (CRPF/CAPF) is strictly classified and restricted under Ministry of Home Affairs guidelines. Therefore, all CRPF-specific attributes (`rank`, `deployment_theatre`, `duty_hours`, `leave metrics`, `stress/sleep/fatigue/social-support/wellbeing scores`, `deployment metrics`) are **procedurally simulated** using domain-grounded distributions. Only the baseline corporate HR fields from UCI, IBM, HRDataset_v14, and Kaggle reflect real historical corporate records. Every column is rigorously and honestly tagged below.

---

## 2. Column-by-Column Schema with Per-Column Provenance Tags

> **Provenance Tags Guide:**
> - `real_derived`: Extracted or calibrated from real public benchmark records (UCI, IBM, Kaggle).
> - `synthetic_generated`: Procedurally simulated force-specific operational/duty attributes.
> - `formula_derived`: Derived through mathematical scoring, encoding, or leakage-safe engineering.

| Column Name | Provenance Tag | Source Representation | Data Type | Permitted Range / Categories | Description |
| :--- | :---: | :--- | :---: | :--- | :--- |
| `age` | `real_derived` | UCI / IBM `Age` | `int64` | 20 to 60 | Personnel chronological age in years. |
| `service_tenure_years` | `real_derived` | UCI `Service time` / IBM `YearsAtCompany` | `float64` | 0.5 to 38.0 | Total accumulated active service duration. |
| `distance_from_home_station_km` | `real_derived` | UCI / IBM commute distance scaled | `float64` | 1.0 to 100.0 | Distance from permanent hometown across deployment geography. |
| `num_dependents` | `real_derived` | UCI `Son` (empirical distribution) | `int64` | 0 to 5 | Number of dependent children and immediate family members. |
| `rank` | `synthetic_generated` | Force Hierarchy | `string` | Constable to Commandant | Hierarchical rank in uniformed force pyramid. |
| `rank_encoded` | `formula_derived` | Label Encoded Rank | `int64` | 0 to 6 | Integer mapping of personnel rank. |
| `unit_type` | `synthetic_generated` | Force Unit Specialization | `string` | GD, CoBRA, RAF, VIP, Signal, Medical | Operational wing or battalion deployment assignment. |
| `unit_type_encoded` | `formula_derived` | Label Encoded Unit | `int64` | 0 to 5 | Integer mapping of unit type. |
| `deployment_theatre` | `synthetic_generated` | Command Theatres | `string` | J&K, LWE Bastar, NE, Border, VIP, Peace | Active operational area. |
| `deployment_theatre_encoded` | `formula_derived` | Label Encoded Theatre | `int64` | 0 to 5 | Integer mapping of operational theatre. |
| `deployment_duration_days` | `synthetic_generated` | Tour of Duty Tracker | `int64` | 15 to 730 | Continuous days deployed in current operational battalion. |
| `posting_transfer_count_last_2yrs` | `synthetic_generated` | Transfer Ledger | `int64` | 0 to 4 | Frequency of unit transfers and postings over past 24 months. |
| `unit_manning_shortfall_pct` | `synthetic_generated` | Unit Vacancy Ledger | `float64` | 5.0 to 45.0% | Unit/company vacancy or understaffing deficit percentage. |
| `promotion_stagnation_years` | `synthetic_generated` | Seniority Roll | `float64` | 0.5 to 25.0 | Years elapsed in current rank without promotional elevation. |
| `commute_transit_days` | `synthetic_generated` | Travel Warrant Ledger | `int64` | 1 to 6 | Transit travel days required between outpost and home state. |
| `duty_hours_daily` | `synthetic_generated` | Roster Duty Hours | `int64` | 8 to 16 | Scheduled daily hours of active duty, patrol, or sentry watch. |
| `rest_hours_daily` | `synthetic_generated` | Decompression Hours | `int64` | 4 to 11 | Uninterrupted recovery hours (decoupled from duty hours). |
| `overtime_hours_monthly` | `synthetic_generated` | Overtime Tracker | `int64` | 0 to 80 | Cumulative monthly overtime beyond standard shift allotment. |
| `night_shift_frequency_monthly` | `synthetic_generated` | Night Vigil Tracker | `int64` | 0 to 22 | Total overnight duties assigned in the preceding 30 days. |
| `consecutive_night_duty_days` | `synthetic_generated` | Sentry Vigil Run | `int64` | 0 to 21 | Consecutive overnight perimeter watch or ambush patrol shifts. |
| `overtime_flag` | `real_derived` | IBM `OverTime` / Large HR | `int64` | 0 or 1 | 1 = Routinely subjected to shift overruns and extended duties. |
| `daily_workload_score` | `real_derived` | UCI / Large HR workload index | `float64` | 1.0 to 10.0 | Normalized operational intensity and mission load index. |
| `training_hours_last_year` | `synthetic_generated` | Annual Training Log | `int64` | 0 to 120 | Refresher tactical, weapon, and fitness training hours attended. |
| `leave_backlog_days` | `synthetic_generated` | Leave Ledger | `int64` | 0 to 60 | Accrued earned/casual leave denied or deferred due to operations. |
| `days_since_last_leave` | `synthetic_generated` | Leave Ledger | `int64` | 5 to 365 | Days elapsed since personnel last completed a sanctioned leave. |
| `leave_days_last_90d` | `synthetic_generated` | Leave Ledger | `int64` | 0 to 30 | Sanctioned leave days utilized in the preceding 90 days. |
| `absenteeism_hours_last_year` | `real_derived` | UCI / HR14 absences | `int64` | 0 to 200 | Unscheduled, medical, or emergency absence hours in past 12m. |
| `family_separation_months` | `synthetic_generated` | Quarter Allotment Ledger | `int64` | 0 to 24 | Continuous months stationed away from family quarters. |
| `conduct_flag` | `real_derived` | Disciplinary failure / Late days | `int64` | 0 or 1 | 1 = Subject to formal inquiry, warning, or reporting friction. |
| `satisfaction_score` | `real_derived` | IBM / HR14 / Large HR | `float64` | 1.0 to 4.0 | Morale and perceived organizational support score. |
| `work_life_balance_score` | `real_derived` | IBM `WorkLifeBalance` | `float64` | 1.0 to 4.0 | Subjective assessment of personal time and recovery opportunities. |
| `stress_score` | `synthetic_generated` | Screening / DASS Proxy | `float64` | 1.0 to 10.0 | Perceived stress rating (independent latent generator). |
| `sleep_quality_score` | `synthetic_generated` | Mobile Wellness Check-in | `float64` | 1.0 to 10.0 | Sleep restfulness score (independent latent generator). |
| `fatigue_score` | `synthetic_generated` | Mobile Wellness Check-in | `float64` | 1.0 to 10.0 | Cumulative physical exhaustion index (independent latent generator). |
| `social_support_score` | `synthetic_generated` | Mobile Wellness Check-in | `float64` | 1.0 to 5.0 | Peer buddy system and unit cohesion rating. |
| `emotional_wellbeing_score` | `synthetic_generated` | Mobile Wellness Check-in | `float64` | 1.0 to 5.0 | Emotional stability and psychological coping disposition score. |
| `body_mass_index` | `real_derived` | UCI `Body mass index` | `float64` | 17.0 to 39.0 | Annual medical board BMI assessment (kg/m²). |
| `annual_fitness_grade` | `synthetic_generated` | Indian Armed Forces SHAPE | `string` | SHAPE-1 to SHAPE-4 | Medical board physical fitness classification. |
| `annual_fitness_grade_encoded` | `formula_derived` | Label Encoded SHAPE | `int64` | 0 to 3 | Integer mapping of SHAPE classification. |
| `fitness_trend_score` | `synthetic_generated` | Annual Fitness Comparison | `int64` | -2 to +2 | Longitudinal physical assessment change (-2=Severe drop, +2=Gain). |

### Leakage-Safe Engineered Features (Part 2)

| Column Name | Provenance Tag | Construction Strategy | Data Type | Description |
| :--- | :---: | :--- | :---: | :--- |
| `stagnation_per_tenure_ratio` | `formula_derived` | Ratio with New Raw Variable | `float64` | `promotion_stagnation_years / (service_tenure_years + 1.0)`. |
| `transit_separation_burden` | `formula_derived` | Interaction with New Raw Variable | `float64` | `commute_transit_days * log(1 + family_separation_months)`. |
| `manning_training_ratio` | `formula_derived` | Interaction with New Raw Variable | `float64` | `unit_manning_shortfall_pct / (training_hours_last_year + 5.0)`. |
| `transfer_tenure_friction` | `formula_derived` | Career Mobility Ratio | `float64` | `posting_transfer_count_last_2yrs / (service_tenure_years + 1.0)`. |
| `manning_absenteeism_load` | `formula_derived` | Operational Strain Compound | `float64` | `unit_manning_shortfall_pct * (absenteeism_hours_last_year / 100.0)`. |
| `training_vs_unit_median` | `formula_derived` | Peer Cohort Median Deviation | `float64` | `training_hours_last_year - median(training_hours by unit_type)`. |
| `absenteeism_vs_rank_median` | `formula_derived` | Peer Cohort Median Deviation | `float64` | `absenteeism_hours_last_year - median(absenteeism_hours by rank)`. |

### Target Variables

| Column Name | Provenance Tag | Data Type | Permitted Values | Description |
| :--- | :---: | :---: | :---: | :--- |
| `welfare_risk_level_encoded` | `formula_derived` | `int64` | 0, 1, 2 | 0 = Low Risk, 1 = Medium Risk, 2 = High Risk. |
| `welfare_risk_level` | `formula_derived` | `string` | Low, Medium, High | **Primary supervised classification target.** |

---

## 3. Audit-Trail Only Columns (In `final_training_dataset_audit_trail.csv`)

| Column Name | Provenance Tag | Description |
| :--- | :---: | :--- |
| `personnel_id` | `synthetic_generated` | Unique anonymized personnel identifier (`CRPF-2026xxxx`). |
| `source_dataset` | `formula_derived` | Originating benchmark source dataset tag. |
| `wsi_deterministic` | `formula_derived` | Theoretical raw Welfare Stress Index before noise injection. |
| `wsi_noise_applied` | `formula_derived` | Injected zero-mean Gaussian weak-supervision noise ($\sigma=1.0, [-2.5, +2.5]$). |
| `wsi_score` | `formula_derived` | Bounded composite index used for categorical risk bucketing. |
