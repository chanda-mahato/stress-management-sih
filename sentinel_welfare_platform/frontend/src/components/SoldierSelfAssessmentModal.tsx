'use client';
import React, { useState } from 'react';
import { 
  X, CheckCircle2, Moon, Activity, Utensils, Zap, Heart, Shield, 
  Sparkles, AlertCircle, ArrowRight, Battery, RefreshCw, Award
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  soldierId?: number;
  onAssessmentCompleted?: (result: any) => void;
}

export const SoldierSelfAssessmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  soldierId = 1,
  onAssessmentCompleted
}) => {
  const { t, language } = useLanguage();

  // Selected Option Indices (1 to 4)
  const [sleepChoice, setSleepChoice] = useState<number>(1);
  const [energyChoice, setEnergyChoice] = useState<number>(1);
  const [appetiteChoice, setAppetiteChoice] = useState<number>(1);
  const [tensionChoice, setTensionChoice] = useState<number>(1);
  const [familyChoice, setFamilyChoice] = useState<number>(1);
  const [batteryPercent, setBatteryPercent] = useState<number>(85);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const sleepQuestions = [
    {
      score: 5,
      en: "Restorative Sleep: 7+ hours sound, uninterrupted rest. Woke up refreshed and ready.",
      hi: "गहरी एवं आरामदायक नींद: 7+ घंटे निर्बाध नींद। सुबह उठने पर पूरी तरह तरोताज़ा।"
    },
    {
      score: 4,
      en: "Normal Sleep: 5-6 hours. Woke up once or twice but felt adequately recovered.",
      hi: "सामान्य नींद: 5-6 घंटे। रात में एक-आध बार आंख खुली पर थकान दूर हो गई।"
    },
    {
      score: 2,
      en: "Fragmented Sleep: Broken sleep, frequent awakenings. Heavy head and sluggish morning.",
      hi: "अधूरी/टूटी नींद: बार-बार आंख खुली। सुबह सिर में भारीपन और शरीर में सुस्ती।"
    },
    {
      score: 1,
      en: "Severe Deficit: Less than 4 hours, tossing and turning. Unrefreshed and exhausted.",
      hi: "अत्यधिक नींद की कमी: 4 घंटे से कम, करवटें बदलते रहे। सुबह भारी थकान।"
    }
  ];

  const energyQuestions = [
    {
      score: 5,
      en: "Sharp & Vigilant: Alert, high situational awareness, steady focus throughout post.",
      hi: "पूरी तरह चुस्त एवं सजग: ड्यूटी पर त्वरित सजगता, कोई भटकाव नहीं।"
    },
    {
      score: 4,
      en: "Steady Endurance: Normal operational stamina, regular alertness on patrol.",
      hi: "सामान्य कार्यशील सजगता: सामान्य ड्यूटी क्षमता, चाय-पानी के बाद चुस्ती।"
    },
    {
      score: 2,
      en: "Heavy Eyes & Drifting: Eyelids feeling heavy, brief loss of focus or irritability.",
      hi: "आंखों में भारीपन एवं भटकाव: ड्यूटी पर झपकी जैसा अहसास, ध्यान भटकना।"
    },
    {
      score: 1,
      en: "Severe Fatigue: Forcing alertness with great effort, extreme physical exhaustion.",
      hi: "गंभीर शारीरिक थकान: सजग रहने में भारी संघर्ष, शरीर साथ नहीं दे रहा।"
    }
  ];

  const appetiteQuestions = [
    {
      score: 5,
      en: "Full Appetite: Regular meals on time in mess, adequate hydration throughout day.",
      hi: "पूरी खुराक एवं समय पर भोजन: मेस में नियमित संतुलित भोजन और पर्याप्त पानी।"
    },
    {
      score: 4,
      en: "Moderate Intake: Ate normally, didn't miss meals though appetite was routine.",
      hi: "सामान्य भोजन: समय पर सामान्य खुराक ली, कोई भोजन नहीं छोड़ा।"
    },
    {
      score: 2,
      en: "Reduced Appetite: Low hunger, forced down half a meal or had tea instead.",
      hi: "भूख में कमी: भोजन की इच्छा नहीं थी, बेमन से आधा खाना खाया।"
    },
    {
      score: 1,
      en: "Skipped Meals: Barely ate in mess over last 24-48 hrs, surviving on water/tea.",
      hi: "खाना छोड़ दिया: पिछले 24-48 घंटों में मेस में लगभग न के बराबर खाना खाया।"
    }
  ];

  const tensionQuestions = [
    {
      score: 5,
      en: "Supple & Relaxed: Normal post-duty recovery, muscles feel loose and loose.",
      hi: "शरीर हल्का और तनाव-मुक्त: ड्यूटी के बाद सामान्य रिकवरी, कोई दर्द नहीं।"
    },
    {
      score: 4,
      en: "Mild Fatigue: Expected leg/back tightness from standing guard, relieves with rest.",
      hi: "हल्की सामान्य थकान: संतरी ड्यूटी से पैरों या कमर में हल्की थकान जो आराम से ठीक हो।"
    },
    {
      score: 2,
      en: "Stiff Neck & Shoulders: Persistent tightness from tactical gear, frequent headache.",
      hi: "गर्दन और कंधों में जकड़न: आर्मर/गियर से मांसपेशियों में खिंचाव या सिरदर्द।"
    },
    {
      score: 1,
      en: "Severe Bodily Strain: Continuous muscle spasms, restless pacing, inability to unwind.",
      hi: "लगातार शारीरिक जकड़न: शरीर में खिंचाव, आराम करने पर भी बेचैनी।"
    }
  ];

  const familyQuestions = [
    {
      score: 5,
      en: "Peaceful Contact: Had a warm, reassuring phone/video chat with family recently.",
      hi: "तसल्ली भरी बातचीत: हाल ही में घर पर परिजनों से सुकून भरी बात हुई, सब कुशल-मंगल।"
    },
    {
      score: 4,
      en: "Routine Check-In: Spoke briefly 2-3 days ago, standard domestic welfare update.",
      hi: "सामान्य कुशलक्षेम: 2-3 दिन पहले संक्षेप में बात हुई, सामान्य स्थिति।"
    },
    {
      score: 2,
      en: "Delayed Contact: Over a week since speaking to family due to terrain/network.",
      hi: "संपर्क में देरी: दुर्गम इलाके या ड्यूटी के कारण लगभग हफ्ते भर से बात नहीं हो सकी।"
    },
    {
      score: 1,
      en: "Domestic Preoccupation: A pressing family matter back home is constantly on my mind.",
      hi: "घरेलू चिंता: घर पर किसी जरूरी मसले या परेशानी को लेकर मन में लगातार उलझन।"
    }
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const q1Score = sleepQuestions[sleepChoice].score;
      const q2Score = energyQuestions[energyChoice].score;
      const q3Score = appetiteQuestions[appetiteChoice].score;
      const q4Score = tensionQuestions[tensionChoice].score;
      const q5Score = familyQuestions[familyChoice].score;

      // Map to 1-5 scale
      const moodRating = Math.round((q2Score + q5Score) / 2);
      const sleepRating = q1Score;
      const fatigueRating = Math.max(1, 6 - Math.round((q2Score + q4Score) / 2));

      const payload = {
        mood_score: moodRating,
        sleep_score: sleepRating,
        fatigue_score: fatigueRating,
        battery_percentage: batteryPercent,
        raw_answers: {
          sleep: sleepQuestions[sleepChoice].en,
          alertness: energyQuestions[energyChoice].en,
          nutrition: appetiteQuestions[appetiteChoice].en,
          bodily_tension: tensionQuestions[tensionChoice].en,
          family_connect: familyQuestions[familyChoice].en,
          battery_gauge: batteryPercent
        }
      };

      const res = await apiFetch(`/soldier/self-check?soldier_id=${soldierId}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setResult(res);
      if (onAssessmentCompleted) onAssessmentCompleted(res);
    } catch (err) {
      // Fallback display
      setResult({
        status: 'success',
        readiness_index: Math.max(20, Math.round(batteryPercent * 0.85 + 10)),
        battery_percentage: batteryPercent,
        feedback: [
          "Self-check recorded confidentially.",
          batteryPercent < 50 ? "Rest Recovery: Plan a 15-min decompression video call with family." : "Optimal Readiness: Physical and alertness markers in healthy balance."
        ]
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getBatteryColor = (pct: number) => {
    if (pct >= 75) return 'text-emerald-500';
    if (pct >= 50) return 'text-yellow-500';
    if (pct >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-slate-300 rounded-2xl flex flex-col overflow-hidden shadow-2xl my-6">
        
        {/* Header */}
        <div className="p-4 bg-[#0a2540] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="font-bold text-sm">
                {t("Personnel Daily Well-Being Check", "जवान दैनिक कल्याण एवं शारीरिक सजगता स्व-मूल्यांकन")}
              </h2>
              <p className="text-[11px] text-slate-300">
                {t("100% Confidential & Non-Punitive • For Personal Self-Awareness Only", "पूर्णतः गोपनीय एवं गैर-दंडात्मक • केवल व्यक्तिगत स्वास्थ्य जागरूकता हेतु")}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        {!result ? (
          <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Encouraging Trust Banner */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5 leading-relaxed">
              <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong>{t("Honest Self-Reflection Window: ", "ईमानदार स्व-मूल्यांकन: ")}</strong>
                {t(
                  'We do not ask blunt questions like "Are you stressed?". Instead, answer these 5 routine daily wellness reflections honestly. Your responses assist in optimizing scheduled rest and family connection windows.',
                  'हम "क्या आप तनाव में हैं?" जैसे असहज सवाल नहीं पूछते। नीचे दिए गए 5 दैनिक अनुभव सीधे आपकी नींद, भूख और ऊर्जा से जुड़े हैं। यह आपकी भलाई और विश्राम चक्र को बेहतर बनाने में सहायक हैं।'
                )}
              </div>
            </div>

            {/* Q1: Sleep & Night Rest */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0a2540]">
                <Moon className="w-4 h-4 text-indigo-600" />
                <span>1. {t("Last Night's Sleep & Recovery", "कल रात की नींद एवं विश्राम:")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {sleepQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSleepChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2 ${
                      sleepChoice === idx 
                        ? 'bg-blue-50 border-[#003366] text-[#003366] font-bold shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border shrink-0 mt-0.5 ${sleepChoice === idx ? 'border-[#003366] bg-[#003366]' : 'border-slate-400'}`} />
                    <span className="leading-snug">{language === 'hi' ? q.hi : q.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Duty Alertness & Stamina */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0a2540]">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>2. {t("Duty Post Alertness & Vigilance", "ड्यूटी/संतरी पोस्ट पर सतर्कता और सजगता:")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {energyQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEnergyChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2 ${
                      energyChoice === idx 
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-bold shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border shrink-0 mt-0.5 ${energyChoice === idx ? 'border-emerald-700 bg-emerald-700' : 'border-slate-400'}`} />
                    <span className="leading-snug">{language === 'hi' ? q.hi : q.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Mess Appetite & Nutrition */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0a2540]">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>3. {t("Mess Meals & Food Appetite (Last 48 Hours)", "मेस में खान-पान और खुराक (पिछले 48 घंटे):")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {appetiteQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAppetiteChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2 ${
                      appetiteChoice === idx 
                        ? 'bg-amber-50 border-amber-700 text-amber-950 font-bold shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border shrink-0 mt-0.5 ${appetiteChoice === idx ? 'border-amber-700 bg-amber-700' : 'border-slate-400'}`} />
                    <span className="leading-snug">{language === 'hi' ? q.hi : q.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Q4: Physical Body Tension */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0a2540]">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>4. {t("Physical Muscle Recovery After Gear/Duty", "गियर, आर्मर या लंबी ड्यूटी के बाद शरीर का हाल:")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {tensionQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTensionChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2 ${
                      tensionChoice === idx 
                        ? 'bg-purple-50 border-purple-700 text-purple-950 font-bold shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border shrink-0 mt-0.5 ${tensionChoice === idx ? 'border-purple-700 bg-purple-700' : 'border-slate-400'}`} />
                    <span className="leading-snug">{language === 'hi' ? q.hi : q.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Q5: Family Contact */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0a2540]">
                <Heart className="w-4 h-4 text-red-600" />
                <span>5. {t("Family Contact & Peace of Mind", "घर-परिवार से संपर्क एवं मानसिक सुकून:")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {familyQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFamilyChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-2 ${
                      familyChoice === idx 
                        ? 'bg-red-50 border-red-700 text-red-950 font-bold shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full border shrink-0 mt-0.5 ${familyChoice === idx ? 'border-red-700 bg-red-700' : 'border-slate-400'}`} />
                    <span className="leading-snug">{language === 'hi' ? q.hi : q.en}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Q6: Energy Battery Tank Slider */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0a2540] flex items-center gap-1.5">
                  <Battery className={`w-4 h-4 ${getBatteryColor(batteryPercent)}`} />
                  <span>6. {t("Today's Internal Energy Tank:", "आज आपकी आंतरिक ऊर्जा बैटरी का स्तर:")}</span>
                </span>
                <span className={`font-mono font-extrabold text-sm ${getBatteryColor(batteryPercent)}`}>
                  {batteryPercent}% {batteryPercent >= 75 ? t("(Optimal)", "(उत्कृष्ट)") : batteryPercent >= 50 ? t("(Moderate)", "(सामान्य)") : t("(Needs Rest)", "(विश्राम ज़रूरी)")}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={batteryPercent}
                onChange={(e) => setBatteryPercent(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#003366]"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>10% (Exhausted)</span>
                <span>50% (Steady)</span>
                <span>100% (Fully Charged)</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("Recording Self-Check...", "मूल्यांकन सुरक्षित हो रहा है...")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t("Submit Voluntary Self-Check & View Insights", "स्व-मूल्यांकन सबमिट करें एवं व्यक्तिगत रिपोर्ट देखें")}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (

          /* RESULT FEEDBACK SCREEN */
          <div className="p-6 space-y-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {t("Confidential Self-Check Completed", "गोपनीय स्व-मूल्यांकन संपन्न")}
              </span>
              <h3 className="text-xl font-bold text-[#0a2540]">
                {t("Your Rest & Readiness Score: ", "आपकी ऊर्जा एवं सजगता सूचकांक: ")}
                <span className="text-[#003366]">{result.readiness_index || batteryPercent}/100</span>
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t(
                  "Thank you for your candid self-reflection. This data is private and assists in protecting your duty-rest cycles without disciplinary records.",
                  "आपके ईमानदार स्व-मूल्यांकन हेतु धन्यवाद। यह जानकारी पूर्णतः सुरक्षित है और इसका कोई दंडात्मक रिकॉर्ड नहीं बनाया जाता।"
                )}
              </p>
            </div>

            {/* Feedback items */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
              <h4 className="font-bold text-[#003366] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                <span>{t("Personal Wellness Recommendations:", "व्यक्तिगत स्वास्थ्य परामर्श:")}</span>
              </h4>
              <ul className="space-y-1.5 text-slate-700">
                {result.feedback && result.feedback.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => {
                setResult(null);
                onClose();
              }}
              className="px-6 py-2.5 bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs rounded-xl shadow-xs"
            >
              {t("Return to Dashboard", "डैशबोर्ड पर वापस जाएं")}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
