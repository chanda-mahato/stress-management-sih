from typing import List, Optional
from fastapi import APIRouter, HTTPException
from app.schemas import ChatMessageRequest, ChatMessageResponse, CrisisAlertResponse
from app.services.ephemeral_chat import chat_manager

router = APIRouter(prefix="/chatbot", tags=["Ephemeral AI Welfare Companion"])

@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(req: ChatMessageRequest):
    """
    Ephemeral conversational welfare companion for soldiers (7 regional languages + Hinglish).
    Integrates real-time NLP crisis intent detection.
    Zero database persistence for message content.
    """
    reply, nlp_res = chat_manager.generate_reply(
        session_id=req.session_id,
        user_message=req.message,
        language=req.language or "en",
        personnel_id=req.personnel_id,
        soldier_name=req.soldier_name
    )

    helpline_info = None
    if nlp_res["is_crisis"]:
        helpline_info = {
            "tele_manas_tollfree": "14416",
            "tele_manas_alt": "1800-891-4416",
            "crpf_sambhav_helpline": "1800-117-755",
            "message": "24x7 Confidential Government & Armed Forces Crisis Helpline Support"
        }

    return ChatMessageResponse(
        session_id=req.session_id,
        reply=reply,
        language=req.language or "en",
        is_emergency_flagged=nlp_res["is_crisis"],
        crisis_level=nlp_res["risk_level"],
        trigger_phrase=nlp_res["trigger_phrase"],
        helpline_info=helpline_info
    )

@router.get("/crisis-alerts", response_model=List[CrisisAlertResponse])
def get_crisis_alerts():
    """
    Fetches active ephemeral chatbot NLP crisis alerts for the Medical Officer (MO) Console.
    """
    alerts = chat_manager.get_active_crisis_alerts()
    return alerts

@router.post("/crisis-alerts/{alert_id}/acknowledge")
def acknowledge_crisis_alert(alert_id: str):
    """
    Allows a Medical Officer to acknowledge/clear a chatbot crisis alert.
    """
    success = chat_manager.acknowledge_crisis_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Crisis alert not found")
    return {"status": "acknowledged", "alert_id": alert_id}

@router.post("/end-session")
def end_chat_session(session_id: str):
    """Explicitly purges in-memory session history."""
    chat_manager.end_session(session_id)
    return {"status": "session_purged", "session_id": session_id}
