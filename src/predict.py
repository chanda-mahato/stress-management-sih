"""
Inference & Command Triage Pipeline for SIH PS26186.
Loads the trained Tri-Model Ensemble (both Classifier and Regressor):
  - Classifiers operate on 36 RAW features for sharp boundary classification.
  - Regressors operate on 43 FULL features (36 raw + 7 engineered) for continuous stress scoring.
Accepts personnel telemetry in raw/human-readable format, automatically
synthesizes domain interaction features for regression, predicts continuous
Welfare Stress Index (WSI) and calibrated risk tiers, and outputs actionable SOP directives.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.data_loader import load_encoder_mappings, compute_engineered_features, get_feature_names, CLASS_NAMES
from src.explainability import StressExplainer

MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Standard Operating Procedures for Unit Commanders
SOP_GUIDELINES = {
    'High': {
        'action_code': 'SOP-RED-01',
        'title': 'IMMEDIATE OPERATIONAL RELIEF & PSYCHOLOGICAL TRIAGE',
        'urgency': 'URGENT (Action within 24 Hours)',
        'directives': [
            'Immediate relief from active combat patrol / high-stress static posts.',
            'Mandatory 5-day continuous decompression rest cycle.',
            'Confidential tele-counseling interview with Unit Medical Officer / Welfare Officer.',
            'Immediate sanction of accrued leave backlog with guaranteed family travel clearance.',
            'Peer buddy pairing with an experienced, low-stress squad mate.'
        ]
    },
    'Medium': {
        'action_code': 'SOP-AMBER-02',
        'title': 'SUPERVISORY ADJUSTMENT & LEAVE SCHEDULING',
        'urgency': 'PRIORITY (Action within 7 Days)',
        'directives': [
            'Company Commander 1-on-1 informal welfare check-in.',
            'Rotation off continuous night duty shifts (ensure minimum 8h uninterrupted rest).',
            'Schedule leave backlog clearance in the upcoming monthly roster.',
            'Encourage participation in daily recreational / Mandir parade welfare programs.'
        ]
    },
    'Low': {
        'action_code': 'SOP-GREEN-03',
        'title': 'ROUTINE MONITORING & SUSTAINED WELFARE CYCLE',
        'urgency': 'STANDARD (Routine Schedule)',
        'directives': [
            'Maintain standard duty-to-rest shift rotations.',
            'Standard annual physical training and SHAPE medical monitoring.',
            'Regular weekly company welfare roll-call (Sainik Sammelan).'
        ]
    }
}

class WelfarePredictor:
    def __init__(self):
        metadata_path = os.path.join(MODELS_DIR, 'ensemble_metadata.json')
        xgb_path = os.path.join(MODELS_DIR, 'xgboost_model.joblib')
        lgb_path = os.path.join(MODELS_DIR, 'lightgbm_model.joblib')
        cb_path = os.path.join(MODELS_DIR, 'catboost_model.joblib')
        reg_path = os.path.join(MODELS_DIR, 'tri_model_regressor.joblib')

        if not (os.path.exists(xgb_path) and os.path.exists(lgb_path) and os.path.exists(cb_path)):
            raise FileNotFoundError("Trained models not found. Run train_ensemble.py first.")

        self.xgb_model = joblib.load(xgb_path)
        self.lgb_model = joblib.load(lgb_path)
        self.cb_model = joblib.load(cb_path)

        xgb_reg_path = os.path.join(MODELS_DIR, 'xgboost_regressor.joblib')
        lgb_reg_path = os.path.join(MODELS_DIR, 'lightgbm_regressor.joblib')
        cb_reg_path = os.path.join(MODELS_DIR, 'catboost_regressor.joblib')

        if os.path.exists(metadata_path):
            with open(metadata_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {}

        self.regressor_features = self.metadata.get('feature_names')
        self.classifier_features = self.metadata.get('raw_feature_names')
        if self.classifier_features is None:
            self.classifier_features = get_feature_names(raw_only=True)
        if self.regressor_features is None:
            self.regressor_features = get_feature_names(raw_only=False)

        self.feature_names = self.regressor_features
        self.cls_weights = self.metadata.get('classification_weights', [0.10, 0.25, 0.65])
        self.reg_weights = self.metadata.get('regression_weights', [0.10, 0.10, 0.80])

        if os.path.exists(xgb_reg_path) and os.path.exists(lgb_reg_path) and os.path.exists(cb_reg_path):
            self.xgb_reg = joblib.load(xgb_reg_path)
            self.lgb_reg = joblib.load(lgb_reg_path)
            self.cb_reg = joblib.load(cb_reg_path)
        else:
            self.xgb_reg = None
            self.lgb_reg = None
            self.cb_reg = None

        self.encoders = load_encoder_mappings()
        self.explainer = StressExplainer(cb_path)

    def predict_proba(self, X_cls):
        if isinstance(X_cls, pd.DataFrame):
            X_in = X_cls[self.classifier_features]
        else:
            X_in = X_cls
        p_xgb = self.xgb_model.predict_proba(X_in)
        p_lgb = self.lgb_model.predict_proba(X_in)
        p_cb = self.cb_model.predict_proba(X_in)
        w = self.cls_weights
        return (w[0] * p_xgb) + (w[1] * p_lgb) + (w[2] * p_cb)

    def predict_wsi(self, X_reg):
        if self.xgb_reg is not None:
            if isinstance(X_reg, pd.DataFrame):
                if any(c not in X_reg.columns for c in self.regressor_features):
                    X_reg = compute_engineered_features(X_reg)
                    for c in self.regressor_features:
                        if c not in X_reg.columns:
                            X_reg[c] = 0.0
                X_in = X_reg[self.regressor_features]
            else:
                X_in = X_reg
            p_xgb = self.xgb_reg.predict(X_in)
            p_lgb = self.lgb_reg.predict(X_in)
            p_cb = self.cb_reg.predict(X_in)
            w = self.reg_weights
            return (w[0] * p_xgb) + (w[1] * p_lgb) + (w[2] * p_cb)
        return None

    def preprocess_input(self, raw_input):
        """
        Converts raw dictionary or DataFrame into aligned features.
        Returns:
            X_cls: 36 raw features for classifier and SHAP
            X_reg: 43 features (36 raw + 7 engineered) for regressor
        """
        if isinstance(raw_input, dict):
            df = pd.DataFrame([raw_input])
        else:
            df = raw_input.copy()

        # Encode strings if raw strings were provided
        if 'rank' in df.columns and 'rank_encoded' not in df.columns:
            df['rank_encoded'] = df['rank'].map(self.encoders['rank']).fillna(0).astype(int)
        if 'unit_type' in df.columns and 'unit_type_encoded' not in df.columns:
            df['unit_type_encoded'] = df['unit_type'].map(self.encoders['unit_type']).fillna(0).astype(int)
        if 'deployment_theatre' in df.columns and 'deployment_theatre_encoded' not in df.columns:
            df['deployment_theatre_encoded'] = df['deployment_theatre'].map(self.encoders['deployment_theatre']).fillna(0).astype(int)
        if 'annual_fitness_grade' in df.columns and 'annual_fitness_grade_encoded' not in df.columns:
            df['annual_fitness_grade_encoded'] = df['annual_fitness_grade'].map(self.encoders['annual_fitness_grade']).fillna(0).astype(int)

        # Synthesize domain interaction features for regressor
        df_full = compute_engineered_features(df)

        # Ensure all required features exist
        for col in self.classifier_features:
            if col not in df_full.columns:
                df_full[col] = 0.0
        for col in self.regressor_features:
            if col not in df_full.columns:
                df_full[col] = 0.0

        X_cls = df_full[self.classifier_features].copy()
        X_reg = df_full[self.regressor_features].copy()
        return X_cls, X_reg

    def predict(self, raw_input, explain=True):
        """
        Runs prediction for a single personnel profile or batch.
        Returns predicted WSI score, risk tier, probability distribution, and SHAP drivers.
        """
        X_cls, X_reg = self.preprocess_input(raw_input)
        probs = self.predict_proba(X_cls)
        pred_classes = np.argmax(probs, axis=1)
        wsi_scores = self.predict_wsi(X_reg)

        results = []
        for i in range(len(X_cls)):
            tier = CLASS_NAMES[pred_classes[i]]
            conf = float(probs[i][pred_classes[i]] * 100.0)
            prob_dict = {CLASS_NAMES[j]: round(float(probs[i][j]) * 100.0, 2) for j in range(3)}
            wsi_val = round(float(wsi_scores[i]), 2) if wsi_scores is not None else None

            res = {
                'predicted_wsi_score': wsi_val,
                'welfare_risk_tier': tier,
                'confidence_pct': round(conf, 2),
                'probability_distribution': prob_dict,
                'sop_guidance': SOP_GUIDELINES[tier]
            }

            if explain:
                explanation = self.explainer.explain_personnel(X_cls.iloc[[i]])
                res['top_risk_drivers'] = explanation['risk_drivers']
                res['protective_factors'] = explanation['protective_factors']

            results.append(res)

        return results[0] if isinstance(raw_input, dict) or len(results) == 1 else results

_PREDICTOR_INSTANCE = None

def get_predictor():
    global _PREDICTOR_INSTANCE
    if _PREDICTOR_INSTANCE is None:
        _PREDICTOR_INSTANCE = WelfarePredictor()
    return _PREDICTOR_INSTANCE

def predict_personnel_welfare(personnel_dict, explain=True):
    predictor = get_predictor()
    return predictor.predict(personnel_dict, explain=explain)
