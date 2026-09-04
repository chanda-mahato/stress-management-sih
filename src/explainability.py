"""
Defense-Grade Explainability (XAI) Module for SIH PS26186.
Uses SHAP (SHapley Additive exPlanations) TreeExplainer to generate global
risk attribution plots and local root-cause diagnostic dossiers for Unit Commanders.
"""

import os
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import shap

import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.data_loader import get_train_test_data, CLASS_NAMES
MODELS_DIR = os.path.join(BASE_DIR, 'models')
EXP_DIR = os.path.join(BASE_DIR, 'experiments')

# Friendly human-readable feature labels for defense commanders
FEATURE_LABELS = {
    'leave_backlog_days': 'Accrued Leave Backlog (Days)',
    'consecutive_night_duty_days': 'Consecutive Night Duty Vigils',
    'duty_hours_daily': 'Daily Duty Hours (Shift Length)',
    'rest_hours_daily': 'Daily Uninterrupted Rest (Hours)',
    'family_separation_months': 'Family Separation (Months)',
    'days_since_last_leave': 'Days Since Last Approved Leave',
    'overtime_hours_monthly': 'Monthly Overtime Load (Hours)',
    'night_shift_frequency_monthly': 'Night Shifts per Month',
    'stress_score': 'Self-Reported Stress Score (1-10)',
    'sleep_quality_score': 'Sleep Quality Index (1-10)',
    'fatigue_score': 'Physical Fatigue Index (1-10)',
    'social_support_score': 'Unit Social & Peer Support (1-5)',
    'emotional_wellbeing_score': 'Emotional Resilience Score (1-5)',
    'satisfaction_score': 'Job & Role Satisfaction (1-4)',
    'work_life_balance_score': 'Work-Life Balance Score (1-4)',
    'body_mass_index': 'Body Mass Index (BMI)',
    'annual_fitness_grade_encoded': 'SHAPE Medical Classification',
    'fitness_trend_score': 'Longitudinal Fitness Trend (-2 to +2)',
    'conduct_flag': 'Disciplinary / Conduct Flag',
    'daily_workload_score': 'Daily Workload Intensity (Hours)',
    'deployment_theatre_encoded': 'Operational Deployment Theatre',
    'deployment_duration_days': 'Current Deployment Tenure (Days)',
    'posting_transfer_count_last_2yrs': 'Frequent Transfer Friction (Count)',
    'absenteeism_hours_last_year': 'Annual Absenteeism (Hours)',
    'leave_days_last_90d': 'Leave Availed in Last 90 Days',
    'distance_from_home_station_km': 'Commute Distance from Home (km)',
    'service_tenure_years': 'Total Force Service Tenure (Years)',
    'age': 'Personnel Age',
    'num_dependents': 'Number of Family Dependents',
    'rank_encoded': 'Force Rank',
    'unit_type_encoded': 'Operational Unit Wing',
    'training_hours_last_year': 'Refresher Training Hours',
    'overtime_flag': 'Excessive Overtime Flag',
    # Genuinely New Raw Signals (Part 2b)
    'unit_manning_shortfall_pct': 'Unit Understaffing Vacancy Rate (%)',
    'promotion_stagnation_years': 'Rank Stagnation / Time in Grade (Years)',
    'commute_transit_days': 'Commute Transit Days to Hometown',
    # Leakage-Safe Engineered Features (Part 2)
    'stagnation_per_tenure_ratio': 'Career Stagnation per Service Tenure Ratio',
    'transit_separation_burden': 'Transit Friction × Family Separation Burden',
    'manning_training_ratio': 'Manning Deficit to Training Availability Ratio',
    'transfer_tenure_friction': 'Frequent Unit Transfer per Tenure Ratio',
    'manning_absenteeism_load': 'Unit Manning Deficit × Absenteeism Load',
    'training_vs_unit_median': 'Training Hours vs Unit Cohort Median',
    'absenteeism_vs_rank_median': 'Absenteeism Hours vs Rank Cohort Median'
}

class StressExplainer:
    def __init__(self, model_path=None):
        if model_path is None:
            model_path = os.path.join(MODELS_DIR, 'catboost_model.joblib')
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}. Run train_ensemble.py first.")
        self.model = joblib.load(model_path)
        self.explainer = shap.TreeExplainer(self.model)

    def generate_global_plots(self, X_sample, max_display=15):
        """Generates and saves global SHAP summary bar chart."""
        print('\n--- Computing Global SHAP Values ---')
        shap_values = self.explainer.shap_values(X_sample)
        
        # In multi-class CatBoost, shap_values has shape (N, features, classes) or list of [N, features]
        if isinstance(shap_values, list):
            hi_shap = shap_values[2] # Class 2 = High Risk
        elif len(shap_values.shape) == 3:
            hi_shap = shap_values[:, :, 2]
        else:
            hi_shap = shap_values

        plt.figure(figsize=(10, 8))
        shap.summary_plot(hi_shap, X_sample, plot_type='bar', max_display=max_display, show=False)
        plt.title('Top Predictors of High Welfare Risk (SHAP Feature Importance)', fontsize=13, pad=14)
        plt.xlabel('Mean Absolute SHAP Value (Impact on High-Risk Probability)', fontsize=11)
        plt.tight_layout()

        plot_path = os.path.join(EXP_DIR, 'shap_summary_plot.png')
        plt.savefig(plot_path, dpi=200, bbox_inches='tight')
        plt.close()
        print(f'Global SHAP summary plot saved to: {plot_path}')
        return plot_path

    def explain_personnel(self, X_row, top_k=3):
        """
        Explains risk drivers for a single personnel row.
        Returns top risk-increasing factors and protective factors.
        """
        if isinstance(X_row, dict):
            X_row = pd.DataFrame([X_row])
        elif isinstance(X_row, pd.Series):
            X_row = pd.DataFrame([X_row])

        shap_vals = self.explainer.shap_values(X_row)
        if isinstance(shap_vals, list):
            hi_shap = shap_vals[2][0]
        elif len(shap_vals.shape) == 3:
            hi_shap = shap_vals[0, :, 2]
        else:
            hi_shap = shap_vals[0]

        feature_names = X_row.columns.tolist()
        df_exp = pd.DataFrame({
            'feature': feature_names,
            'label': [FEATURE_LABELS.get(f, f) for f in feature_names],
            'value': X_row.iloc[0].values,
            'shap_val': hi_shap
        })

        # Sort by impact on high-risk
        risk_drivers = df_exp[df_exp['shap_val'] > 0].sort_values('shap_val', ascending=False).head(top_k)
        protective_factors = df_exp[df_exp['shap_val'] < 0].sort_values('shap_val', ascending=True).head(2)

        return {
            'risk_drivers': risk_drivers.to_dict('records'),
            'protective_factors': protective_factors.to_dict('records')
        }

def run_global_explainability():
    X_train, X_test, y_train, y_test, feature_cols = get_train_test_data(raw_only=True)
    explainer = StressExplainer()
    # Sample 300 test records for fast, accurate global plots
    X_sample = X_test.sample(n=min(300, len(X_test)), random_state=42)
    explainer.generate_global_plots(X_sample)

if __name__ == '__main__':
    run_global_explainability()

