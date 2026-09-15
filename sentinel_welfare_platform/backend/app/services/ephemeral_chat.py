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
        msg_lower = user_message.lower().strip()
        
        # 1. Script & Language Auto-Detection
        is_devanagari = any('\u0900' <= c <= '\u097F' for c in user_message)
        has_hinglish_keywords = any(w in msg_lower for w in [
            "namaste", "madad", "tanav", "pareshan", "neend", "ghar", 
            "thakan", "parivar", "chhutti", "kaise ho", "kya karu", "bojh", "kaam"
        ])
        
        if is_devanagari or (language == "hi" and has_hinglish_keywords):
            eff_lang = "hi"
        else:
            eff_lang = "en"
            
        # 2. Intent Matching & Empathetic Response Generation
        # A. Greetings / Small Talk
        if any(w in msg_lower for w in ["hello", "hi", "hey", "how are you", "good morning", "good evening", "namaste", "kaise ho"]):
            if eff_lang == "hi":
                reply = "नमस्ते जवान साथी! मैं ठीक हूँ, धन्यवाद। मैं आपकी सहायता और वेलफेयर के लिए यहाँ हमेशा उपलब्ध हूँ। आज आपकी ड्यूटी कैसी चल रही है?"
            else:
                reply = "Hello comrade! I am doing well, thank you. I am here to support your wellbeing anytime. How has your shift been today?"
                
        # B. Workload / Heavy Duty / Operational Pressure
        elif any(w in msg_lower for w in ["work load", "workload", "heavy work", "duty", "hours", "task", "bojh", "kaam", "heavy", "hard", "shift"]):
            if eff_lang == "hi":
                reply = "अत्यधिक कार्यभार और लंबे ड्यूटी के घंटे वाकई बहुत थका देने वाले होते हैं। अपनी सेहत का ध्यान रखें और संभव हो तो पानी पिएं व छोटे ब्रेक लें। क्या आप अपनी शिफ्ट रोटेशन के बारे में साथी जवानों से बात कर सकते हैं?"
            else:
                reply = "Managing a heavy workload and long operational hours can be extremely demanding. Remember to pace yourself and take brief hydration breaks when safety permits. Is there any way to adjust shift sharing with your unit team?"

        # C. Feeling Unwell / Bad / Sick / Low Mood
        elif any(w in msg_lower for w in ["not feeling good", "unwell", "feeling bad", "sick", "low", "sad", "depressed", "bura", "accha nahi", "kuch accha"]):
            if eff_lang == "hi":
                reply = "यह सुनकर दुख हुआ कि आप अच्छा महसूस नहीं कर रहे हैं। आपका स्वास्थ्य और मानसिक शांति सबसे पहले है। यदि आप अस्वस्थ या अत्यधिक चिंतित महसूस कर रहे हैं, तो कृपया यूनिट मेडिकल ऑफिसर (MO) से परामर्श लें या थोड़ा विश्राम करें।"
            else:
                reply = "I am sorry to hear that you are not feeling good. Your health and emotional wellbeing come first. If you are feeling physically unwell or overwhelmed, please consider speaking with the Unit Medical Officer (MO) or taking time to rest."

        # D. Seeking Guidance / Help / Next Steps
        elif any(w in msg_lower for w in ["what to do", "help", "guide", "solution", "kya karu", "madad", "kaise"]):
            if eff_lang == "hi":
                reply = "जब भी आपको समझ न आए कि क्या करें, तो सबसे पहले थोड़ा गहरा सांस लें और विश्राम करें। आप किसी साथी जवान से बात कर सकते हैं या यूनिट वेलफेयर ऑफिसर से मार्गदर्शन ले सकते हैं। आपको अकेले यह तनाव उठाने की जरूरत नहीं है।"
            else:
                reply = "Whenever you feel unsure of what to do, start by taking deep breaths and focusing on basic rest. Speak with a trusted peer or consult your Unit Welfare Officer. You do not have to carry this burden alone."

        # E. Stress / Anxiety / Fatigue
        elif any(w in msg_lower for w in ["stress", "tired", "exhausted", "fatigue", "tanav", "thakan", "pareshan", "chinta"]):
            if eff_lang == "hi":
                reply = "नमस्ते जवान साथी। आपके ड्यूटी के कठिन हालात और थकावट हम समझ सकते हैं। क्या आप आज थोड़ा आराम कर पाए? अपनी फैमिली से बात करने के लिए कॉल स्लॉट शेड्यूल किया गया है।"
            else:
                reply = "Hello comrade. Operational hardship and rigorous duty hours take a real toll. Remember that decompression is vital. Have you been able to take your designated rest hours today?"

        # F. Sleep Issues / Insomnia
        elif any(w in msg_lower for w in ["sleep", "insomnia", "night", "neend", "so nahi"]):
            if eff_lang == "hi":
                reply = "रात की ड्यूटी के बाद नींद पूरी न होना स्वाभाविक है। क्या आपने यूनिट मेडिकल ऑफिसर (MO) को नींद की समस्या बताई है? जरूरत हो तो हम सहायता टीम को सतर्क कर सकते हैं।"
            else:
                reply = "Continuous night shifts disrupt natural circadian cycles. If you are experiencing prolonged sleep deprivation, our Unit Medical Officer can offer guidance without any impact on your record."

        # G. Family / Leave / Home Station
        elif any(w in msg_lower for w in ["family", "home", "leave", "wife", "kids", "ghar", "parivar", "chhutti"]):
            if eff_lang == "hi":
                reply = "परिवार से दूर रहना सबसे कठिन मोर्चा है। आपका 'I am Okay' पिंग आपके घर तक सुरक्षित पहुँचता है। शाम के विश्राम समय में आप वीडियो कॉल से जुड़ सकते हैं।"
            else:
                reply = "Staying separated from home station is one of the toughest parts of service. Your family has received your latest safety ping. Make sure to connect during your scheduled rest window."

        # H. Dynamic Fallback (No repeated static greeting)
        else:
            if eff_lang == "hi":
                reply = "अपनी बात साझा करने के लिए धन्यवाद जवान साथी। मैं आपकी बात ध्यान से सुन रहा हूँ। कृपया मुझे विस्तार से बताएं कि आपके मन में क्या चल रहा है या आपकी ड्यूटी कैसी चल रही है।"
            else:
                reply = "Thank you for sharing that with me, comrade. I am listening carefully. Please feel free to tell me more about what is on your mind or how your shift is going."

        self.add_message(session_id, "assistant", reply, language)
        return reply

chat_manager = EphemeralChatManager(session_ttl_seconds=300)
