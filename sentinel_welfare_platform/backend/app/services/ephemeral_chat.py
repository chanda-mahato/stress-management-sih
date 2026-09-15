import time
import threading
import re
from typing import Dict, List, Optional

class EphemeralChatManager:
    """
    In-memory session manager with automatic TTL eviction.
    Architectural guarantee: zero message rows are ever saved to the database.
    Supports 7 languages: English (en), Hindi (hi), Punjabi (pa), Bengali (bn), Marathi (mr), Tamil (ta), Telugu (te).
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
        
        # Helper for word-boundary pattern matching
        def matches_any(keywords: list[str]) -> bool:
            return any(re.search(r"\b" + re.escape(kw) + r"\b", msg_lower) for kw in keywords)

        # 1. Script & Language Auto-Detection
        is_devanagari = any('\u0900' <= c <= '\u097F' for c in user_message)
        is_gurmukhi = any('\u0A00' <= c <= '\u0A7F' for c in user_message)
        is_bengali = any('\u0980' <= c <= '\u09FF' for c in user_message)
        is_tamil = any('\u0B80' <= c <= '\u0BFF' for c in user_message)
        is_telugu = any('\u0C00' <= c <= '\u0C7F' for c in user_message)

        if is_gurmukhi:
            eff_lang = "pa"
        elif is_bengali:
            eff_lang = "bn"
        elif is_tamil:
            eff_lang = "ta"
        elif is_telugu:
            eff_lang = "te"
        elif is_devanagari:
            eff_lang = language if language in ["hi", "mr"] else "hi"
        else:
            eff_lang = language if language in ["en", "hi", "pa", "bn", "mr", "ta", "te"] else "en"

        def get_reply(replies: dict) -> str:
            return replies.get(eff_lang, replies.get("en", ""))

        # 2. Intent Matching
        # A. Workload / Heavy Duty / Operational Pressure
        if matches_any(["work load", "workload", "heavy work", "duty", "hours", "task", "bojh", "kaam", "heavy", "hard", "shift", "thakan"]):
            reply = get_reply({
                "hi": "अत्यधिक कार्यभार और लंबे ड्यूटी के घंटे वाकई बहुत थका देने वाले होते हैं। अपनी सेहत का ध्यान रखें और संभव हो तो पानी पिएं व छोटे ब्रेक लें। क्या आप अपनी शिफ्ट रोटेशन के बारे में साथी जवानों से बात कर सकते हैं?",
                "pa": "ਬਹੁਤ ਜ਼ਿਆਦਾ ਕੰਮ ਦਾ ਬੋਝ ਅਤੇ ਲੰਬੀ ਡਿਊਟੀ ਦੇ ਘੰਟੇ ਬਹੁਤ ਥਕਾ ਦੇਣ ਵਾਲੇ ਹੁੰਦੇ ਹਨ। ਆਪਣੀ ਸਿਹਤ ਦਾ ਧਿਆਨ ਰੱਖੋ, ਪਾਣੀ ਪੀਓ ਅਤੇ ਛੋਟੇ ਬ੍ਰੇਕ ਲਵੋ।",
                "bn": "অতিরিক্ত কাজের চাপ এবং দীর্ঘ ডিউটি সত্যিই খুব ক্লান্তিকর। নিজের শরীরের যত্ন নিন, জল পান করুন এবং ছোট বিরতি নিন।",
                "mr": "अति ताण आणि लांब ड्युटीचे तास अत्यंत थकवणारे असतात. स्वतःच्या आरोग्याची काळजी घ्या, पाणी प्या आणि छोटे ब्रेक घ्या.",
                "ta": "அதிக வேலைச்சுமை மற்றும் நீண்ட பணி நேரம் மிகவும் சோர்வளிக்கும். உங்கள் ஆரோக்கியத்தை கவனித்துக் கொள்ளுங்கள், சிறிய இடைவேளைகளை எடுங்கள்.",
                "te": "అధిక పనిభారం మరియు సుదీర్ఘ విధి గంటలు చాలా అలసటగా ఉంటాయి. మీ ఆరోగ్యాన్ని జాగ్రత్తగా చూసుకోండి, చిన్న విరామాలు తీసుకోండి.",
                "en": "Managing a heavy workload and long operational hours can be extremely demanding. Remember to pace yourself and take brief hydration breaks when safety permits. Is there any way to adjust shift sharing with your unit team?"
            })

        # B. Feeling Unwell / Bad / Sick / Low Mood
        elif matches_any(["not feeling good", "unwell", "feeling bad", "sick", "low", "sad", "depressed", "bura", "accha nahi", "kuch accha"]):
            reply = get_reply({
                "hi": "यह सुनकर दुख हुआ कि आप अच्छा महसूस नहीं कर रहे हैं। आपका स्वास्थ्य और मानसिक शांति सबसे पहले है। यदि आप अस्वस्थ या अत्यधिक चिंतित महसूस कर रहे हैं, तो कृपया यूनिट मेडिकल ऑफिसर (MO) से परामर्श लें या थोड़ा विश्राम करें।",
                "pa": "ਇਹ ਸੁਣ ਕੇ ਦੁੱਖ ਹੋਇਆ ਕਿ ਤੁਸੀਂ ਚੰਗਾ ਮਹਿਸੂਸ ਨਹੀਂ ਕਰ ਰਹੇ। ਤੁਹਾਡੀ ਸਿਹਤ ਸਭ ਤੋਂ ਪਹਿਲਾਂ ਹੈ। ਜੇਕਰ ਅਸਵਸਥ ਹੋ ਤਾਂ ਯੂਨਿਟ ਡਾਕਟਰ (MO) ਨਾਲ ਗੱਲ ਕਰੋ।",
                "bn": "শুনে খারাপ লাগলো যে আপনি ভালো বোধ করছেন না। আপনার স্বাস্থ্য এবং মানসিক শান্তি সবচেয়ে আগে। প্রয়োজনে মেডিকেল অফিসারের (MO) পরামর্শ নিন।",
                "mr": "तुम्हाला बरे वाटत नाही हे ऐकून वाईट वाटले. तुमचे आरोग्य सर्वात महत्त्वाचे आहे. आवश्यक असल्यास युनिट मेडिकल ऑफिसरचा (MO) सल्ला घ्या.",
                "ta": "நீங்கள் நலமாக இல்லை என்று கேள்விப்பட்டு வருந்துகிறேன். உங்கள் ஆரோக்கியமே முதன்மையானது. மருத்துவ அதிகாரியை (MO) அணுகவும்.",
                "te": "మీరు బాగులేరని వినడం బాధగా ఉంది. మీ ఆరోగ్యం అత్యంత ముఖ్యం. అవసరమైతే వైద్య అధికారిని (MO) సంప్రదించండి.",
                "en": "I am sorry to hear that you are not feeling good. Your health and emotional wellbeing come first. If you are feeling physically unwell or overwhelmed, please consider speaking with the Unit Medical Officer (MO) or taking time to rest."
            })

        # C. Seeking Guidance / Help / Next Steps
        elif matches_any(["what to do", "help", "guide", "solution", "kya karu", "madad", "kaise"]):
            reply = get_reply({
                "hi": "जब भी आपको समझ न आए कि क्या करें, तो सबसे पहले थोड़ा गहरा सांस लें और विश्राम करें। आप किसी साथी जवान से बात कर सकते हैं या यूनिट वेलफेयर ऑफिसर से मार्गदर्शन ले सकते हैं। आपको अकेले यह तनाव उठाने की जरूरत नहीं है।",
                "pa": "ਜਦੋਂ ਵੀ ਸਮਝ ਨਾ ਆਵੇ ਕਿ ਕੀ ਕਰਨਾ ਹੈ, ਲੰਬਾ ਸਾਹ ਲਵੋ ਅਤੇ ਆਰਾਮ ਕਰੋ। ਆਪਣੇ ਸਾਥੀ ਜਵਾਨ ਨਾਲ ਗੱਲ ਕਰੋ। ਤੁਸੀਂ ਇਕੱਲੇ ਨਹੀਂ ਹੋ।",
                "bn": "কী করবেন বুঝতে না পারলে প্রথমে গভীর শ্বাস নিন এবং বিশ্রাম করুন। সহকর্মী জওয়ানের সাথে কথা বলুন বা ওয়েলফেয়ার অফিসারের পরামর্শ নিন।",
                "mr": "काय करावे हे समजत नसेल तर दीर्घ श्वास घ्या आणि विश्रांती घ्या. आपल्या सहकारी जवानाशी बोला किंवा वेलफेअर ऑफिसरचे मार्गदर्शन घ्या.",
                "ta": "என்ன செய்வது என்று தெரியவில்லை என்றால், ஆழமாக மூச்சு விட்டு ஓய்வெடுக்கவும். தோழர்களுடன் பேசுங்கள். நீங்கள் தனியாக இல்லை.",
                "te": "ఏం చేయాలో తోచనప్పుడు దీర్ఘ శ్వాస తీసుకుని విశ్రాంతి తీసుకోండి. తోటి జవానుతో మాట్లాడండి. మీరు ఒంటరి కాదు.",
                "en": "Whenever you feel unsure of what to do, start by taking deep breaths and focusing on basic rest. Speak with a trusted peer or consult your Unit Welfare Officer. You do not have to carry this burden alone."
            })

        # D. Stress / Anxiety / Fatigue
        elif matches_any(["stress", "tired", "exhausted", "fatigue", "tanav", "thakan", "pareshan", "chinta"]):
            reply = get_reply({
                "hi": "नमस्ते जवान साथी। आपके ड्यूटी के कठिन हालात और थकावट हम समझ सकते हैं। क्या आप आज थोड़ा आराम कर पाए? अपनी फैमिली से बात करने के लिए कॉल स्लॉट शेड्यूल किया गया है।",
                "pa": "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜਵਾਨ ਵੀਰ। ਤੁਹਾਡੀ ਡਿਊਟੀ ਦੀ ਥਕਾਵਟ ਅਸੀਂ ਸਮਝ ਸਕਦੇ ਹਾਂ। ਆਪਣੇ ਪਰਿਵਾਰ ਨਾਲ ਵੀਡੀਓ ਕਾਲ ਰਾਹੀਂ ਜੁੜੋ।",
                "bn": "জয় হিন্দ জওয়ান ভাই! আপনার ডিউটির ক্লান্তি আমরা বুঝি। পরিবারের সাথে ভিডিও কলে যুক্ত হওয়ার জন্য কল স্লট নির্ধারিত আছে।",
                "mr": "नमस्कार जवान बंधू! तुमच्या ड्युटीचा ताण आम्ही समजू शकतो. आपल्या कुटुंबाशी बोलण्यासाठी कॉल स्लॉट वापरू शकता.",
                "ta": "வணக்கம் ஜவான் தோழரே. உங்கள் பணி சோர்வை நாங்கள் புரிகிறோம். குடும்பத்துடன் தொடர்பு கொள்ள நேரம் ஒதுக்கப்பட்டுள்ளது.",
                "te": "నమస్కారం జవాన్ సోదరా. మీ విధి అలసటను మేము అర్థం చేసుకున్నాము. కుటుంబంతో మాట్లాడటానికి కాల్ స్లాట్ అందుబాటులో ఉంది.",
                "en": "Hello comrade. Operational hardship and rigorous duty hours take a real toll. Remember that decompression is vital. Have you been able to take your designated rest hours today?"
            })

        # E. Sleep Issues / Insomnia
        elif matches_any(["sleep", "insomnia", "night", "neend", "so nahi"]):
            reply = get_reply({
                "hi": "रात की ड्यूटी के बाद नींद पूरी न होना स्वाभाविक है। क्या आपने यूनिट मेडिकल ऑफिसर (MO) को नींद की समस्या बताई है? जरूरत हो तो हम सहायता टीम को सतर्क कर सकते हैं।",
                "pa": "ਰਾਤ ਦੀ ਡਿਊਟੀ ਤੋਂ ਬਾਅਦ ਨੀਂਦ ਪੂਰੀ ਨਾ ਹੋਣਾ ਆਮ ਹੈ। ਯੂਨਿਟ ਡਾਕਟਰ ਨਾਲ ਸਲਾਹ ਲਵੋ।",
                "bn": "নাইট ডিউটির পর ঘুম না হওয়া স্বাভাবিক। প্রয়োজন মনে করলে মেডিকেল অফিসারের পরামর্শ নিন।",
                "mr": "रात्रीच्या ड्युटीनंतर झोप पूर्ण न होणे स्वाभाविक आहे. गरज असल्यास वैद्यकीय अधिकाऱ्यांशी बोला.",
                "ta": "இரவு பணிக்கு பின் தூக்கமின்மை இயல்பானது. தேவைப்பட்டால் மருத்துவரிடம் பேசுங்கள்.",
                "te": "రాత్రి విధి తర్వాత నిద్రలేమి సహజం. అవసరమైతే వైద్య అధికారిని సంప్రదించండి.",
                "en": "Continuous night shifts disrupt natural circadian cycles. If you are experiencing prolonged sleep deprivation, our Unit Medical Officer can offer guidance without any impact on your record."
            })

        # F. Family / Leave / Home Station
        elif matches_any(["family", "home", "leave", "wife", "kids", "ghar", "parivar", "chhutti"]):
            reply = get_reply({
                "hi": "परिवार से दूर रहना सबसे कठिन मोर्चा है। आपका 'I am Okay' पिंग आपके घर तक सुरक्षित पहुँचता है। शाम के विश्राम समय में आप वीडियो कॉल से जुड़ सकते हैं।",
                "pa": "ਪਰਿਵਾਰ ਤੋਂ ਦੂਰ ਰਹਿਣਾ ਔਖਾ ਹੈ। ਤੁਹਾਡਾ 'I am Okay' ਸੁਨੇਹਾ ਪਰਿਵਾਰ ਤੱਕ ਪਹੁੰਚਦਾ ਹੈ। ਵੀਡੀਓ ਕਾਲ ਰਾਹੀਂ ਗੱਲ ਕਰੋ।",
                "bn": "পরিবার থেকে দূরে থাকা কঠিন। আপনার 'I am Okay' বার্তা পরিবারে পৌঁছে গেছে। সন্ধ্যায় কথা বলুন।",
                "mr": "कुटुंबापासून दूर राहणे कठीण आहे. तुमचा 'I am Okay' संदेश कुटुंबापर्यंत पोहोचला आहे. संध्याकाळी कॉल करा.",
                "ta": "குடும்பத்தைப் பிரிந்திருப்பது கடினம். உங்கள் 'I am Okay' செய்தி குடும்பத்தைச் சென்றடைந்தது.",
                "te": "కుటుంబానికి దూరంగా ఉండటం కష్టం. మీ 'I am Okay' సందేశం కుటుంబానికి చేరింది.",
                "en": "Staying separated from home station is one of the toughest parts of service. Your family has received your latest safety ping. Make sure to connect during your scheduled rest window."
            })

        # G. Greetings / Small Talk
        elif matches_any(["hello", "hi", "hey", "how are you", "good morning", "good evening", "namaste", "kaise ho", "sat sri akal"]):
            reply = get_reply({
                "hi": "नमस्ते जवान साथी! मैं ठीक हूँ, धन्यवाद। मैं आपकी सहायता और वेलफेयर के लिए यहाँ हमेशा उपलब्ध हूँ। आज आपकी ड्यूटी कैसी चल रही है?",
                "pa": "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜਵਾਨ ਵੀਰ! ਮੈਂ ਠੀਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਹਮੇਸ਼ਾ ਇੱਥੇ ਹਾਂ। ਅੱਜ ਡਿਊਟੀ ਕਿਵੇਂ ਚੱਲ ਰਹੀ ਹੈ?",
                "bn": "জয় হিন্দ জওয়ান ভাই! আমি ভালো আছি। আপনার সহায়তায় আমি সর্বদা প্রস্তুত। আজকের ডিউটি কেমন চলছে?",
                "mr": "नमस्कार जवान बंधू! मी छान आहे. तुमच्या मदतीसाठी मी नेहमी उपलब्ध आहे. आजची ड्युটি कशी चालली आहे?",
                "ta": "வணக்கம் ஜவான் தோழரே! நான் நலமாக உள்ளேன். உங்கள் உதவிக்கு எப்போதும் సిద్ధமாக உள்ளேன். இன்று பணி எவ்வாறு உள்ளது?",
                "te": "జై హింద్ జవాన్ సోదరా! నేను బాగున్నాను. మీ సహాయానికి నేను ఎల్లప్పుడూ సిద్ధంగా ఉన్నాను. ఈ రోజు విధి ఎలా నడుస్తోంది?",
                "en": "Hello comrade! I am doing well, thank you. I am here to support your wellbeing anytime. How has your shift been today?"
            })

        # H. Dynamic Fallback
        else:
            reply = get_reply({
                "hi": "अपनी बात साझा करने के लिए धन्यवाद जवान साथी। मैं आपकी बात ध्यान से सुन रहा हूँ। कृपया मुझे विस्तार से बताएं कि आपके मन में क्या चल रहा है या आपकी ड्यूटी कैसी चल रही है।",
                "pa": "ਆਪਣੀ ਗੱਲ ਸਾਂਝੀ ਕਰਨ ਲਈ ਧੰਨਵਾਦ ਜਵਾਨ ਵੀਰ। ਮੈਂ ਧਿਆਨ ਨਾਲ ਸੁਣ ਰਿਹਾ ਹਾਂ। ਮੈਨੂੰ ਹੋਰ ਦੱਸੋ।",
                "bn": "আপনার কথা জানানোর জন্য ধন্যবাদ জওয়ান ভাই। আমি মন দিয়ে শুনছি। আপনার মনের কথা নির্দ্বিধায় বলুন।",
                "mr": "आपली माहिती शेअर केल्याबद्दल धन्यवाद जवान बंधू. मी लक्षपूर्वक ऐकत आहे. सविस्तर सांगा.",
                "ta": "உங்கள் கருத்தைப் பகிர்ந்தமைக்கு நன்றி தோழரே. நான் கவனமாகக் கேட்கிறேன். மேலும் விவரமாகக் கூறுங்கள்.",
                "te": "మీ విషయాన్ని పంచుకున్నందుకు ధన్యవాదాలు సోదరా. నేను శ్రద్ధగా వింటున్నాను. మరింత వివరంగా చెప్పండి.",
                "en": "Thank you for sharing that with me, comrade. I am listening carefully. Please feel free to tell me more about what is on your mind or how your shift is going."
            })

        self.add_message(session_id, "assistant", reply, language)
        return reply

chat_manager = EphemeralChatManager(session_ttl_seconds=300)
