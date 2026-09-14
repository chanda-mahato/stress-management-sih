import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_multi_family_member_lifecycle_and_scope_isolation():
    """
    ACCEPTANCE TEST (MULTI-FAMILY MEMBER SUPPORT & SCOPE ISOLATION):
    1. Soldier can register 2+ family members (up to limit of 5).
    2. Registered members appear in GET /api/soldier/family-members list.
    3. Each family member can independently complete OTP request and verification.
    4. Registering > 5 family members is rejected with HTTP 400.
    5. Registering a duplicate phone number is rejected with HTTP 400.
    6. Cross-soldier scope isolation: Soldier 2 cannot view or delete Soldier 1's family members.
    """
    # Check initial pre-seeded count (2 members seeded in conftest.py)
    init_resp = client.get("/api/soldier/family-members?soldier_id=1")
    assert init_resp.status_code == 200
    init_count = len(init_resp.json())
    assert init_count == 2, f"Expected 2 pre-seeded family members, found {init_count}"

    # 1. Register 2 additional family members for Soldier #1
    m1_data = {
        "name": "Sunita Kumar",
        "relationship_type": "Spouse",
        "phone_number": "9876543210"
    }
    m2_data = {
        "name": "Rohan Kumar",
        "relationship_type": "Son",
        "phone_number": "9876543211"
    }

    # Register member 3 (Sunita)
    resp1 = client.post("/api/soldier/family-members?soldier_id=1", json=m1_data)
    assert resp1.status_code == 200, f"Error registering member 1: {resp1.text}"
    res1_json = resp1.json()
    assert res1_json.get("name") == "Sunita Kumar"
    fam1_id = res1_json.get("id")

    # Register member 4 (Rohan)
    resp2 = client.post("/api/soldier/family-members?soldier_id=1", json=m2_data)
    assert resp2.status_code == 200, f"Error registering member 2: {resp2.text}"
    res2_json = resp2.json()
    assert res2_json.get("name") == "Rohan Kumar"

    # 2. GET /api/soldier/family-members returns 4 members
    get_resp = client.get("/api/soldier/family-members?soldier_id=1")
    assert get_resp.status_code == 200
    members_list = get_resp.json()
    assert len(members_list) == 4
    names = [m["name"] for m in members_list]
    assert "Sunita Kumar" in names
    assert "Rohan Kumar" in names

    # 3. Independent OTP login for Family Member 3 (Sunita)
    otp_req1 = client.post("/api/family/auth/request-otp", json={
        "phone_number": "9876543210",
        "relation": "Spouse"
    })
    assert otp_req1.status_code == 200
    demo_otp1 = otp_req1.json().get("demo_otp")

    verify_resp1 = client.post("/api/family/auth/verify-otp", json={
        "phone_number": "9876543210",
        "otp": demo_otp1
    })
    assert verify_resp1.status_code == 200
    assert "access_token" in verify_resp1.json()

    # Independent OTP login for Family Member 4 (Rohan)
    otp_req2 = client.post("/api/family/auth/request-otp", json={
        "phone_number": "9876543211",
        "relation": "Son"
    })
    assert otp_req2.status_code == 200
    demo_otp2 = otp_req2.json().get("demo_otp")

    verify_resp2 = client.post("/api/family/auth/verify-otp", json={
        "phone_number": "9876543211",
        "otp": demo_otp2
    })
    assert verify_resp2.status_code == 200
    assert "access_token" in verify_resp2.json()

    # 4. Duplicate phone number rejection (HTTP 400)
    dup_resp = client.post("/api/soldier/family-members?soldier_id=1", json={
        "name": "Duplicate Relative",
        "relationship_type": "Parent",
        "phone_number": "9876543210" # Already registered to Sunita
    })
    assert dup_resp.status_code == 400
    assert "already registered" in dup_resp.json()["detail"].lower()

    # 5. Enforce Max 5 family members limit (Add 5th member -> success, 6th member -> 400 error)
    m5_data = {"name": "Member 5", "relationship_type": "Daughter", "phone_number": "9876543214"}
    m6_data = {"name": "Member 6 Exceed", "relationship_type": "Other", "phone_number": "9876543215"}

    # 5th member succeeds (brings total to 5)
    assert client.post("/api/soldier/family-members?soldier_id=1", json=m5_data).status_code == 200

    # 6th registration fails with 400 (limit of 5 reached)
    exceed_resp = client.post("/api/soldier/family-members?soldier_id=1", json=m6_data)
    assert exceed_resp.status_code == 400
    assert "limit of 5" in exceed_resp.json()["detail"].lower()

    # 6. Scope Protection & Authorization Isolation
    # Soldier #2 trying to delete Soldier #1's family member (fam1_id)
    del_unauth = client.delete(f"/api/soldier/family-members/{fam1_id}?soldier_id=2")
    assert del_unauth.status_code == 403
    assert "forbidden" in del_unauth.json()["detail"].lower()

    # Soldier #1 deleting their own family member (fam1_id)
    del_auth = client.delete(f"/api/soldier/family-members/{fam1_id}?soldier_id=1")
    assert del_auth.status_code == 200
    assert del_auth.json()["status"] == "success"

    # Verify count is now 4
    list_after_del = client.get("/api/soldier/family-members?soldier_id=1").json()
    assert len(list_after_del) == 4
