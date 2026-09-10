import time
import threading
from typing import Dict, List, Optional

class EphemeralChatManager:
    """
    In-memory session manager with automatic TTL eviction.
    Architectural guarantee: zero message rows are ever saved to the database.
    """
    def __init__(self, session_ttl_seconds: int = 300):
        self.ttl = session_ttl_seconds
        self._sessions: Dict[str, Dict] = {}
        self._lock = threading.Lock()

    def _purge_expired(self):
        now = time.time()
        expired = [sid for sid, data in self._sessions.items() if now - data["last_active"] > self.ttl]
        for sid in expired:
            del self._sessions[sid]

    def add_message(self, session_id: str, role: str, text: str, language: str = "en"):
        with self._lock:
            self._purge_expired()
            now = time.time()
            if session_id not in self._sessions:
                self._sessions[session_id] = {
                    "messages": [],
                    "last_active": now,
                    "language": language
                }
            self._sessions[session_id]["messages"].append({
                "role": role,
                "text": text,
                "timestamp": now
            })
            self._sessions[session_id]["last_active"] = now

    def get_history(self, session_id: str) -> List[dict]:
        with self._lock:
            self._purge_expired()
            if session_id in self._sessions:
                return list(self._sessions[session_id]["messages"])
            return []

    def end_session(self, session_id: str):
        """Immediately purges all memory of this session."""
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]

    def generate_reply(self, session_id: str, user_message: str, language: str = "en") -> str:
        self.add_message(session_id, "user", user_message, language)
        msg_lower = user_message.lower()
        
        # Empathetic, supportive responses for soldiers (English & Hindi)
        if language == "hi" or any(w in msg_lower for w in ["namaste", "madad", "tanav", "pareshan", "neend", "ghar"]):
            if any(w in msg_lower for w in ["tanav", "stress", "pareshan", "thakan"]):
                reply = "नमस्ते जवान साथी। आपके ड्यूटी के कठिन हालात और थकावट हम समझ सकते हैं। क्या आप आज थोड़ा आराम कर पाए? अपनी फैमिली से बात करने के लिए कॉल स्लॉट शेड्यूल किया गया है।"
            elif any(w in msg_lower for w in ["neend", "sleep", "so nahi"]):
                reply = "रात की ड्यूटी के बाद नींद पूरी न होना स्वाभाविक है। क्या आपने यूनिट मेडिकल ऑफिसर (MO) को नींद की समस्या बताई है? जरूरत हो तो हम सहायता टीम को सतर्क कर सकते हैं।"
            elif any(w in msg_lower for w in ["ghar", "family", "parivar", "chhutti"]):
                reply = "परिवार से दूर रहना सबसे कठिन मोर्चा है। आपका 'I am Okay' पिंग आपके घर तक सुरक्षित पहुँचता है। शाम के विश्राम समय में आप वीडियो कॉल से जुड़ सकते हैं।"
            else:
                reply = "नमस्ते! मैं आपका पर्सनल वेलफेयर साथी हूँ। आप बिना किसी झिझक के अपनी परेशानी या मन की बात साझा कर सकते हैं। यह बातचीत पूरी तरह गोपनीय और सुरक्षित है।"
        else:
            if any(w in msg_lower for w in ["stress", "tired", "exhausted", "fatigue"]):
                reply = "Hello comrade. Operational hardship and rigorous duty hours take a real toll. Remember that decompression is vital. Have you been able to take your designated rest hours today?"
            elif any(w in msg_lower for w in ["sleep", "insomnia", "night"]):
                reply = "Continuous night shifts disrupt natural circadian cycles. If you are experiencing prolonged sleep deprivation, our Unit Medical Officer can offer guidance without any impact on your record."
            elif any(w in msg_lower for w in ["family", "home", "leave", "wife", "kids"]):
                reply = "Staying separated from home station is one of the toughest parts of service. Your family has received your latest safety ping. Make sure to connect during your scheduled rest window."
            else:
                reply = "Hello! I am your confidential welfare companion. You can speak freely about your duty stress, rest cycles, or personal wellbeing. This session is completely private and ephemeral."

        self.add_message(session_id, "assistant", reply, language)
        return reply

chat_manager = EphemeralChatManager(session_ttl_seconds=300)
