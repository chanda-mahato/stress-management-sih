# SIH 2026 PS SIH26186: Predictive Personnel Stress & Welfare Monitoring System (Revision 3)

## Overview
This repository contains the production-grade, mathematically calibrated dataset pipeline, machine learning models, and command triage CLI for **Smart India Hackathon 2026 Problem Statement 26186** (*"AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces"*, Ministry of Home Affairs / CRPF).

> ⚠️ **MHA Reviewer Notice on Governance & Deployment Scope**:  
> See [GOVERNANCE_AND_DEPLOYMENT_SCOPE.md](GOVERNANCE_AND_DEPLOYMENT_SCOPE.md) for data sovereignty, misuse prevention, and pilot-deployment scope before considering this for any real personnel data.

---

## Core System Architecture

```
                                  DATA ACQUISITION & FUSION
 +-----------------------+   +-----------------------+   +-----------------------+   +-----------------------+
 | UCI Absenteeism (740) |   | IBM HR Attrition(1.4k)|   |  HRDataset_v14 (311)  |   |  Large HR (14.9k)     |
 +-----------+-----------+   +-----------+-----------+   +-----------+-----------+   +-----------+-----------+
             |                           |                           |                           |
             +---------------------------+-------------+-------------+---------------------------+
                                                       |
                                                       v
                                     +-----------------------------------+
                                     | Empirical Imputation & Resampling |
                                     | Bootstrapping to 7,500 Records    |
                                     +-----------------+-----------------+
                                                       |
                                                       v
                                     +-----------------------------------+
                                     | Decoupled CRPF Force Telemetry    |
                                     | (Part 1: Independent Root Causes) |
                                     +-----------------+-----------------+
                                                       |
                                                       v
                                     +-----------------------------------+
                                     | Multi-Vector WSI Calculation      |
                                     | + Calibrated Noise (sigma=2.6)    |
                                     +-----------------+-----------------+
                                                       |
                                                       v
                                     +-----------------------------------+
                                     | Leakage-Safe Feature Engineering  |
                                     | (Part 2: 7 Safe Cohort Features)  |
                                     +-----------------+-----------------+
                                                       |
                                                       v
                        +------------------------------+------------------------------+
                        |                                                             |
                        v                                                             v
        +-------------------------------+                             +-------------------------------+
        |   Operational Classification  |                             |   Continuous WSI Regression   |
        |   (36 Raw Features Only)      |                             |   (43 Full Features Space)    |
        |   XGBoost + LightGBM + CB     |                             |   XGBoost + LightGBM + CB     |
        |   Tuned Soft-Vote Simplex     |                             |   Optimal Blended Generalize  |
        +---------------+---------------+                             +---------------+---------------+
                        |                                                             |
                        +------------------------------+------------------------------+
                                                       |
                                                       v
                                     +-----------------------------------+
                                     | Command Triage & Explainability   |
                                     | SHAP Drivers + Automated SOPs     |
                                     +-----------------------------------+
```

---

## Deliverables & Repository Structure

1. **Data Pipeline & Datasets**:
   - `dataset_pipeline.py`: Automated generator establishing vector independence, leakage-safe features, and calibrated noise.
   - `final_training_dataset.csv`: 7,500 personnel records, 47 feature columns + 2 target columns (49 total).
   - `final_training_dataset_audit_trail.csv`: Complete research audit trail with all 7 sub-vector scores.
   - `data/processed/noise_config.json`: Single source of truth for weak-supervision noise ($\sigma = 2.6$, $[-5.2, +5.2]$).
2. **Machine Learning & Inference (`src/`)**:
   - `src/train_ensemble.py`: Tri-Model ensemble training, validation hyperparameter tuning, class-weight tuning, and soft-vote simplex search.
   - `src/predict.py`: Dual-feature inference engine routing 36 raw features to classifier/SHAP and 43 features to regressor.
   - `src/explainability.py`: Defense-grade SHAP TreeExplainer generating global attributions and individual dossiers.
   - `src/data_loader.py`: Modular data loader with feature partition helpers (`raw_only=True/False`).
3. **Interactive Tools & CLI**:
   - `demo_cli.py`: Interactive command triage terminal demonstrating personnel dossiers, calibrated risk tiers, SHAP root causes, and SOP directives.
4. **Trained Models (`models/`)**:
   - `models/tri_model_ensemble.joblib`: Soft-voting classifier ensemble (`w = [0.10, 0.20, 0.70]`).
   - `models/tri_model_regressor.joblib`: Regression ensemble (`w = [0.10, 0.10, 0.80]`).
   - `models/ensemble_metadata.json`: Complete tuning parameters, weights, and feature mappings.
5. **Documentation & Verification Reports**:
   - `LABEL_LOGIC.md`: Mathematical formulation of 7 independent vectors, noise calibration, and risk thresholds.
   - `data_dictionary.md`: Complete schema mapping with strict data provenance tags (`real_derived`, `synthetic_generated`, `formula_derived`).
   - `data_quality_report.md`: Empirical imputation audits, vector independence audit ($r < 0.40$), and leakage audits ($r < 0.50$).
   - `experiments/model_comparison_report.md`: Comprehensive benchmark against theoretical mathematical ceilings.
   - `experiments/confusion_matrix_ensemble.png`: Test set confusion matrix (0 catastrophic False Negatives).
   - `experiments/shap_summary_plot.png`: Global SHAP feature importance plot.

---

## Benchmark Results (Test Set $N=1,500$)

- **Continuous Stress Regression ($WSI \in [0, 100]$)**:
  - Theoretical Ceiling: $R^2 \le 85.60\%$
  - CatBoost Regressor: **$84.37\% R^2$** (RMSE: $2.649$, MAE: $2.126$) — **$98.6\%$ of mathematical ceiling**
  - Tri-Model Ensemble: **$84.16\% R^2$** (RMSE: $2.667$, MAE: $2.141$) — **$98.3\%$ of mathematical ceiling**
- **Operational Triage Classification (Low / Medium / High)**:
  - Theoretical Ceiling: $\text{Acc} \le 82.20\%$
  - CatBoost Classifier: **$77.07\%$ Accuracy** | **$0.7550$ Macro F1** | **$78.61\%$ High-Risk Recall**
  - Tri-Model Ensemble: **$76.87\%$ Accuracy** | **$0.7491$ Macro F1** | **$74.57\%$ High-Risk Recall**
  - Safety Metric: **Zero High-Risk False Negatives misclassified as Low-Risk**.

---

## Quickstart Guide

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the interactive Command Triage CLI
py -3.13 demo_cli.py

# 3. Re-train & calibrate the ensemble models
py -3.13 src/train_ensemble.py
```
