import re
from typing import Dict, Any, List, Optional

class CrisisNLPEngine:
    """
    Multilingual Natural Language Processing (NLP) Crisis Detection Engine.
    Analyzes text in English, Hindi (Devanagari & Hinglish), Punjabi, Bengali, Marathi, Tamil, Telugu.
    Detects expressions of suicide, self-harm, quitting life/job under despair, and severe crisis intent.
    """

    CRISIS_PATTERNS = [
        # --- 1. CRITICAL: Suicide & Self-Harm Intent ---
        {
            "category": "SUICIDE_SELF_HARM",
            "risk_level": "CRITICAL",
            "keywords": [
                # English
                "suicide", "end my life", "end life", "kill myself", "want to die", "die",
                "quit my life", "quit life", "no reason to live", "no point living",
                "cut myself", "hang myself", "take my life", "better off dead", "death",
                # Hinglish / Transliterated
                "mar jana", "marna", "marna chahta", "marna chahti", "apni jaan", "jaan de dunga",
                "jaan de dungi", "zindagi khatam", "zindagi chhod", "sab khatam", "jeena nahi",
                "jeena nahi chahta", "mar jau", "mar jaunga", "kuch bacha nahi", "zehar",
                # Devanagari Hindi / Marathi
                "आत्महत्या", "जान दे दूंगा", "मर जाना", "जिंदगी खत्म", "जीना नहीं चाहता",
                "जीना नहीं चाहती", "मर जाऊं", "खुदकुशी", "आपली जीवनयात्रा", "जीव देणे",
                # Punjabi
                "ਮਰਨਾ", "ਖੁਦਕੁਸ਼ੀ", "ਜਾਨ ਦੇ ਦੇਣੀ", "ਜੀਣਾ ਨਹੀਂ",
                # Bengali
                "আত্মহত্যা", "মরে যেতে চাই", "জীবন শেষ", "বাঁচতে চাই না",
                # Tamil & Telugu
                "தற்கொலை", "உயிரை மாய்க்க", "சாக வேண்டும்",
                "ఆత్మహత్య", "చనిపోవాలి", "జీవితం ముగించు"
            ]
        },
        # --- 2. HIGH: Quitting Job & Life under Distress ---
        {
            "category": "JOB_LIFE_QUIT",
            "risk_level": "HIGH",
            "keywords": [
                # English
                "quit my job", "quit job", "quit job/life", "quit life/job", "give up on everything",
                "give up life", "cannot go on", "can't go on", "resign from life", "hopeless",
                "done with life", "done with everything", "empty inside",
                # Hinglish / Hindi
                "job chhod", "naukri chhod", "sab chhod", "chhod raha hu", "chhod dunga",
                "har gaya", "thak gaya zindagi se", "kuch sahi nahi hoga", "haar gaya hu",
                "सब छोड़ रहा हूँ", "नौकरी छोड़ दूंगी", "जिंदगी से हार गया",
                # Regional
                "ਕੰਮ ਛੱਡਣਾ", "ਸਭ ਛੱਡ ਦੇਣਾ", "চাকরি ছেড়ে দেব", "எல்லாம் வேண்டாம்"
            ]
        },
        # --- 3. HIGH: Farewell / Farewell Phrases under Despair ---
        {
            "category": "FAREWELL_DESPAIR",
            "risk_level": "HIGH",
            "keywords": [
                # English & Hinglish
                "goodbye forever", "bye forever", "my last message", "remember me",
                "alvida", "alvida sabhi ko", "aakhri pranam", "aakhri message",
                "माझा शेवटचा निरोप", "আমার শেষ বার্তা", "கடைசி செய்தி"
            ]
        }
    ]

    def analyze(self, text: str) -> Dict[str, Any]:
        if not text:
            return {
                "is_crisis": False,
                "risk_level": "NONE",
                "trigger_phrase": None,
                "category": None,
                "intent": None,
                "confidence": 0.0
            }

        text_lower = text.lower().strip()

        for pattern in self.CRISIS_PATTERNS:
            cat = pattern["category"]
            risk = pattern["risk_level"]
            for kw in pattern["keywords"]:
                kw_lower = kw.lower()
                # Check direct substring match or boundary match
                if kw_lower in text_lower or re.search(r"\b" + re.escape(kw_lower) + r"\b", text_lower):
                    return {
                        "is_crisis": True,
                        "risk_level": risk,
                        "trigger_phrase": kw,
                        "category": cat,
                        "intent": f"Detected crisis trigger ('{kw}') in message",
                        "confidence": 0.96 if risk == "CRITICAL" else 0.88
                    }

        return {
            "is_crisis": False,
            "risk_level": "NONE",
            "trigger_phrase": None,
            "category": None,
            "intent": None,
            "confidence": 0.0
        }

crisis_nlp_engine = CrisisNLPEngine()
