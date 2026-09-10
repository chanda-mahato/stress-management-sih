from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Case

client = TestClient(app)

def test_human_in_the_loop_case_lifecycle():
    """
    ACCEPTANCE TEST:
    Medical Officer can transition case: Acknowledged -> In Progress -> Resolved.
    Ensures human clinical oversight and audit timestamps.
    """
    db = SessionLocal()
    case = db.query(Case).first()
    assert case is not None, "Seed data case must exist"
    case_id = case.id
    db.close()
    
    # 1. Transition to In Progress
    resp1 = client.post(f"/api/cases/{case_id}/transition", json={
        "status": "In Progress",
        "clinical_notes": "Conducted tele-counseling session. Recommend 48-hr rest rotation.",
        "action_plan": "Mandatory 48-hr Rest Rotation",
        "assigned_mo_id": "MO-DR-SHARMA-409"
    })
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["status"] == "In Progress"
    assert "tele-counseling" in data1["clinical_notes"]
    assert data1["acknowledged_at"] is not None
    
    # 2. Transition to Resolved
    resp2 = client.post(f"/api/cases/{case_id}/transition", json={
        "status": "Resolved",
        "clinical_notes": "Soldier completed rest rotation and reunited with family on approved leave. Vitals normal.",
        "action_plan": "Case Closed - Decompression Complete",
        "assigned_mo_id": "MO-DR-SHARMA-409"
    })
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["status"] == "Resolved"
    assert data2["resolved_at"] is not None
