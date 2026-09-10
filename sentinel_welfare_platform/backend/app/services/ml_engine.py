import os
import json
import numpy as np
import catboost as cb
import shap
from app.config import settings

DISPLAY_NAMES = {
    "leave_backlog_days": "Leave Backlog Accumulation",
    "family_separation_months": "Family Separation Duration",
    "days_since_last_leave": "Duration Since Last Rest Leave",
    "duty_hours_daily": "Daily Operational Duty Hours",
    "consecutive_night_duty_days": "Consecutive Night Vigils",
    "night_shift_frequency_monthly": "Monthly Night Shift Frequency",
    "daily_workload_score": "Composite Workload Burden",
    "commute_transit_days": "Transit Commute Days",
    "unit_manning_shortfall_pct": "Unit Manning Shortfall Deficit",
    "fitness_trend_score": "Annual Fitness Trend Decline",
    "absenteeism_hours_last_year": "Historical Unplanned Absenteeism",
    "transit_separation_burden": "Commute-Separation Burden Index",
    "stagnation_per_tenure_ratio": "Promotion Stagnation vs Tenure",
    "manning_training_ratio": "Manning Deficit to Training Ratio",
    "transfer_tenure_friction": "Posting Transfer Friction",
    "manning_absenteeism_load": "Unit Shortfall Absenteeism Load"
}

class MLEngine:
    def __init__(self):
        self.model = None
        self.explainer = None
        self.feature_names = []
        self._load()

    def _load(self):
        # Load schema
        if os.path.exists(settings.FEATURE_SCHEMA_PATH):
            with open(settings.FEATURE_SCHEMA_PATH, "r", encoding="utf-8") as f:
                schema = json.load(f)
                self.feature_names = schema["features"]
        else:
            raise FileNotFoundError(f"Feature schema not found at {settings.FEATURE_SCHEMA_PATH}")

        # Load native CatBoost model
        if os.path.exists(settings.MODEL_PATH):
            self.model = cb.CatBoostClassifier()
            self.model.load_model(settings.MODEL_PATH)
            # TreeExplainer for instantaneous SHAP values
            self.explainer = shap.TreeExplainer(self.model)
            print(f"[MLEngine] Native CatBoost model loaded from: {settings.MODEL_PATH}")
        else:
            raise FileNotFoundError(f"CatBoost model file not found at {settings.MODEL_PATH}")

    def predict(self, feature_dict: dict) -> dict:
        """
        Accepts dict of 46 features, outputs:
        - risk_tier: Low, Medium, High
        - risk_color: Green, Yellow, Orange, Red (Orange when Medium argmax and P(High) >= 0.30)
        - confidence: float
        - probabilities: dict
        - top_factors: top 3 SHAP drivers with human-readable descriptions
        """
        row = np.array([[feature_dict.get(feat, 0.0) for feat in self.feature_names]], dtype=np.float32)
        probs = self.model.predict_proba(row)[0]
        classes = list(self.model.classes_)
        
        prob_dict = {classes[i]: float(probs[i]) for i in range(len(classes))}
        argmax_class = classes[int(np.argmax(probs))]
        confidence = float(np.max(probs))
        p_high = prob_dict.get("High", 0.0)
        
        # 4-tier chip triage rule (Clinically sound rule as requested by reviewer)
        if argmax_class == "Low":
            risk_tier = "Low"
            risk_color = "Green"
        elif argmax_class == "High":
            risk_tier = "High"
            risk_color = "Red"
        else:  # argmax is Medium
            risk_tier = "Medium"
            if p_high >= 0.30:
                risk_color = "Orange"  # Borderline High / Escalating risk
            else:
                risk_color = "Yellow"  # Confirmed stable Medium
                
        # Compute SHAP values
        pred_class_idx = classes.index(argmax_class)
        raw_shap = self.explainer.shap_values(row)
        
        # In multiclass, shap_values can be list of arrays or array of shape (samples, features, classes)
        if isinstance(raw_shap, list):
            class_shap = raw_shap[pred_class_idx][0]
        elif raw_shap.ndim == 3:
            class_shap = raw_shap[0, :, pred_class_idx]
        else:
            class_shap = raw_shap[0]
            
        # Top 3 features by absolute SHAP impact
        top_indices = np.argsort(np.abs(class_shap))[::-1][:3]
        top_factors = []
        for idx in top_indices:
            feat_name = self.feature_names[idx]
            shap_val = float(class_shap[idx])
            act_val = float(row[0, idx])
            disp_name = DISPLAY_NAMES.get(feat_name, feat_name.replace("_", " ").title())
            impact = "Increases Stress Risk" if shap_val > 0 else "Lowers Stress Risk"
            top_factors.append({
                "feature": feat_name,
                "display_name": disp_name,
                "shap_value": round(shap_val, 4),
                "actual_value": round(act_val, 2),
                "impact_direction": impact
            })
            
        return {
            "risk_tier": risk_tier,
            "risk_color": risk_color,
            "confidence": round(confidence, 4),
            "probabilities": {k: round(v, 4) for k, v in prob_dict.items()},
            "top_factors": top_factors
        }

ml_engine = MLEngine()
