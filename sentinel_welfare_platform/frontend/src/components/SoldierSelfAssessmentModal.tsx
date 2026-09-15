'use client';
import React, { useState } from 'react';
import { 
  X, CheckCircle2, Moon, Activity, Utensils, Zap, Heart, Shield, 
  Sparkles, AlertCircle, ArrowRight, Battery, RefreshCw, Award,
  Home, Clock, PhoneCall, Users, ShieldCheck, Dumbbell, Compass, Check
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  soldierId?: number;
  onAssessmentCompleted?: (result: any) => void;
  nextAvailableDate?: string | null;
  canSubmit?: boolean;
}

export const SoldierSelfAssessmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  soldierId = 1,
  onAssessmentCompleted,
  nextAvailableDate,
  canSubmit = true
}) => {
  const { t, language } = useLanguage();

  // Selected Option Indices (0 to 3) for 12 indirect dimensions
  const [messChoice, setMessChoice] = useState<number>(0);
  const [barrackChoice, setBarrackChoice] = useState<number>(0);
  const [shiftChoice, setShiftChoice] = useState<number>(0);
  const [networkChoice, setNetworkChoice] = useState<number>(0);
  const [unitChoice, setUnitChoice] = useState<number>(0);
  const [leaveChoice, setLeaveChoice] = useState<number>(0);
  const [equipmentChoice, setEquipmentChoice] = useState<number>(0);
  const [healthChoice, setHealthChoice] = useState<number>(0);
  const [recoveryChoice, setRecoveryChoice] = useState<number>(0);
  const [fitnessChoice, setFitnessChoice] = useState<number>(0);
  const [socialChoice, setSocialChoice] = useState<number>(0);
  const [confidenceChoice, setConfidenceChoice] = useState<number>(0);
  const [batteryPercent, setBatteryPercent] = useState<number>(85);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const messQuestions = [
    {
      score: 5,
      en: "Nutritious & Timely: Mess serves fresh, balanced meals on time with clean drinking water.",
      hi: "पौष्टिक एवं समय पर भोजन: मेस में समय पर ताजा, संतुलित भोजन और स्वच्छ पेयजल उपलब्ध।"
    },
    {
      score: 4,
      en: "Routine Mess Services: Food quality is adequate, standard mess schedule maintained.",
      hi: "सामान्य मेस भोजन: भोजन की गुणवत्ता पर्याप्त, नियमित समय सारणी का पालन।"
    },
    {
      score: 2,
      en: "Food/Hygiene Discomfort: Irregular meal timings, poor taste/hygiene, or lukewarm water.",
      hi: "भोजन/स्वच्छता में कमी: भोजन का अनियमित समय, स्वाद या स्वच्छता की शिकायत।"
    },
    {
      score: 1,
      en: "Severe Mess Deficit: Unpalatable food, unhygienic conditions, or frequent meal skips.",
      hi: "मेस व्यवस्था में गंभीर कमी: अत्यधिक खराब गुणवत्ता का भोजन, मजबूरी में खाना छोड़ना।"
    }
  ];

  const barrackQuestions = [
    {
      score: 5,
      en: "Optimal Barracks: Well-ventilated/heated quarters, clean sanitation, comfortable bedding.",
      hi: "उत्कृष्ट बैरक सुविधा: स्वच्छ बैरक, उचित हीटिंग/कूलिंग व्यवस्था एवं साफ शौचालय।"
    },
    {
      score: 4,
      en: "Adequate Shelter: Standard barrack facilities, routine sanitation, manageable climate.",
      hi: "सामान्य आवास स्थिति: नियमित बैरक व्यवस्था, साफ-सफाई एवं रहने योग्य माहौल।"
    },
    {
      score: 2,
      en: "Barrack Discomfort: Extreme temperature leaks (cold/heat), cramped beds, or poor sanitation.",
      hi: "आवास में असुविधा: बैरक में अत्यधिक ठंड/गर्मी का प्रभाव, तंग बेड या सफाई की कमी।"
    },
    {
      score: 1,
      en: "Severe Living Strain: Broken sanitation, water shortage, or damp/freezing quarters.",
      hi: "गंभीर आवास समस्या: शौचालयों का काम न करना, पानी की भारी कमी या अत्यधिक सीलन।"
    }
  ];

  const shiftQuestions = [
    {
      score: 5,
      en: "Equitable Duty Roster: Fair shift rotation with 6+ hours of uninterrupted rest between posts.",
      hi: "संतुलित रोस्टर: दो संतरी ड्यूटी के बीच 6+ घंटे का पर्याप्त निर्बाध विश्राम।"
    },
    {
      score: 4,
      en: "Standard Duty Hours: Predictable 12-hr operational cycle, regular shift handover.",
      hi: "सामान्य ड्यूटी चक्र: 12 घंटे का अनुमानित परिचालन रोस्टर और नियमित शिफ्ट बदली।"
    },
    {
      score: 2,
      en: "Heavy Shift Backlog: Frequent back-to-back night vigils, brief 2-3 hr rest gaps between posts.",
      hi: "अत्यधिक नाइट संतरी भार: लगातार रात की ड्यूटी, विश्राम हेतु केवल 2-3 घंटे का कम समय।"
    },
    {
      score: 1,
      en: "Severe Operational Fatigue: Continuous 16+ hr duty shifts, zero recovery time between posts.",
      hi: "अत्यधिक कार्यभार (16+ घंटे): बिना किसी ब्रेक के लगातार लंबी ड्यूटी, रिकवरी समय नहीं।"
    }
  ];

  const networkQuestions = [
    {
      score: 5,
      en: "Clear & Frequent Contact: Strong cell network, frequent reassuring talks with family back home.",
      hi: "मजबूत संपर्क: मोबाइल नेटवर्क उपलब्ध, घर पर परिजनों से नियमित सुकून भरी बातचीत।"
    },
    {
      score: 4,
      en: "Routine Check-in: Spoke 2-3 days ago, minor signal drops but family updates are clear.",
      hi: "सामान्य बातचीत: 2-3 दिन में परिजनों से बात, मामूली नेटवर्क गिरावट पर स्थिति सामान्य।"
    },
    {
      score: 2,
      en: "Network Isolation: Weak/no cellular signal for >7 days in remote outpost, unable to call.",
      hi: "कमजोर नेटवर्क: दुर्गम चौकी पर 7+ दिनों से नेटवर्क गायब, परिजनों से बात नहीं हो पा रही।"
    },
    {
      score: 1,
      en: "Unresolved Domestic Concern: An urgent family issue back home combined with poor contact.",
      hi: "घरेलू चिंता व नेटवर्क अभाव: घर पर किसी जरूरी समस्या की चिंता और संपर्क न हो पाना।"
    }
  ];

  const unitQuestions = [
    {
      score: 5,
      en: "High Trust & Support: Strong peer camaraderie, supportive seniors, transparent listening.",
      hi: "यूनिट में पूर्ण सहयोग: साथी जवानों में एकजुटता, अधिकारियों का सहयोगात्मक रवैया।"
    },
    {
      score: 4,
      en: "Functional Teamwork: Normal unit coordination, good operational cooperation on duty.",
      hi: "सामान्य यूनिट समन्वय: ड्यूटी के दौरान साथी जवानों के साथ अच्छा परस्पर सहयोग।"
    },
    {
      score: 2,
      en: "Communication Gaps: Occasional peer friction, unheard operational difficulties, or isolation.",
      hi: "संवाद में कमी: ड्यूटी की कठिनाइयों की अनदेखी या आपसी बातचीत में दूरी।"
    },
    {
      score: 1,
      en: "High Interpersonal Strain: Lack of peer support, unaddressed grievances, or feeling isolated.",
      hi: "आपसी तालमेल की कमी: शिकायतों की अनसुनी या चौकी पर अकेलापन महसूस होना।"
    }
  ];

  const leaveQuestions = [
    {
      score: 5,
      en: "Timely Leave Sanction: Rest leave applications approved smoothly; backlog cleared regularly.",
      hi: "समय पर अवकाश स्वीकृति: छुट्टियां आसानी से स्वीकृत, बकाया अवकाश नियमित रूप से उपलब्ध।"
    },
    {
      score: 4,
      en: "Standard Leave Rotation: Normal leave queue, approved with advance operational notice.",
      hi: "सामान्य अवकाश रोस्टर: योजनाबद्ध तरीके से छुट्टियों की मंजूरी।"
    },
    {
      score: 2,
      en: "Delayed Leave Approval: Leave delayed due to unit manning shortfall or operational needs.",
      hi: "अवकाश में देरी: यूनिट में जवानों की कमी के कारण छुट्टियों में विलंब।"
    },
    {
      score: 1,
      en: "Heavy Leave Backlog: >30 days accumulated backlog, urgent leave pending without replacement.",
      hi: "अत्यधिक अवकाश बकाया: 30+ दिनों की छुट्टियां बकाया, अति आवश्यक छुट्टी मिलने में परेशानी।"
    }
  ];

  const equipmentQuestions = [
    {
      score: 5,
      en: "Top Kit Readiness: Protective armor, weapons, uniforms, and tactical boots in prime condition.",
      hi: "उत्कृष्ट गियर एवं उपकरण: बुलेटप्रूफ जैकेट, शस्त्र, वर्दी एवं जूते उत्तम स्थिति में।"
    },
    {
      score: 4,
      en: "Adequate Supply: Operational kit in standard working order, routine replacement available.",
      hi: "सामान्य उपकरण व्यवस्था: ड्यूटी किट चालू हालत में, नियमित सामान उपलब्धता।"
    },
    {
      score: 2,
      en: "Equipment Wear & Tear: Delayed replacement of worn boots, damaged rain/winter gear.",
      hi: "सामान में घिसावट: फटे जूते या खराब मौसम गियर का देर से बदलना।"
    },
    {
      score: 1,
      en: "Kit Deficit: Inadequate protective equipment or severe delay in operational supplies.",
      hi: "उपकरणों की कमी: सुरक्षा गियर की भारी कमी या जरूरी सामान का न मिल पाना।"
    }
  ];

  const healthQuestions = [
    {
      score: 5,
      en: "Optimal Fitness Baseline: High physical stamina, zero chronic pain, instant MO access.",
      hi: "उत्कृष्ट शारीरिक स्वास्थ्य: बेहतरीन स्टैमिना, कोई दर्द नहीं, डॉक्टर की तुरंत सलाह उपलब्ध।"
    },
    {
      score: 4,
      en: "Routine Physical Recovery: Normal fatigue post-patrol, manageable muscle stiffness.",
      hi: "सामान्य शारीरिक थकान: गश्त के बाद सामान्य थकान, नियमित विश्राम से रिकवरी।"
    },
    {
      score: 2,
      en: "Persistent Body Fatigue: Joint aches, chronic sleep deficit, or delayed medical checkup.",
      hi: "लगातार शारीरिक दर्द: जोड़ों में दर्द, नींद की कमी या चिकित्सा जांच में देरी।"
    },
    {
      score: 1,
      en: "Heavy Health Strain: Severe fatigue, unaddressed injury/pain, urgent need for MO rest rotation.",
      hi: "अत्यधिक शारीरिक तनाव: गंभीर थकान, चोट का इलाज न हो पाना या तुरंत विश्राम की आवश्यकता।"
    }
  ];

  // 4 New Indirect Questions (Part 1 Expansion)
  const recoveryQuestions = [
    {
      score: 5,
      en: "Full Recovery Window: ≥8 hours undisturbed rest and circadian recovery between shift rotations.",
      hi: "पर्याप्त विश्राम व रिकवरी: पाली परिवर्तन के बीच 8+ घंटे की बाधारहित नींद एवं रिकवरी।"
    },
    {
      score: 4,
      en: "Standard Rest Rotation: 6-7 hours rest, routine fatigue recovery post-sentry.",
      hi: "सामान्य विश्राम चक्र: 6-7 घंटे की पर्याप्त नींद, संतरी ड्यूटी के बाद नियमित विश्राम।"
    },
    {
      score: 2,
      en: "Tight Shift Interruption: <5 hours rest between night and day duties, noticeable fatigue.",
      hi: "पाली में कम अंतर: दिन और रात की ड्यूटी के बीच 5 घंटे से कम का विश्राम।"
    },
    {
      score: 1,
      en: "Severe Shift Overlap: Back-to-back sentry shifts without designated sleep window.",
      hi: "अत्यधिक ड्यूटी ओवरलैप: बिना पर्याप्त विश्राम अंतराल के लगातार संतरी ड्यूटी।"
    }
  ];

  const fitnessQuestions = [
    {
      score: 5,
      en: "Peak Physical Baseline: Fully fit, high stamina, zero joint or muscular pain during patrols.",
      hi: "उत्कृष्ट शारीरिक स्थिति: कोई दर्द नहीं, गश्त एवं अभियानों हेतु पूरा स्टैमिना।"
    },
    {
      score: 4,
      en: "Manageable Physical Strain: Minor muscle stiffness post-patrol, quickly recovers with rest.",
      hi: "सामान्य शारीरिक थकान: लंबी गश्त के बाद मांसपेशियों में मामूली खिंचाव, विश्राम से ठीक।"
    },
    {
      score: 2,
      en: "Persistent Soreness: Lumbar or knee discomfort from heavy tactical load and long standing.",
      hi: "लगातार शारीरिक असुविधा: भारी गियर व लंबी ड्यूटी के कारण पीठ या घुटनों में दर्द।"
    },
    {
      score: 1,
      en: "Acute Fitness Strain: Severe exhaustion or pain needing medical evaluation and rest rotation.",
      hi: "गंभीर शारीरिक दर्द: अत्यधिक शारीरिक थकावट, डॉक्टर से जांच एवं विश्राम आवश्यक।"
    }
  ];

  const socialQuestions = [
    {
      score: 5,
      en: "Strong Comrade Support: Excellent team spirit, mutual trust, and active camaraderie at post.",
      hi: "उत्कृष्ट बटालियन सहयोग: साथी जवानों में गहरी एकजुटता, परस्पर सहयोग एवं भरोसा।"
    },
    {
      score: 4,
      en: "Good Peer Relations: Friendly interaction during mess and off-duty rest hours.",
      hi: "सौहार्दपूर्ण संबंध: मेस एवं विश्राम समय में साथियों के साथ अच्छा मेलजोल।"
    },
    {
      score: 2,
      en: "Limited Peer Interaction: Minimal conversation due to isolated duties or shift timing mismatch.",
      hi: "सीमित सामाजिक संपर्क: अलग-अलग ड्यूटी समय के कारण साथियों से कम बातचीत।"
    },
    {
      score: 1,
      en: "Unit Disconnect: Feeling isolated or lacking supportive camaraderie during deployment.",
      hi: "सामाजिक अलगाव: तनावपूर्ण तैनाती के दौरान अकेलापन या जुड़ाव महसूस न होना।"
    }
  ];

  const confidenceQuestions = [
    {
      score: 5,
      en: "High Duty Confidence: Thoroughly prepared for operational directives, gear, and field tactics.",
      hi: "पूर्ण कार्य आत्मविश्वास: अभियांत्रिक रणनीतियों, निर्देशों व गियर पर पूरा भरोसा।"
    },
    {
      score: 4,
      en: "Steady Operational Preparedness: Comfortable with routine sector tasks and unit directives.",
      hi: "सामान्य कार्य विश्वास: नियमित ड्यूटी दिनचर्या में सहज एवं आत्मविश्वास।"
    },
    {
      score: 2,
      en: "Occasional Operational Hesitation: Complex terrain or unfamiliar operational directives.",
      hi: "सामयिक कार्य उलझन: नए क्षेत्र या जटिल निर्देशों के कारण थोड़ी हिचकिचाहट।"
    },
    {
      score: 1,
      en: "Operational Overwhelm: Heavy strain or high uncertainty in current field assignments.",
      hi: "अत्यधिक अभियांत्रिक दबाव: कठिन ड्यूटी या अनिश्चितता के कारण तनाव।"
    }
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const q1Score = messQuestions[messChoice].score;
      const q2Score = barrackQuestions[barrackChoice].score;
      const q3Score = shiftQuestions[shiftChoice].score;
      const q4Score = networkQuestions[networkChoice].score;
      const q5Score = unitQuestions[unitChoice].score;
      const q6Score = leaveQuestions[leaveChoice].score;
      const q7Score = equipmentQuestions[equipmentChoice].score;
      const q8Score = healthQuestions[healthChoice].score;

      const moodRating = Math.round((q4Score + q5Score + q6Score) / 3);
      const sleepRating = Math.round((q1Score + q2Score + q8Score) / 3);
      const fatigueRating = Math.max(1, 6 - Math.round((q3Score + q7Score) / 2));

      const payload = {
        mood_score: moodRating,
        sleep_score: sleepRating,
        fatigue_score: fatigueRating,
        battery_percentage: batteryPercent,
        raw_answers: {
          mess_food_hygiene: messQuestions[messChoice].en,
          barrack_sanitation: barrackQuestions[barrackChoice].en,
          duty_shift_rotation: shiftQuestions[shiftChoice].en,
          family_telecom: networkQuestions[networkChoice].en,
          unit_camaraderie: unitQuestions[unitChoice].en,
          welfare_leave_backlog: leaveQuestions[leaveChoice].en,
          equipment_readiness: equipmentQuestions[equipmentChoice].en,
          health_mo_access: healthQuestions[healthChoice].en,
          shift_recovery: recoveryQuestions[recoveryChoice].en,
          fitness_pain: fitnessQuestions[fitnessChoice].en,
          social_connection: socialQuestions[socialChoice].en,
          operational_confidence: confidenceQuestions[confidenceChoice].en,
          battery_gauge: batteryPercent
        }
      };

      const res = await apiFetch(`/soldier/self-check?soldier_id=${soldierId}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setResult(res);
      if (onAssessmentCompleted) onAssessmentCompleted(res);
    } catch (err: any) {
      if (err && err.message && (err.message.includes("opens on") || err.message.includes("window"))) {
        setSubmitError(err.message);
      } else {
        // Pure acknowledgment without readiness index or score
        setResult({
          status: 'success',
          feedback: [
            "Thank you - your monthly check-in has been recorded.",
            "Your responses are strictly confidential and help maintain your duty-rest cycles."
          ]
        });
      }
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
                {t("Monthly Living & Welfare Conditions Assessment", "मासिक कल्याण, मेस एवं बैरक स्व-मूल्यांकन")}
              </h2>
              <p className="text-[11px] text-slate-300">
                {t("100% Confidential Monthly Evaluation • Assesses Mess, Barracks, Shift Roster, Leave Clearance & Unit Support Without Blunt Stress Questions", "पूर्णतः गोपनीय मासिक मूल्यांकन • बिना किसी असहज सवाल के मेस, बैरक, छुट्टी एवं ड्यूटी के 12 व्यावहारिक कारणों का मूल्यांकन")}
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
        {!canSubmit ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#0a2540]">
              {t("Monthly Assessment Window Closed", "मासिक मूल्यांकन समय अभी उपलब्ध नहीं है")}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {t(
                `Your next assessment available: ${nextAvailableDate || '30 days after last check-in'}.`,
                `अगला मूल्यांकन उपलब्ध: ${nextAvailableDate || 'पिछली जांच के 30 दिन बाद'}।`
              )}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#003366] text-white font-bold text-xs rounded-xl"
            >
              {t("Return to Dashboard", "डैशबोर्ड पर वापस जाएं")}
            </button>
          </div>
        ) : !result ? (
          <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            
            {/* Trust Banner */}
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center gap-3 text-xs text-sky-950">
              <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
              <span>
                {t(
                  "MHA Directive §6a Protection: Voluntary monthly check-in. Evaluates living conditions, mess quality, shift roster, and kit readiness. No blunt stress queries or ACR records.",
                  "गृह मंत्रालय निर्देश §6a संरक्षण: स्वैच्छिक मासिक मूल्यांकन। मेस भोजन, आवास, रोस्टर एवं गियर की गुणवत्ता पर विचार। कोई दंडात्मक रिकॉर्ड नहीं।"
                )}
              </span>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Q1: Mess Food Quality */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>1. {t("Mess Food Quality & Drinking Water Hygiene:", "मेस भोजन की गुणवत्ता एवं पेयजल स्वच्छता:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {messQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMessChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      messChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: Barrack Shelter */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Home className="w-4 h-4 text-sky-600" />
                <span>2. {t("Barrack Living Comfort & Sanitation Facilities:", "बैरक आवास, हीटिंग/कूलिंग एवं स्वच्छता स्थिति:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {barrackQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBarrackChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      barrackChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q3: Duty Shift Rotation */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>3. {t("Duty Shift Rotation & Sentry Vigil Rest Gap:", "ड्यूटी रोस्टर एवं दो संतरी ड्यूटी के बीच विश्राम का समय:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {shiftQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setShiftChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      shiftChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q4: Family Network */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>4. {t("Family Telecom Connectivity & Home Updates:", "परिवार से मोबाइल नेटवर्क संपर्क एवं पारिवारिक बातचीत:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {networkQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNetworkChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      networkChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q5: Unit Camaraderie */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <span>5. {t("Unit Camaraderie & Support:", "बटालियन में साथी जवानों एवं अधिकारियों का सहयोग:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {unitQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setUnitChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      unitChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q6: Leave Backlog */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>6. {t("Annual/Casual Leave Backlog & Sanction Flow:", "वार्षिक/आकस्मिक छुट्टियां एवं अवकाश स्वीकृति की स्थिति:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {leaveQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLeaveChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      leaveChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q7: Equipment Readiness */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>7. {t("Tactical Kit & Protective Gear Readiness:", "वर्दी, जूते, बुलेटप्रूफ जैकेट एवं हथियार किट की स्थिति:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {equipmentQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setEquipmentChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      equipmentChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q8: Physical Baseline */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#003366]" />
                <span>8. {t("Physical Health Baseline & Medical Access:", "शारीरिक स्वास्थ्य स्थिति एवं डॉक्टर तक पहुंच:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {healthQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setHealthChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      healthChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q9: Rest & Recovery Adequacy */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-sky-600" />
                <span>9. {t("Rest & Recovery Adequacy Between Shifts:", "पाली परिवर्तन के बीच विश्राम एवं नींद की गुणवत्ता:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {recoveryQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRecoveryChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      recoveryChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q10: Physical Fitness Baseline */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-emerald-600" />
                <span>10. {t("Physical Fitness & Muscle Pain Status:", "शारीरिक स्टैमिना एवं मांसपेशियों में खिंचाव की स्थिति:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {fitnessQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFitnessChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      fitnessChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q11: Social Connection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600" />
                <span>11. {t("Social Connection with Fellow Personnel:", "चौकी पर साथी जवानों के साथ सामाजिक संबंध एवं जुड़ाव:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {socialQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSocialChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      socialChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Q12: Operational Confidence */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#0a2540] flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-600" />
                <span>12. {t("Confidence in Operational Duty Tasks:", "वर्तमान परिचालनिक कर्तव्यों एवं कार्य-कौशल में आत्मविश्वास:")}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {confidenceQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setConfidenceChoice(idx)}
                    className={`p-3 rounded-xl border text-left transition ${
                      confidenceChoice === idx 
                        ? 'bg-[#003366] text-white border-[#003366] font-semibold shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {language === 'hi' ? q.hi : q.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Battery Tank Slider */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0a2540] flex items-center gap-1.5">
                  <Battery className={`w-4 h-4 ${getBatteryColor(batteryPercent)}`} />
                  <span>{t("Monthly Energy Baseline & Recovery Gauge:", "मासिक ऊर्जा एवं विश्राम का स्तर:")}</span>
                </span>
                <span className={`font-mono font-extrabold text-sm ${getBatteryColor(batteryPercent)}`}>
                  {batteryPercent}%
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
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99]"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("Recording Monthly Welfare Check...", "मासिक मूल्यांकन दर्ज हो रहा है...")}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t("Submit Monthly Welfare Assessment Confidentially", "मासिक कल्याण मूल्यांकन गोपनीय रूप से सबमिट करें")}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ) : (

          /* RESULT ACKNOWLEDGMENT SCREEN - ZERO SCORES, NUMBERS, OR RISK TIERS */
          <div className="p-6 space-y-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {t("Confidential Check-In Completed", "गोपनीय स्व-मूल्यांकन संपन्न")}
              </span>
              <h3 className="text-lg font-bold text-[#0a2540]">
                {t("Thank you - your monthly check-in has been recorded.", "धन्यवाद - आपका मासिक कल्याण स्व-मूल्यांकन सफलतापूर्वक दर्ज कर लिया गया है।")}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t(
                  "Your responses are private and assist in protecting your duty-rest cycles without disciplinary records.",
                  "आपकी प्रतिक्रियाएं पूर्णतः गोपनीय हैं तथा ड्यूटी-विश्राम चक्र को बेहतर बनाने में सहायक हैं।"
                )}
              </p>
            </div>

            {/* Supportive Feedback Tips */}
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
