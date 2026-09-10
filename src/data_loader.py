"""
Data loading and preprocessing utilities for SIH PS26186 (Revision 3).
Loads raw personnel telemetry and computes leakage-safe engineered features.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DATA_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'final_training_dataset.csv')
ROOT_DATA_PATH = os.path.join(BASE_DIR, 'final_training_dataset.csv')
DATA_PATH = PROCESSED_DATA_PATH if os.path.exists(PROCESSED_DATA_PATH) else ROOT_DATA_PATH

PROCESSED_AUDIT_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'final_training_dataset_audit_trail.csv')
ROOT_AUDIT_PATH = os.path.join(BASE_DIR, 'final_training_dataset_audit_trail.csv')
AUDIT_PATH = PROCESSED_AUDIT_PATH if os.path.exists(PROCESSED_AUDIT_PATH) else ROOT_AUDIT_PATH

ENCODER_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'encoder_mappings.json')

DROP_COLUMNS = [
    'personnel_id',
    'source_dataset',
    'wsi_deterministic',
    'wsi_noise_applied',
    'wsi_score',
    'welfare_risk_level',
    'welfare_risk_level_encoded',
    'rank',
    'unit_type',
    'deployment_theatre',
    'annual_fitness_grade',
    # Path 1: Self-assessment subjective scores excluded from ML training features
    'stress_score',
    'satisfaction_score',
    'sleep_quality_score',
    'fatigue_score',
    'social_support_score',
    'emotional_wellbeing_score',
    'work_life_balance_score'
]

CLASS_NAMES = ['Low', 'Medium', 'High']

# The 7 Leakage-Safe Engineered Features (Part 2)
ENGINEERED_FEATURE_NAMES = [
    'stagnation_per_tenure_ratio',
    'transit_separation_burden',
    'manning_training_ratio',
    'transfer_tenure_friction',
    'manning_absenteeism_load',
    'training_vs_unit_median',
    'absenteeism_vs_rank_median'
]

def load_encoder_mappings():
    if os.path.exists(ENCODER_PATH):
        with open(ENCODER_PATH, 'r', encoding='utf-8') as fp:
            return json.load(fp)
    return {
        'rank': {'Constable': 0, 'Head Constable': 1, 'ASI': 2, 'Sub-Inspector': 3, 'Inspector': 4, 'Assistant Commandant': 5, 'Commandant': 6},
        'deployment_theatre': {'Peace / Training Center': 0, 'Static Security / VIP': 1, 'Border Outpost (LoC/IB)': 2, 'North-East (Counter-Insurgency)': 3, 'J&K (CI/Ops)': 4, 'LWE / Bastar (Anti-Naxal)': 5},
        'unit_type': {'General Duty (GD)': 0, 'Rapid Action Force (RAF)': 1, 'VIP Security Wing': 2, 'Signal & IT Wing': 3, 'Medical & Logistics': 4, 'CoBRA Strike Unit': 5},
        'annual_fitness_grade': {'SHAPE-1': 0, 'SHAPE-2': 1, 'SHAPE-3': 2, 'SHAPE-4': 3},
        'welfare_risk_level': {'Low': 0, 'Medium': 1, 'High': 2}
    }

def compute_engineered_features(df):
    """
    Computes 7 leakage-safe engineered features using peer-relative cohort
    medians and safe non-WSI interactions.
    Does not mutate input df.
    """
    res = df.copy()

    # Strategy (b): Interactions with new raw signals or non-WSI variables
    if 'promotion_stagnation_years' in res.columns and 'service_tenure_years' in res.columns:
        res['stagnation_per_tenure_ratio'] = np.round(res['promotion_stagnation_years'] / (res['service_tenure_years'] + 1.0), 3)
    else:
        res['stagnation_per_tenure_ratio'] = 0.0

    if 'commute_transit_days' in res.columns and 'family_separation_months' in res.columns:
        res['transit_separation_burden'] = np.round(res['commute_transit_days'] * np.log1p(res['family_separation_months']), 2)
    else:
        res['transit_separation_burden'] = 0.0

    if 'unit_manning_shortfall_pct' in res.columns and 'training_hours_last_year' in res.columns:
        res['manning_training_ratio'] = np.round(res['unit_manning_shortfall_pct'] / (res['training_hours_last_year'] + 5.0), 3)
    else:
        res['manning_training_ratio'] = 0.0

    if 'posting_transfer_count_last_2yrs' in res.columns and 'service_tenure_years' in res.columns:
        res['transfer_tenure_friction'] = np.round(res['posting_transfer_count_last_2yrs'] / (res['service_tenure_years'] + 1.0), 3)
    else:
        res['transfer_tenure_friction'] = 0.0

    if 'unit_manning_shortfall_pct' in res.columns and 'absenteeism_hours_last_year' in res.columns:
        res['manning_absenteeism_load'] = np.round(res['unit_manning_shortfall_pct'] * (res['absenteeism_hours_last_year'] / 100.0), 2)
    else:
        res['manning_absenteeism_load'] = 0.0

    # Strategy (a): Peer-relative medians
    # Reference unit medians from typical baseline
    unit_col = 'unit_type' if 'unit_type' in res.columns else ('unit_type_encoded' if 'unit_type_encoded' in res.columns else None)
    if 'training_hours_last_year' in res.columns and unit_col is not None:
        try:
            meds = res.groupby(unit_col)['training_hours_last_year'].transform('median')
            res['training_vs_unit_median'] = res['training_hours_last_year'] - meds
        except Exception:
            res['training_vs_unit_median'] = 0.0
    else:
        res['training_vs_unit_median'] = 0.0

    rank_col = 'rank' if 'rank' in res.columns else ('rank_encoded' if 'rank_encoded' in res.columns else None)
    if 'absenteeism_hours_last_year' in res.columns and rank_col is not None:
        try:
            meds = res.groupby(rank_col)['absenteeism_hours_last_year'].transform('median')
            res['absenteeism_vs_rank_median'] = res['absenteeism_hours_last_year'] - meds
        except Exception:
            res['absenteeism_vs_rank_median'] = 0.0
    else:
        res['absenteeism_vs_rank_median'] = 0.0

    return res

def get_feature_names(df=None, raw_only=False):
    if df is None:
        df = pd.read_csv(DATA_PATH, nrows=5)
    cols = [c for c in df.columns if c not in DROP_COLUMNS]
    if raw_only:
        cols = [c for c in cols if c not in ENGINEERED_FEATURE_NAMES]
    return cols

def load_dataset(csv_path=DATA_PATH, raw_only=False):
    df = pd.read_csv(csv_path)
    feature_cols = get_feature_names(df, raw_only=raw_only)
    X = df[feature_cols].copy()
    mapping = {'Low': 0, 'Medium': 1, 'High': 2}
    if 'welfare_risk_level_encoded' in df.columns:
        y = df['welfare_risk_level_encoded'].copy()
        y_str = df['welfare_risk_level'].copy() if 'welfare_risk_level' in df.columns else y.map({0: 'Low', 1: 'Medium', 2: 'High'})
    else:
        y_str = df['welfare_risk_level'].copy()
        y = df['welfare_risk_level'].map(mapping).astype(int)
    return X, y, y_str, feature_cols

def get_train_test_data(csv_path=DATA_PATH, test_size=0.20, random_state=42, return_continuous=False, raw_only=False):
    if return_continuous:
        audit_csv = AUDIT_PATH if os.path.exists(AUDIT_PATH) else csv_path
        df = pd.read_csv(audit_csv)
        feature_cols = get_feature_names(df, raw_only=raw_only)
        X = df[feature_cols].copy()
        mapping = {'Low': 0, 'Medium': 1, 'High': 2}
        if 'welfare_risk_level_encoded' in df.columns:
            y_cls = df['welfare_risk_level_encoded'].copy()
        else:
            y_cls = df['welfare_risk_level'].map(mapping).astype(int)
        y_wsi = df['wsi_score'].copy() if 'wsi_score' in df.columns else None
        y_det = df['wsi_deterministic'].copy() if 'wsi_deterministic' in df.columns else None

        splits = train_test_split(
            X, y_cls, y_wsi, y_det, test_size=test_size, random_state=random_state, stratify=y_cls
        )
        return {
            'X_train': splits[0], 'X_test': splits[1],
            'y_train_cls': splits[2], 'y_test_cls': splits[3],
            'y_train_wsi': splits[4], 'y_test_wsi': splits[5],
            'y_train_det': splits[6], 'y_test_det': splits[7],
            'feature_cols': feature_cols
        }
    else:
        X, y, y_str, feature_cols = load_dataset(csv_path, raw_only=raw_only)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=y
        )
        return X_train, X_test, y_train, y_test, feature_cols
