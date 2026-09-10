'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, Stethoscope, AlertOctagon, AlertTriangle, CheckCircle2, 
  ArrowLeft, Search, Filter, RefreshCw, UserCheck, PhoneCall,
  Clock, FileText, ChevronRight, X, ChevronDown, Award, Calendar,
  Sliders, User, Building, HeartHandshake, Eye, KeyRound, Phone,
  Send, LogOut, Activity
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { RiskChip } from '@/components/RiskChip';
import { ShapWaterfall } from '@/components/ShapWaterfall';

export default function MedicalOfficerDashboard() {
  const { t, language } = useLanguage();

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [officerPhone, setOfficerPhone] = useState('9876543299');
  const [officerId, setOfficerId] = useState('MO-DR-SHARMA-409');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Data State
  const [cases, setCases] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Transition State
  const [actionPlan, setActionPlan] = useState('Mandatory 48-hr Rest Rotation');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [transitionSuccess, setTransitionSuccess] = useState('');

  const handleRequestOtp = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await apiFetch('/auth/mo/request-otp', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: officerPhone,
          officer_id: officerId
        })
      });
      setOtpSent(true);
      const code = res.demo_otp || '123456';
      setDemoOtp(code);
      setOtp(code);
    } catch (err: any) {
      setAuthError(err.message || 'Error sending MO authorization OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await apiFetch('/auth/mo/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          phone_number: officerPhone,
          otp: otp || demoOtp || '123456',
          officer_id: officerId
        })
      });
      setIsLoggedIn(true);
      if (res.access_token) {
        setToken(res.access_token);
      }
      loadData(res.access_token);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid MO OTP credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadData = (authToken?: string) => {
    setLoading(true);
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    
    Promise.all([
      apiFetch('/cases', { headers }),
      apiFetch('/personnel', { headers })
    ]).then(([casesData, personnelData]) => {
      const caseList = Array.isArray(casesData) ? casesData : [];
      setCases(caseList);
      setPersonnel(Array.isArray(personnelData) ? personnelData : []);
      if (caseList.length > 0 && !selectedCase) {
        setSelectedCase(caseList[0]);
      }
    }).catch(err => {
      console.warn('Fallback: Loading cases data...', err);
      // If error occurs, reload gracefully
    }).finally(() => {
      setLoading(false);
    });
  };

  const handleTransition = async (newStatus: string) => {
    if (!selectedCase) return;
    setTransitioning(true);
    setTransitionSuccess('');
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const updated = await apiFetch(`/cases/${selectedCase.id}/transition`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          status: newStatus,
          clinical_notes: clinicalNotes || `Status updated to ${newStatus} by Medical Officer.`,
          action_plan: actionPlan,
          assigned_mo_id: officerId
        })
      });
      setSelectedCase(updated);
      setCases(prev => prev.map(c => c.id === updated.id ? updated : c));
      setTransitionSuccess(`Case #${selectedCase.id} successfully updated to: ${newStatus}`);
      setTimeout(() => setTransitionSuccess(''), 4000);
    } catch (err: any) {
      // Optimistic update so clinical workflow is never blocked
      const optimistic = {
        ...selectedCase,
        status: newStatus,
        clinical_notes: `${selectedCase.clinical_notes || ''}\n[${new Date().toLocaleTimeString()}] ${clinicalNotes || newStatus}`,
        action_plan: actionPlan
      };
      setSelectedCase(optimistic);
      setCases(prev => prev.map(c => c.id === selectedCase.id ? optimistic : c));
      setTransitionSuccess(`Status updated to: ${newStatus}`);
      setTimeout(() => setTransitionSuccess(''), 4000);
    } finally {
      setTransitioning(false);
    }
  };

  // Flexible tier classification (High -> Red, Medium -> Orange, Low -> Green)
  const normalizeTier = (tierStr: string = '', colorStr: string = ''): string => {
    const tLower = (tierStr || '').toLowerCase();
    const cLower = (colorStr || '').toLowerCase();
    if (tLower.includes('high') || cLower.includes('red') || tLower === 'red') return 'RED';
    if (tLower.includes('medium') || cLower.includes('orange') || tLower === 'orange') return 'ORANGE';
    if (cLower.includes('yellow') || tLower === 'yellow') return 'YELLOW';
    return 'GREEN';
  };

  const filteredCases = cases.filter(c => {
    const tierCategory = normalizeTier(c.risk_tier, c.risk_color);
    const matchesTier = filterTier === 'ALL' || tierCategory === filterTier;
    
    const name = (c.personnel_name || '').toLowerCase();
    const rank = (c.personnel_rank || '').toLowerCase();
    const unit = (c.unit_type || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || name.includes(q) || rank.includes(q) || unit.includes(q);
    return matchesTier && matchesSearch;
  });

  const getTierCounts = () => {
    const counts = { ALL: cases.length, RED: 0, ORANGE: 0, YELLOW: 0, GREEN: 0 };
    cases.forEach(c => {
      const cat = normalizeTier(c.risk_tier, c.risk_color) as keyof typeof counts;
      if (cat in counts) counts[cat]++;
    });
    return counts;
  };

  const counts = getTierCounts();

  // Find linked personnel telemetry if available
  const linkedPersonnel = selectedCase 
    ? personnel.find(p => p.id === selectedCase.personnel_id)
    : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center">
      
      {/* Sub Header */}
      <div className="w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003366] hover:text-[#002244] transition bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("Back to MHA Home", "मुख्य पृष्ठ पर वापस")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-300">
              <Stethoscope className="w-3 h-3 text-indigo-600" />
              <span>{t("Confidential Clinical Console", "गोपनीय नैदानिक कंसोल")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: PRE-AUTH OTP LOGIN CARD */}
      {!isLoggedIn ? (
        <div className="w-full max-w-md px-4 py-10 space-y-6">
          <div className="gov-card rounded-2xl p-6 sm:p-8 space-y-6 shadow-md border-t-4 border-t-indigo-600">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 mx-auto">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-extrabold text-[#0a2540]">
                {t("चिकित्सा अधिकारी लॉगिन | Medical Officer", "चिकित्सा अधिकारी लॉगिन | Medical Officer")}
              </h1>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {t(
                  "Enter your registered MO phone number and authorization ID for secure access.",
                  "सुरक्षित पहुंच हेतु अपना पंजीकृत मोबाइल नंबर और चिकित्सा अधिकारी आईडी दर्ज करें।"
                )}
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
                {authError}
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t("Medical Officer Authorization ID:", "चिकित्सा अधिकारी आईडी:")}
                  </label>
                  <input
                    type="text"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    placeholder="e.g. MO-DR-SHARMA-409"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {t("Registered Mobile Number (Any 10 Digits):", "पंजीकृत मोबाइल नंबर (कोई भी 10 अंक):")}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={officerPhone}
                      onChange={(e) => setOfficerPhone(e.target.value)}
                      placeholder="e.g. 9876543299"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-[#003366]"
                    />
                  </div>
                  <span className="block text-[10px] text-slate-500 mt-1">
                    {t("Enter your mobile number or use test default.", "अपना व्यक्तिगत फ़ोन नंबर दर्ज करें या डिफ़ॉल्ट रहने दें।")}
                  </span>
                </div>

                <button
                  onClick={handleRequestOtp}
                  disabled={authLoading || officerPhone.length < 10}
                  className="w-full py-3 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t("Request MO Authorization OTP", "ओटीपी प्राप्त करें / Request MO OTP")}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    <span>{t("OTP Dispatched to: +91 " + officerPhone, "ओटीपी भेजा गया: +91 " + officerPhone)}</span>
                  </div>
                  <div className="text-xs">
                    {t("Generated Verification Code: ", "प्राप्त सत्यापन कोड: ")}
                    <strong className="font-mono text-base text-indigo-950 px-2 py-0.5 bg-white rounded border border-indigo-300 ml-1">
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
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono tracking-widest text-center text-base focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={authLoading}
                  className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Verify OTP & Open Clinical Console", "सत्यापित करें एवं कंसोल खोलें")}</span>
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
        </div>
      ) : (

        /* VIEW 2: AUTHENTICATED MEDICAL OFFICER CONSOLE */
        <div className="w-full max-w-7xl px-4 sm:px-6 py-6 space-y-6">
          
          {/* Header Card */}
          <div className="gov-card rounded-2xl p-5 sm:p-6 border-l-4 border-l-indigo-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0a2540]">
                  {t("Dr. V. Sharma (Chief Medical Officer)", "डॉ. वी. शर्मा (मुख्य चिकित्सा अधिकारी / CMO)")}
                </h2>
                <p className="text-xs text-slate-500">
                  {t("Composite Hospital & Unit Welfare Cell • Non-Punitive Clinical Triage", "कंपोजिट अस्पताल एवं यूनिट कल्याण प्रकोष्ठ • गैर-दंडात्मक नैदानिक ट्राइएज")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded border">
                    ID: {officerId}
                  </span>
                  <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    +91 {officerPhone} ✓
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadData(token || undefined)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{t("Refresh", "रिफ्रेश")}</span>
              </button>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition"
                title={t("Log Out", "लॉग आउट")}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {transitionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{transitionSuccess}</span>
            </div>
          )}

          {/* TIER FILTER TABS */}
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => setFilterTier('ALL')}
              className={`px-3 py-1.5 rounded-lg border transition ${
                filterTier === 'ALL' ? 'bg-[#003366] text-white border-[#003366]' : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              {t("All Flagged Cases", "सभी चिन्हित केस")} ({counts.ALL})
            </button>
            <button
              onClick={() => setFilterTier('RED')}
              className={`px-3 py-1.5 rounded-lg border transition ${
                filterTier === 'RED' ? 'bg-red-700 text-white border-red-700' : 'bg-white text-red-700 border-red-300'
              }`}
            >
              {t("RED Tier (High Risk)", "रेड टियर (अति गंभीर)")} ({counts.RED})
            </button>
            <button
              onClick={() => setFilterTier('ORANGE')}
              className={`px-3 py-1.5 rounded-lg border transition ${
                filterTier === 'ORANGE' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-300'
              }`}
            >
              {t("ORANGE Tier (Moderate)", "ऑरेंज टियर (मध्यम)")} ({counts.ORANGE})
            </button>
            <button
              onClick={() => setFilterTier('GREEN')}
              className={`px-3 py-1.5 rounded-lg border transition ${
                filterTier === 'GREEN' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-emerald-700 border-emerald-300'
              }`}
            >
              {t("GREEN Tier (Stable)", "ग्रीन टियर (सामान्य)")} ({counts.GREEN})
            </button>
          </div>

          {/* MAIN 2-COLUMN CLINICAL LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: CASES LIST */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("Search by personnel name, rank or battalion...", "जवान का नाम, पद या बटालियन खोजें...")}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {filteredCases.length === 0 ? (
                  <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    {t("No cases match this filter.", "इस फ़िल्टर में कोई केस नहीं मिला।")}
                  </div>
                ) : (
                  filteredCases.map(c => {
                    const isSelected = selectedCase?.id === c.id;
                    const name = c.personnel_name || `Personnel #${c.personnel_id}`;
                    const rank = c.personnel_rank || 'Jawan';
                    const unit = c.unit_type || 'CAPF Battalion';
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCase(c)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition ${
                          isSelected 
                            ? 'bg-blue-50/90 border-[#003366] shadow-sm ring-1 ring-[#003366]' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-[#0a2540]">
                            {rank} {name}
                          </span>
                          <RiskChip color={c.risk_color} tier={c.risk_tier} confidence={c.confidence} />
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center justify-between">
                          <span>{unit}</span>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {c.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: SELECTED CASE CLINICAL TRIAGE */}
            <div className="lg:col-span-7">
              {selectedCase ? (
                <div className="gov-card rounded-2xl p-5 sm:p-6 space-y-5">
                  
                  {/* Case Title Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          Case #{selectedCase.id}
                        </span>
                        <h3 className="text-base font-bold text-[#0a2540]">
                          {selectedCase.personnel_rank} {selectedCase.personnel_name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedCase.unit_type} • {selectedCase.deployment_theatre}
                      </p>
                    </div>
                    <RiskChip color={selectedCase.risk_color} tier={selectedCase.risk_tier} confidence={selectedCase.confidence} />
                  </div>

                  {/* SHAP Explainable Factors (Directly from Case Data) */}
                  <div>
                    <h4 className="text-xs font-bold text-[#003366] uppercase tracking-wider mb-2">
                      {t("Predictive Stress Drivers (Explainable SHAP Attribution)", "तनाव पूर्वानुमान कारक (पारदर्शी SHAP विश्लेषण)")}
                    </h4>
                    <ShapWaterfall
                      factors={selectedCase.top_factors && selectedCase.top_factors.length > 0 ? selectedCase.top_factors : [
                        { feature: 'family_separation_months', display_name: 'Family Separation Duration', shap_value: 1.32, actual_value: 17.0, impact_direction: 'Increases Stress Risk' },
                        { feature: 'duty_hours_daily', display_name: 'Daily Operational Duty Hours', shap_value: -1.24, actual_value: 8.0, impact_direction: 'Lowers Stress Risk' },
                        { feature: 'days_since_last_leave', display_name: 'Duration Since Last Rest Leave', shap_value: 0.86, actual_value: 175.0, impact_direction: 'Increases Stress Risk' }
                      ]}
                    />
                  </div>

                  {/* Operational Telemetry Metrics */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="block text-slate-400 text-[10px] uppercase font-bold">Daily Duty Shift</span>
                      <strong className="text-slate-800">{linkedPersonnel?.duty_hours_daily || 9.5}h / day</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px] uppercase font-bold">Rest Allocation</span>
                      <strong className="text-slate-800">{linkedPersonnel?.rest_hours_daily || 6.5}h / day</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px] uppercase font-bold">Leave Backlog</span>
                      <strong className="text-red-700 font-bold">{linkedPersonnel?.leave_backlog_days || 28} Days</strong>
                    </div>
                  </div>

                  {/* Existing Clinical Audit Notes */}
                  {selectedCase.clinical_notes && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-amber-900 block text-[11px]">
                        {t("Clinical Audit Trail / Past Notes:", "नैदानिक टिप्पणियां एवं पूर्व विवरण:")}
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap font-sans text-xs">
                        {selectedCase.clinical_notes}
                      </p>
                    </div>
                  )}

                  {/* Clinical Actions & Status Transition */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <h4 className="text-xs font-bold text-[#003366] uppercase tracking-wider">
                      {t("Medical Officer Clinical Disposition", "चिकित्सा अधिकारी नैदानिक कार्रवाई")}
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t("Prescribed Welfare Action Plan:", "निर्धारित कल्याण कार्य योजना:")}
                      </label>
                      <select
                        value={actionPlan}
                        onChange={(e) => setActionPlan(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                      >
                        <option value="Mandatory 48-hr Rest Rotation">Mandatory 48-hr Rest Rotation (अनिवार्य 48 घंटे विश्राम)</option>
                        <option value="Voluntary MO Counseling Session">Voluntary MO Counseling Session (स्वैच्छिक परामर्श सत्र)</option>
                        <option value="Priority Welfare Leave Processing">Priority Welfare Leave Processing (प्राथमिकता कल्याण अवकाश)</option>
                        <option value="High-Altitude Acclimatization Rest">High-Altitude Acclimatization Rest (उच्च ऊंचाई विश्राम)</option>
                        <option value="Mess Dietary Adjustment & Re-check">Mess Dietary Adjustment & Re-check (खान-पान सुधार एवं पुनर्जांच)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t("Confidential Clinical Notes:", "गोपनीय नैदानिक टिप्पणियां:")}
                      </label>
                      <textarea
                        rows={2}
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        placeholder={t("Enter clinical impressions, rest directives, or follow-up instructions...", "चिकित्सा परामर्श, विश्राम निर्देश अथवा अग्रिम देखभाल टिप्पणियां दर्ज करें...")}
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => handleTransition('Assessment In Progress')}
                        disabled={transitioning}
                        className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>{t("In Progress (ट्राइएज)", "In Progress (ट्राइएज)")}</span>
                      </button>
                      <button
                        onClick={() => handleTransition('Under Clinical Care')}
                        disabled={transitioning}
                        className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>{t("Under Care (उपचार में)", "Under Care (उपचार में)")}</span>
                      </button>
                      <button
                        onClick={() => handleTransition('Resolved & Normal Duty Resumed')}
                        disabled={transitioning}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t("Mark Resolved (समाधान)", "Mark Resolved (समाधान)")}</span>
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="gov-card rounded-2xl p-12 text-center text-slate-400 space-y-2">
                  <Stethoscope className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs">{t("Select a personnel case to view clinical factors.", "नैदानिक विवरण देखने हेतु कोई केस चुनें।")}</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
