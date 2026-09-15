'use client';
import React, { useState } from 'react';
import { MessageSquare, Send, Globe, ShieldCheck, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface BilingualChatProps {
  isOpen: boolean;
  onClose: () => void;
}

type SupportedLang = 'en' | 'hi' | 'pa' | 'bn' | 'mr' | 'ta' | 'te';

const LANG_OPTIONS: Array<{ code: SupportedLang; label: string; welcomeMsg: string; errorMsg: string; endMsg: string }> = [
  {
    code: 'hi',
    label: 'हिन्दी',
    welcomeMsg: 'जय हिंद! मैं आपका व्यक्तिगत वेलफेयर साथी हूँ। अपनी ड्यूटी की थकावट, पारिवारिक चिंता या मानसिक तनाव के बारे में आप खुलकर बात कर सकते हैं। यह सत्र पूरी तरह गोपनीय और एफेमरल (अस्थायी) है — कोई भी चैट डेटाबेस में सुरक्षित नहीं किया जाता।',
    errorMsg: 'सॉरी, सर्वर से कनेक्शन में समस्या है। कृपया कुछ देर बाद प्रयास करें।',
    endMsg: 'सत्र समाप्त और शुद्ध कर दिया गया है। कोई भी संदेश रिकॉर्ड नहीं किया गया है।'
  },
  {
    code: 'en',
    label: 'English',
    welcomeMsg: 'Jai Hind! I am your personal Welfare AI Companion. You can speak freely about operational fatigue, family concerns, or stress. This session is completely confidential and ephemeral — zero messages are saved to any database.',
    errorMsg: 'Unable to reach welfare service. Please check back shortly.',
    endMsg: 'Session ended and memory purged. No messages were retained in the database.'
  },
  {
    code: 'pa',
    label: 'ਪੰਜਾਬੀ (Punjabi)',
    welcomeMsg: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਵੈਲਫੇਅਰ ਸਾਥੀ ਹਾਂ। ਆਪਣੀ ਡਿਊਟੀ, ਥਕਾਵਟ ਜਾਂ ਪਰਿਵਾਰ ਬਾਰੇ ਖੁੱਲ੍ਹ ਕੇ ਗੱਲ ਕਰੋ। ਇਹ ਗੱਲਬਾਤ ਪੂਰੀ ਤਰ੍ਹਾਂ ਗੁਪਤ ਹੈ।',
    errorMsg: 'ਸਰਵਰ ਨਾਲ ਕਨੈਕਸ਼ਨ ਵਿੱਚ ਸਮੱਸਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਬਾਅਦ ਵਿੱਚ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    endMsg: 'ਸੈਸ਼ਨ ਸਮਾਪਤ ਹੋ ਗਿਆ ਹੈ। ਕੋਈ ਵੀ ਸੁਨੇਹਾ ਰਿਕਾਰਡ ਨਹੀਂ ਕੀਤਾ ਗਿਆ ਹੈ।'
  },
  {
    code: 'bn',
    label: 'বাংলা (Bengali)',
    welcomeMsg: 'জয় হিন্দ! আমি আপনার ব্যক্তিগত ওয়েলফেয়ার সাথী। ডিউটির ক্লান্তি বা পরিবারের চিন্তা নিয়ে নির্দ্বিধায় কথা বলুন। এই চ্যাট সম্পূর্ণ গোপনীয়।',
    errorMsg: 'সার্ভার সংযোগে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।',
    endMsg: 'সেশন সমাপ্ত হয়েছে। কোনো বার্তা রেকর্ড করা হয়নি।'
  },
  {
    code: 'mr',
    label: 'मराठी (Marathi)',
    welcomeMsg: 'जय हिंद! मी तुमचा वैयक्तिक वेल्फेअर साथी आहे. ड्युटीचा ताण किंवा कौटुंबिक चिंतेबद्दल मोकळेपणाने बोला. हे संभाषण पूर्णपणे गुप्त आहे.',
    errorMsg: 'सर्व्हर कनेक्शनमध्ये अडचण येत आहे. कृपया थोड्या वेळाने प्रयत्न करा.',
    endMsg: 'सत्र समाप्त झाले आहे. कोणताही संदेश जतन केलेला नाही.'
  },
  {
    code: 'ta',
    label: 'தமிழ் (Tamil)',
    welcomeMsg: 'ஜெய் ஹிந்த்! நான் உங்கள் நலன்புரி உதவியாளர். பணி சோர்வு அல்லது குடும்ப கவலைகளை சுதந்திரமாக பகிரலாம். இது முற்றிலும் ரகசியமானது.',
    errorMsg: 'சேவையக இணைப்பில் சிக்கல் உள்ளது. சிறிது நேரம் கழித்து முயற்சிக்கவும்.',
    endMsg: 'அமர்வு முடிவடைந்தது. எந்த செய்தியும் சேமிக்கப்படவில்லை.'
  },
  {
    code: 'te',
    label: 'తెలుగు (Telugu)',
    welcomeMsg: 'జై హింద్! నేను మీ సంక్షేమ సహాయకుడిని. విధుల అలసట లేదా కుటుంబ విషయాల గురించి స్వేచ్ఛగా మాట్లాడవచ్చు. ఈ చాట్ సంపూర్ణంగా రహస్యమైనది.',
    errorMsg: 'సర్వర్ కనెక్షన్‌లో సమస్య ఉంది. దయచేసి కాసేపటి తర్వాత ప్రయత్నించండి.',
    endMsg: 'సెషన్ ముగిసింది. ఏ సందేశం రికార్డ్ చేయబడలేదు.'
  }
];

export const BilingualChat: React.FC<BilingualChatProps> = ({ isOpen, onClose }) => {
  const [language, setLanguage] = useState<SupportedLang>('hi');
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([
    {
      role: 'assistant',
      text: LANG_OPTIONS[0].welcomeMsg
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `soldier_session_${Date.now()}`);

  if (!isOpen) return null;

  const currentLangMeta = LANG_OPTIONS.find(l => l.code === language) || LANG_OPTIONS[0];

  const handleLanguageChange = (newLang: SupportedLang) => {
    setLanguage(newLang);
    const meta = LANG_OPTIONS.find(l => l.code === newLang) || LANG_OPTIONS[0];
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        text: meta.welcomeMsg
      }
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await apiFetch('/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          message: userMsg,
          language: language
        })
      });
      setMessages(prev => [...prev, { role: 'assistant', text: res.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: currentLangMeta.errorMsg
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    try {
      await apiFetch(`/chatbot/end-session?session_id=${sessionId}`, { method: 'POST' });
    } catch (e) {}
    setMessages([{
      role: 'assistant',
      text: currentLangMeta.endMsg
    }]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-300 rounded-2xl flex flex-col h-[600px] shadow-2xl overflow-hidden animate-fadeIn">
        {/* Official MHA Modal Header */}
        <div className="p-4 bg-[#0a2540] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-800/60 border border-blue-600/50 flex items-center justify-center text-blue-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Welfare AI Companion (वेलफेयर साथी)</h3>
              <p className="text-[11px] text-blue-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confidential In-Memory Session | Zero DB Rows</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Multi-Language Selector Dropdown */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-blue-200 absolute left-2 pointer-events-none" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as SupportedLang)}
                className="pl-7 pr-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-sky-400"
              >
                {LANG_OPTIONS.map(opt => (
                  <option key={opt.code} value={opt.code} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-md text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tricolor line */}
        <div className="gov-tricolor-bar-sm w-full" />

        {/* Security Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-3.5 py-1.5 text-[11px] text-amber-900 flex items-center justify-between">
          <span>🔒 Ephemeral Chat: Messages vanish immediately upon session close.</span>
          <button 
            onClick={handleEndSession}
            className="text-red-700 hover:text-red-900 font-semibold flex items-center gap-1 text-[11px]"
          >
            End & Purge Memory
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-[#003366] text-white rounded-br-none font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-ping" />
                <span>Welfare AI is typing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              language === 'hi' ? 'अपनी बात साझा करें... (जैसे: ड्यूटी बहुत लंबी थी)' :
              language === 'pa' ? 'ਆਪਣੀ ਗੱਲ ਦੱਸੋ... (ਜਿਵੇਂ: ਡਿਊਟੀ ਬਹੁਤ ਲੰਬੀ ਸੀ)' :
              language === 'bn' ? 'আপনার কথা বলুন... (যেমন: ডিউটি খুব দীর্ঘ ছিল)' :
              language === 'mr' ? 'आपली माहिती सांगा... (उदा: ड्युटी खूप लांब होती)' :
              language === 'ta' ? 'உங்கள் தகவலைப் பகிரவும்...' :
              language === 'te' ? 'మీ విషయాన్ని పంచుకోండి...' :
              'Type your message... (e.g., Heavy shift today)'
            }
            className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-[#003366] focus:ring-1 focus:ring-[#003366]"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2.5 bg-[#003366] hover:bg-[#002244] disabled:bg-slate-300 text-white rounded-xl transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
