from fastapi.testclient import TestClient
from app.main import app
from app.auth import create_access_token

client = TestClient(app)

def test_family_token_opsec_isolation():
    """
    CRITICAL OPSEC ACCEPTANCE TEST:
    A Family-scoped token must be structurally blocked (HTTP 403) from accessing
    any personnel rosters, case details, operational duty stats, or ML prediction endpoints.
    """
    # Create a Family-scoped JWT
    family_token = create_access_token({
        "sub": "family_1",
        "role": "family",
        "personnel_id": 1,
        "name": "Spouse of Ct. Rajesh Kumar"
    })
    headers = {"Authorization": f"Bearer {family_token}"}
    
    # 1. Protected Endpoints that MUST return HTTP 403
    forbidden_endpoints = [
        ("GET", "/api/personnel"),
        ("GET", "/api/personnel/1"),
        ("GET", "/api/cases"),
        ("POST", "/api/cases/1/transition"),
        ("POST", "/api/ml/predict"),
    ]
    
    for method, path in forbidden_endpoints:
        if method == "GET":
            resp = client.get(path, headers=headers)
        else:
            resp = client.post(path, json={}, headers=headers)
        assert resp.status_code == 403, f"OPSEC VIOLATION: Family token was able to access {path} with status {resp.status_code}!"

    # 2. Whitelisted Family Endpoints that MUST succeed (HTTP 200)
    whitelisted_endpoints = [
        "/api/family/checkins",
        "/api/family/call-slots"
    ]
    for path in whitelisted_endpoints:
        resp = client.get(path, headers=headers)
        assert resp.status_code == 200, f"Whitelisted family endpoint failed: {path} returned {resp.status_code}"
