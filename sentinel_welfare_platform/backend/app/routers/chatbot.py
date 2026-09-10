from fastapi import APIRouter
from app.schemas import ChatMessageRequest, ChatMessageResponse
from app.services.ephemeral_chat import chat_manager

router = APIRouter(prefix="/chatbot", tags=["Ephemeral AI Welfare Companion"])

@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(req: ChatMessageRequest):
    """
    Ephemeral conversational welfare companion for soldiers (Hindi & English).
    Zero database persistence. All messages in memory with TTL.
    """
    reply = chat_manager.generate_reply(req.session_id, req.message, req.language)
    is_emergency = any(w in req.message.lower() for w in ["suicide", "end my life", "marna", "harm"])
    return ChatMessageResponse(
        session_id=req.session_id,
        reply=reply,
        language=req.language,
        is_emergency_flagged=is_emergency
    )

@router.post("/end-session")
def end_chat_session(session_id: str):
    """Explicitly purges in-memory session history."""
    chat_manager.end_session(session_id)
    return {"status": "session_purged", "session_id": session_id}
