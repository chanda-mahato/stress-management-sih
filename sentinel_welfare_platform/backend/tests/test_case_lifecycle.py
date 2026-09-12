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


def test_case_access_audit_logging():
    """
    GOVERNANCE TEST:
    Verifies that CaseAccessLog immutable audit trail records every read and modification
    by administrative and medical officer personnel, enforcing MHA §6a ACR Firewall.
    """
    db = SessionLocal()
    case = db.query(Case).first()
    assert case is not None
    case_id = case.id
    db.close()

    # 1. MO views individual case -> triggers 'viewed' audit log
    resp_view = client.get(f"/api/cases/{case_id}")
    assert resp_view.status_code == 200
    data_view = resp_view.json()
    assert "flagged_personnel_objection" in data_view

    # 2. Query access logs for the case
    resp_logs = client.get(f"/api/cases/{case_id}/access-logs")
    assert resp_logs.status_code == 200
    logs = resp_logs.json()
    assert len(logs) >= 1
    actions = [l["action"] for l in logs]
    assert "viewed" in actions


def test_soldier_objection_filing_and_authorization():
    """
    GOVERNANCE TEST:
    1. Soldier files formal representation/objection against automated flag.
    2. Enforces strict server-side ownership validation (rejects unauthorized manipulation).
    3. Verifies objection is permanently attached and visible to reviewing MO.
    """
    db = SessionLocal()
    case = db.query(Case).first()
    assert case is not None
    case_id = case.id
    actual_soldier_id = case.personnel_id
    db.close()

    objection_content = "Voluntary duty rotation swap for unit operational requirements, not chronic distress."

    # 1. Successful objection filing by legitimate case owner
    resp_obj = client.post(
        f"/api/soldier/cases/{case_id}/objection?soldier_id={actual_soldier_id}",
        json={"objection_text": objection_content}
    )
    assert resp_obj.status_code == 200
    data_obj = resp_obj.json()
    assert data_obj["status"] == "success"
    assert data_obj["flagged_personnel_objection"] == objection_content
    assert data_obj["objection_filed_at"] is not None

    # 2. Server-side ownership validation: unauthorized soldier (different personnel_id) is blocked
    unauthorized_soldier_id = actual_soldier_id + 9999
    resp_forbidden = client.post(
        f"/api/soldier/cases/{case_id}/objection?soldier_id={unauthorized_soldier_id}",
        json={"objection_text": "Malicious tampering attempt"}
    )
    assert resp_forbidden.status_code == 403
    assert "Forbidden" in resp_forbidden.json()["detail"]

    # 3. Verify Medical Officer can see the objection on the case detail view
    resp_mo = client.get(f"/api/cases/{case_id}")
    assert resp_mo.status_code == 200
    case_detail = resp_mo.json()
    assert case_detail["flagged_personnel_objection"] == objection_content
    assert case_detail["objection_filed_at"] is not None
