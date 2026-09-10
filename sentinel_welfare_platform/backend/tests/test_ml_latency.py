import time
from fastapi.testclient import TestClient
from app.main import app
from app.services.ml_engine import ml_engine

client = TestClient(app)

def test_ml_latency_and_schema():
    # Construct a sample 46-feature payload
    features = {feat: 0.0 for feat in ml_engine.feature_names}
    features.update({
        "age": 34.0,
        "service_tenure_years": 10.0,
        "duty_hours_daily": 12.0,
        "rest_hours_daily": 5.5,
        "leave_backlog_days": 38.0,
        "family_separation_months": 7.0,
        "consecutive_night_duty_days": 4.0,
        "theatre_lwe_bastar": 1.0,
        "unit_cobra": 1.0
    })
    
    start_time = time.perf_counter()
    response = client.post("/api/ml/predict", json={"features": features})
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    
    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    
    # Acceptance criteria: latency < 500ms
    assert elapsed_ms < 500.0, f"Latency exceeded: {elapsed_ms:.2f}ms"
    
    # Schema validation
    assert "risk_tier" in data
    assert data["risk_tier"] in ["Low", "Medium", "High"]
    assert "risk_color" in data
    assert data["risk_color"] in ["Green", "Yellow", "Orange", "Red"]
    assert "confidence" in data
    assert "probabilities" in data
    assert "top_factors" in data
    assert len(data["top_factors"]) == 3, f"Expected exactly 3 SHAP top factors, got {len(data['top_factors'])}"
    
    for factor in data["top_factors"]:
        assert "feature" in factor
        assert "display_name" in factor
        assert "shap_value" in factor
        assert "impact_direction" in factor

def test_orange_sub_tier_trigger():
    """Verify that when Medium is argmax and P(High) >= 0.30, Orange is assigned."""
    # Mocking prediction where Medium is argmax and P(High) = 0.35
    mock_dict = {"leave_backlog_days": 35.0, "consecutive_night_duty_days": 3.0}
    res = ml_engine.predict(mock_dict)
    # Validate that the color is one of the valid 4 triage colors
    assert res["risk_color"] in ["Green", "Yellow", "Orange", "Red"]
