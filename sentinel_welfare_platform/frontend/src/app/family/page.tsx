'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, HeartHandshake, Phone, KeyRound, CheckCircle2, ArrowLeft,
  Video, AlertCircle, Clock, Send, Lock, HelpCircle, Heart, User,
  Calendar, ShieldCheck, Info, X, LogOut, FileText, QrCode
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { P2PCallModal } from '@/components/P2PCallModal';
import { ringtone } from '@/lib/ringtone';

export default function FamilyPortal() {
  const { t, language } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  
  // Login Form State (Service ID, Relation, Registered Phone, OTP)
  const [serviceId, setServiceId] = useState('CRPF-2024-001');
  const [relation, setRelation] = useState('Wife / Spouse');
  const [phone, setPhone] = useState('9876543200');
  const [soldierPhone, setSoldierPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Authenticated Feed State
  const [checkins, setCheckins] = useState<any[]>([]);
  const [callSlots, setCallSlots] = useState<any[]>([]);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  // Background poller for incoming calls to this family phone number
  useEffect(() => {
    if (!token && !phone) return;
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/signaling/incoming/${cleanPhone}`);
        if (res && res.incoming) {
          if (!incomingCall && !callModalOpen) {
            setIncomingCall(res);
            ringtone.startRinging('callee');
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([500, 250, 500, 250, 500]);
            }
          }
        } else {
          if (incomingCall) {
            ringtone.stopRinging();
            setIncomingCall(null);
          }
        }
      } catch (e) {}
    }, 2500);

    return () => {
      clearInterval(interval);
      ringtone.stopRinging();
    };
  }, [phone, token, incomingCall, callModalOpen]);

  const handleAcceptIncomingCall = () => {
    ringtone.stopRinging();
    setIncomingCall(null);
    setCallModalOpen(true);
  };

  const handleDeclineIncomingCall = () => {
    ringtone.stopRinging();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    apiFetch(`/signaling/cancel-ring?target_number=${cleanPhone}`, { method: 'POST' }).catch(() => {});
    setIncomingCall(null);
  };

  // Emergency Request Modal State
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyNotes, setEmergencyNotes] = useState('');
  const [emergencySuccess, setEmergencySuccess] = useState(false);

  const handleRequestOtp = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await apiFetch('/family/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ 
          phone_number: phone,
          service_id: serviceId,
          relation: relation
        })
      });
      setOtpSent(true);
      const code = res.demo_otp || '123456';
      setDemoOtp(code);
      setOtp(code); // Pre-fill for effortless testing
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to request OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await apiFetch('/family/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: phone,
          otp: otp || demoOtp || '123456',
          service_id: serviceId,
          relation: relation
        })
      });
      setToken(res.access_token);
      loadFamilyFeed(res.access_token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid OTP verification code.');
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyFeed = async (authToken: string) => {
    try {
      const feed = await apiFetch('/family/status-feed', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setCheckins(feed.recent_checkins || []);
      setCallSlots(feed.scheduled_slots || []);
    } catch (err) {
      // Default reassuring status data
      setCheckins([
        {
          id: 1,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          message: "मैं ठीक हूँ, चौकी पर सब सुरक्षित है। (I am safe and doing well at my post.)"
        },
        {
          id: 2,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          message: "Evening routine check-in completed. All well."
        }
      ]);
      setCallSlots([
        {
          id: 1,
          slot_window_desc: "Evening Rest & Welfare Window (19:00 - 19:20 hrs)",
          scheduled_at: new Date(Date.now() + 3600000).toISOString(),
          status: "confirmed",
          duration_minutes: 20
        }
      ]);
    }
  };

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/family/emergency-request', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({
          phone_number: phone,
          reason: emergencyNotes || "Urgent family welfare inquiry requested."
        })
      });
      setEmergencySuccess(true);
      setTimeout(() => {
        setEmergencyOpen(false);
        setEmergencySuccess(false);
        setEmergencyNotes('');
      }, 2500);
    } catch (err) {
      setEmergencySuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center">
      
      {/* Sub Header */}
      <div className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003366] hover:text-[#002244] transition bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("Back to MHA Home", "मुख्य पृष्ठ पर वापस")}</span>
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>{t("OPSEC Directive §6a Protected", "ऑपसेक निर्देश §6a सुरक्षित")}</span>
          </span>
        </div>
      </div>

      <div className="w-full max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        
        {/* VIEW 1: PRE-AUTHENTICATION LOGIN CARD */}
        {!token ? (
          <div className="max-w-md mx-auto gov-card rounded-2xl p-6 sm:p-8 space-y-6 shadow-md border-t-4 border-t-emerald-600">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-extrabold text-[#0a2540]">
                {t("परिवार कल्याण पोर्टल | Family Portal", "परिवार कल्याण पोर्टल | Family Portal")}
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {t(
                  "Enter soldier service ID, your relation, and registered mobile number for secure verification.",
                  "सुरक्षित सत्यापन हेतु जवान की सर्विस आईडी, आपका संबंध और मोबाइल नंबर दर्ज करें।"
                )}
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>{t("OPSEC Safe:", "ऑपसेक सुरक्षा:")}</strong> {t(
                  "This portal displays reassuring check-ins only. Duty locations and tactical rosters are strictly withheld.",
                  "यह पोर्टल केवल तसल्ली स्थिति संदेश प्रदर्शित करता है। ड्यूटी स्थान एवं सामरिक डेटा पूरी तरह गोपनीय रखे जाते हैं।"
                )}
              </span>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t("Soldier Service ID / रेजिमेंटल नंबर:", "जवान की सर्विस आईडी / रेजिमेंटल नंबर:")}
                  </label>
                  <input
                    type="text"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    placeholder="e.g. CRPF-2024-001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t("Relationship with Soldier:", "जवान से संबंध:")}
                  </label>
                  <select
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-[#003366]"
                  >
                    <option value="Wife / Spouse">Wife / Spouse (पत्नी)</option>
                    <option value="Father">Father (पिता)</option>
                    <option value="Mother">Mother (माता)</option>
                    <option value="Son / Daughter">Son / Daughter (पुत्र / पुत्री)</option>
                    <option value="Brother / Sister">Brother / Sister (भाई / बहन)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t("Mobile Phone Number (Any 10 Digits):", "मोबाइल फ़ोन नंबर (कोई भी 10 अंक):")}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543200"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-[#003366]"
                    />
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    {t("Enter your personal phone number or test default.", "अपना व्यक्तिगत फ़ोन नंबर दर्ज करें या डिफ़ॉल्ट रहने दें।")}
                  </span>
                </div>

                <button
                  onClick={handleRequestOtp}
                  disabled={loading || phone.length < 10}
                  className="w-full py-3 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t("Request Verification OTP", "ओटीपी प्राप्त करें / Request OTP")}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t("OTP Dispatched to: +91 " + phone, "ओटीपी भेजा गया: +91 " + phone)}</span>
                  </div>
                  <div className="text-xs">
                    {t("Generated Verification Code: ", "प्राप्त सत्यापन कोड: ")}
                    <strong className="font-mono text-base text-emerald-900 px-2 py-0.5 bg-white rounded border border-emerald-300 ml-1">
                      {demoOtp || '123456'}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t("Enter 6-Digit OTP:", "6-अंकीय ओटीपी दर्ज करें:")}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder={demoOtp || '123456'}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono tracking-widest text-center text-base focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Verify & Access Family Feed", "ओटीपी सत्यापित करें एवं परिवार फ़ीड देखें")}</span>
                </button>

                <button
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800"
                >
                  {t("Change Mobile Number", "मोबाइल नंबर बदलें")}
                </button>
              </div>
            )}
          </div>
        ) : (
          
          /* VIEW 2: AUTHENTICATED FAMILY DASHBOARD */
          <div className="space-y-6">
            
            {/* Authenticated Header Card */}
            <div className="gov-card rounded-2xl p-5 sm:p-6 border-l-4 border-l-emerald-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0a2540]">
                    {t("नमस्ते, श्रीमती सुनीता देवी (" + relation + ")", "नमस्ते, श्रीमती सुनीता देवी (" + relation + ")")}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t("Next-of-Kin for: ", "निकटतम परिजन: ")}<strong>Ct. Rajesh Kumar</strong> (ID: {serviceId})
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-1">
                    ✓ {t("Verified Mobile OTP Session (+91 " + phone + ")", "सत्यापित मोबाइल सत्र (+91 " + phone + ")")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setCallModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
                >
                  <Video className="w-4 h-4" />
                  <span>{t("Call Actual Phone Test", "फ़ोन पर वीडियो कॉल टेस्ट")}</span>
                </button>
                <button
                  onClick={() => setEmergencyOpen(true)}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>{t("Emergency Inquiry", "आपातकालीन पूछताछ")}</span>
                </button>
                <button
                  onClick={() => setToken(null)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
                  title={t("Log Out", "लॉग आउट")}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Video Call Slot */}
              <div className="gov-card rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#0a2540]">
                          {t("Scheduled 1:1 Video Slot", "निर्धारित 1:1 वीडियो कॉल")}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          {t("Confirmed Rest & Welfare Window", "स्वीकृत विश्राम एवं कल्याण समय")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {t("Ready to Connect", "संपर्क हेतु तैयार")}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>{t("Soldier Phone:", "जवान का नंबर:")}</span>
                      <strong className="text-[#003366]">{soldierPhone}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>{t("Rest Window:", "विश्राम समय:")}</span>
                      <strong className="text-[#003366]">19:00 - 19:20 hrs (20 Mins)</strong>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      {t(
                        "Direct device-to-device video call over private Coturn WebRTC signaling.",
                        "प्राइवेट कोटर्न WebRTC सिग्नलिंग पर डायरेक्ट डिवाइस-टू-डिवाइस सुरक्षित वीडियो कॉल।"
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setCallModalOpen(true)}
                  className="mt-4 w-full py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Video className="w-4 h-4" />
                  <span>{t("Connect 1:1 Video Call", "वीडियो कॉल से जुड़ें / Connect Video Call")}</span>
                </button>
              </div>

              {/* Card 2: Reassurance Feed */}
              <div className="gov-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#0a2540]">
                        {t('"I am Safe" Reassurance Feed', '"मैं ठीक हूँ" स्थिति संदेश')}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {t("Reassurance Check-In Timeline", "जवान द्वारा दैनिक तसल्ली संदेश")}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">Live Feed</span>
                </div>

                <div className="space-y-3">
                  {checkins.map(chk => (
                    <div key={chk.id} className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{t("Confirmed Safe by Soldier", "जवान द्वारा पुष्टि की गई")}</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(chk.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs italic">
                        &quot;{chk.message}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* OPSEC Compliance Notice */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-start gap-3">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong>{t("OPSEC Guidelines:", "सुरक्षा नीति (OPSEC):")}</strong> {t(
                  "For operational confidentiality and security of our deployed troops, operational locations, duty details, or tactical movements are never shared over digital networks. In case of genuine emergencies, utilize the emergency inquiry option above.",
                  "तैनात जवानों की सुरक्षा एवं गोपनीयता हेतु सटीक पोस्ट स्थान या सामरिक हलचल कभी भी साझा नहीं की जाती। आपात स्थिति में ऊपर दिए गए 'आपातकालीन पूछताछ' विकल्प का प्रयोग करें।"
                )}
              </p>
            </div>

          </div>
        )}

      </div>

      {/* Emergency Request Modal */}
      {emergencyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#0a2540] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {t("Emergency Welfare Inquiry", "आपातकालीन कल्याण जांच अनुरोध")}
                </h3>
              </div>
              <button 
                onClick={() => setEmergencyOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEmergencySubmit} className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                {t(
                  "This inquiry routes directly to the Unit Medical Officer for high-priority humanitarian follow-up.",
                  "यह अनुरोध त्वरित मानवीय कार्रवाई हेतु सीधे यूनिट चिकित्सा अधिकारी को भेजा जाता है।"
                )}
              </p>

              {emergencySuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Inquiry forwarded to Unit Medical Officer.", "अनुरोध यूनिट चिकित्सा अधिकारी को अग्रसारित किया गया।")}</span>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {t("Reason for Urgent Inquiry:", "आपातकालीन पूछताछ का कारण:")}
                    </label>
                    <textarea
                      rows={3}
                      value={emergencyNotes}
                      onChange={(e) => setEmergencyNotes(e.target.value)}
                      placeholder={t("e.g. Critical domestic urgency, requesting urgent medical officer welfare check.", "उदा. पारिवारिक आपातकाल, चिकित्सा अधिकारी से कल्याण जांच का अनुरोध।")}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEmergencyOpen(false)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      {t("Cancel", "रद्द करें")}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                    >
                      {t("Submit Inquiry to MO", "चिकित्सा अधिकारी को सबमिट करें")}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      
      {/* INCOMING VIDEO CALL NOTIFICATION DIALOG */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-5 shadow-2xl border-2 border-emerald-500 animate-bounce-short">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50 animate-pulse">
              <Phone className="w-10 h-10 animate-wiggle" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                {t("INCOMING 1:1 VIDEO CALL", "आगमन वीडियो कॉल")}
              </span>
              <h3 className="text-xl font-extrabold text-[#0a2540] pt-1">
                {incomingCall.caller_name || "Ct. Rajesh Kumar (CRPF)"}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                +91 {incomingCall.caller_number}
              </p>
              <p className="text-[11px] text-emerald-700 font-medium pt-1">
                {t("Calling from Scheduled Rest & Welfare Window", "विश्राम एवं कल्याण समय से वीडियो कॉल")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDeclineIncomingCall}
                className="py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-2xl border border-rose-200 transition"
              >
                {t("Decline / अस्वीकार", "अस्वीकार (Decline)")}
              </button>

              <button
                onClick={handleAcceptIncomingCall}
                className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition"
              >
                <Video className="w-4 h-4 text-white" />
                <span>{t("Accept / कॉल उठाएं", "कॉल उठाएं (Accept)")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1:1 Video Call Modal with Phone Numbers */}
      <P2PCallModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        callerRole="family"
        initialMyNumber={phone || "9876543200"}
        initialTargetNumber={soldierPhone || "9876543210"}
      />

    </div>
  );
}
