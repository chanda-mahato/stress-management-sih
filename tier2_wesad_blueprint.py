"""
SIH 2026 Problem Statement SIH26186:
AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces
Ministry of Home Affairs - CRPF / Police II Division

TIER-2 MODULE: PHYSIOLOGICAL WEARABLE SENSOR PROCESSING (WESAD BLUEPRINT)
-------------------------------------------------------------------------
This module is strictly isolated from Tier-1 (Administrative/HRMS records).
It serves as an optional/future-scope subsystem for voluntary wearable pilot studies
(e.g., smartbands measuring EDA, BVP, HRV, and Skin Temperature during high-risk patrols).

Reference:
- WESAD Dataset: https://ubicomp.eti.uni-siegen.de/home/datasets/icmi18/
- UCI WESAD Archive: https://archive.ics.uci.edu/dataset/515/wesad+wearable+stress+and+affect+detection
"""

import os
import numpy as np
import pandas as pd

def simulate_wesad_wearable_window(n_samples=500):
    """
    Simulates windowed physiological features extracted from Empatica E4 wristband
    and RespiBAN chest sensors following the WESAD signal processing protocol.
    
    Features:
    - eda_mean, eda_std, eda_scl (Skin Conductance Level)
    - hrv_rmssd, hrv_sdnn, hrv_lf_hf_ratio (Heart Rate Variability)
    - bvp_peak_count (Heart rate bpm proxy)
    - temp_slope, temp_mean (Skin temperature)
    - acc_magnitude_mean (Physical movement to control for exertion)
    """
    np.random.seed(42)
    
    # 0 = Baseline (Relaxed), 1 = Stress, 2 = Amusement / Physical Exertion
    labels = np.random.choice([0, 1, 2], size=n_samples, p=[0.45, 0.35, 0.20])
    
    data = []
    for lbl in labels:
        if lbl == 1: # Acute Stress State
            eda_mean = np.random.normal(4.5, 1.2)
            eda_std = np.random.normal(0.8, 0.2)
            hrv_rmssd = np.random.normal(28.0, 6.0) # Suppressed HRV under stress
            hrv_lf_hf = np.random.normal(2.8, 0.6) # Elevated sympathetic tone
            temp_slope = np.random.normal(-0.02, 0.005) # Peripheral vasoconstriction
            acc_mag = np.random.normal(1.05, 0.1) # Low/moderate motion (cognitive/emotional stress)
        elif lbl == 2: # Physical Exertion (Patrol / Drill)
            eda_mean = np.random.normal(6.0, 1.5) # Elevated due to sweating
            eda_std = np.random.normal(1.2, 0.3)
            hrv_rmssd = np.random.normal(32.0, 8.0)
            hrv_lf_hf = np.random.normal(2.2, 0.5)
            temp_slope = np.random.normal(0.03, 0.01) # Warming up
            acc_mag = np.random.normal(2.5, 0.6) # High motion
        else: # Baseline / Rest
            eda_mean = np.random.normal(1.8, 0.5)
            eda_std = np.random.normal(0.2, 0.08)
            hrv_rmssd = np.random.normal(55.0, 10.0) # Healthy parasympathetic tone
            hrv_lf_hf = np.random.normal(1.1, 0.3)
            temp_slope = np.random.normal(0.00, 0.002)
            acc_mag = np.random.normal(1.0, 0.05)
            
        data.append({
            "eda_mean_microsiemens": max(0.1, round(eda_mean, 3)),
            "eda_std": max(0.01, round(eda_std, 3)),
            "hrv_rmssd_ms": max(5.0, round(hrv_rmssd, 1)),
            "hrv_lf_hf_ratio": max(0.2, round(hrv_lf_hf, 2)),
            "skin_temp_slope": round(temp_slope, 4),
            "acc_magnitude_g": max(0.5, round(acc_mag, 2)),
            "physiological_state": "Stress" if lbl == 1 else ("Physical_Exertion" if lbl == 2 else "Baseline")
        })
        
    df = pd.DataFrame(data)
    return df

if __name__ == "__main__":
    print("Generating simulated WESAD feature window benchmark...")
    df_wesad = simulate_wesad_wearable_window(1000)
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "processed", "tier2_wesad_simulated_features.csv")
    df_wesad.to_csv(out_path, index=False)
    print(f"Tier-2 WESAD feature module saved to: {out_path}")
    print(df_wesad.head())
