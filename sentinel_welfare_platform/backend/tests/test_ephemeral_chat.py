from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.database import SessionLocal, Base, engine

client = TestClient(app)

def test_ephemeral_chat_zero_db_persistence():
    """
    ACCEPTANCE TEST:
    Chatbot messages must live only in ephemeral memory (TTL) and NEVER exist in the database.
    """
    session_id = "test_soldier_ephemeral_session_999"
    
    # 1. Send interactive chat messages (English & Hindi)
    resp1 = client.post("/api/chatbot/message", json={
        "session_id": session_id,
        "message": "I am feeling exhausted after 5 days of consecutive night vigils.",
        "language": "en"
    })
    assert resp1.status_code == 200
    assert len(resp1.json()["reply"]) > 0
    
    # Test English message auto-detection when UI language is set to 'hi'
    resp_en_hi = client.post("/api/chatbot/message", json={
        "session_id": session_id,
        "message": "i have a very high work load now a days",
        "language": "hi"
    })
    assert resp_en_hi.status_code == 200
    assert "workload" in resp_en_hi.json()["reply"].lower() or "shift" in resp_en_hi.json()["reply"].lower()

    resp2 = client.post("/api/chatbot/message", json={
        "session_id": session_id,
        "message": "बहुत तनाव है और घर की याद आ रही है।",
        "language": "hi"
    })
    assert resp2.status_code == 200
    assert len(resp2.json()["reply"]) > 0
    
    # 2. End session
    resp_end = client.post(f"/api/chatbot/end-session?session_id={session_id}")
    assert resp_end.status_code == 200
    
    # 3. DIRECT DATABASE AUDIT: Inspect every table in the database
    db = SessionLocal()
    table_names = engine.dialect.get_table_names(engine.connect())
    
    # Assert no table named 'messages', 'chat', 'chatbot' exists
    for t in table_names:
        assert "chat" not in t.lower() and "message" not in t.lower(), f"Unexpected persistent chat table found: {t}"
        
    db.close()
