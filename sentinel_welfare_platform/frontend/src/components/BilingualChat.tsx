'use client';
import React, { useState } from 'react';
import { MessageSquare, Send, Globe, Trash2, ShieldCheck, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface BilingualChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BilingualChat: React.FC<BilingualChatProps> = ({ isOpen, onClose }) => {
  const [language, setLanguage] = useState<'en' | 'hi'>('hi');
  const [messages, setMessages] = useState<Array<{ role: string; text: string }>>([
    {
      role: 'assistant',
      text: 'जय हिंद! मैं आपका व्यक्तिगत वेलफेयर साथी हूँ। आपकी ड्यूटी की थकावट, पारिवारिक चिंता या मानसिक तनाव के बारे में आप खुलकर बात कर सकते हैं। यह सत्र पूरी तरह गोपनीय और एफेमरल (अस्थायी) है — कोई भी चैट डेटाबेस में सुरक्षित नहीं किया जाता।'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `soldier_session_${Date.now()}`);

  if (!isOpen) return null;

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
        text: language === 'hi' 
          ? 'सॉरी, सर्वर से कनेक्शन में समस्या है। कृपया कुछ देर बाद प्रयास करें।' 
          : 'Unable to reach welfare service. Please check back shortly.'
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
      text: language === 'hi' 
        ? 'सत्र समाप्त और शुद्ध कर दिया गया है। कोई भी संदेश रिकॉर्ड नहीं किया गया है।' 
        : 'Session ended and memory purged. No messages were retained in the database.'
    }]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-300 rounded-2xl flex flex-col h-[580px] shadow-2xl overflow-hidden">
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
            <button
              onClick={() => setLanguage(l => l === 'hi' ? 'en' : 'hi')}
              className="px-2.5 py-1 text-xs bg-white/10 hover:bg-white/20 text-white rounded-md border border-white/20 flex items-center gap-1 transition"
              title="Switch Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>
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
            title="Purge active in-memory buffer"
          >
            <Trash2 className="w-3 h-3" /> End & Purge
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div 
                key={idx} 
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                    isUser 
                      ? 'bg-[#003366] text-white shadow-sm' 
                      : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-500 shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span>{language === 'hi' ? 'सोच रहा हूँ...' : 'Analyzing supportive response...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={language === 'hi' ? 'यहाँ अपनी समस्या या विचार लिखें...' : 'Type confidential message here...'}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:bg-white"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-[#003366] hover:bg-[#002244] disabled:opacity-50 text-white rounded-xl transition shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
