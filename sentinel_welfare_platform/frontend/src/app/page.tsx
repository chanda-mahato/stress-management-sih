'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Shield, User, HeartHandshake, Stethoscope, ChevronRight, Lock, 
  CheckCircle2, AlertTriangle, PhoneCall, Award, Heart, Building,
  Compass, Mountain, Plane, Anchor, ShieldCheck, Flag, Users, Info,
  Video, Phone, ArrowRight, QrCode
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function MhaPortalLanding() {
  const { t, language } = useLanguage();
  const [activePhoto, setActivePhoto] = useState<string>('snow');

  const photos = [
    {
      id: 'snow',
      titleEn: 'High-Altitude & Harsh Border Terrains',
      titleHi: 'उच्च हिमालयी एवं विषम सीमावर्ती चौकियां',
      subtitleEn: 'Indo-Tibetan Border Police (ITBP) & BSF Outposts',
      subtitleHi: 'भारत-तिब्बत सीमा पुलिस (ITBP) एवं सीमा सुरक्षा बल (BSF)',
      src: '/images/image1.png',
      descEn: 'Paramilitary jawans maintaining constant vigil across high-altitude Himalayan sectors and extreme climate posts in sub-zero conditions.',
      descHi: 'माइनस 40 डिग्री तापमान और बर्फीले तूफानों के बीच हिमालय की दुर्गम चौकियों पर चौबीसों घंटे देश की सीमाओं की अटूट रक्षा करते जवान।'
    },
    {
      id: 'clinical',
      titleEn: 'Medical Officer Clinical Care & Counseling',
      titleHi: 'चिकित्सा अधिकारी नैदानिक देखभाल एवं परामर्श',
      subtitleEn: 'Unit Medical Officer (MO) Compassionate Consultation',
      subtitleHi: 'बटालियन चिकित्सा अधिकारी द्वारा मानवीय एवं गोपनीय स्वास्थ्य परामर्श',
      src: '/images/image2.png',
      descEn: 'Designated Medical Officers providing clinical stress mitigation, rest-rotation scheduling, and psychological health care directly to personnel.',
      descHi: 'विशेष चिकित्सा अधिकारियों द्वारा जवानों के मानसिक तनाव का शीघ्र निवारण, विश्राम-रोटेशन और सहानुभूतिपूर्ण स्वास्थ्य सेवाएं।'
    },
    {
      id: 'family',
      titleEn: 'Family Welfare & Scheduled Connectivity',
      titleHi: 'परिवार कल्याण एवं निर्धारित वीडियो संपर्क',
      subtitleEn: 'Rest-Time Secure Family Decompression Calls',
      subtitleHi: 'विश्राम समय में परिवार से सुरक्षित 1:1 वीडियो संवाद',
      src: '/images/image3.png',
      descEn: 'Scheduled 1:1 video de-escalation calls allowing personnel in remote sectors to connect with their families during verified rest hours.',
      descHi: 'दूरदराज के सीमावर्ती क्षेत्रों में तैनात जवानों के लिए निर्धारित विश्राम समय में अपने परिवार से सुरक्षित वीडियो कॉल द्वारा तनाव मुक्ति।'
    },
    {
      id: 'tactical',
      titleEn: 'Internal Security & Operational Readiness',
      titleHi: 'आंतरिक सुरक्षा एवं अभियांत्रिक तत्परता',
      subtitleEn: 'Central Reserve Police Force (CRPF) & Assam Rifles',
      subtitleHi: 'केंद्रीय रिजर्व पुलिस बल (CRPF) एवं असम राइफल्स',
      src: '/images/image4.png',
      descEn: 'Troops deployed for internal security, counter-insurgency, anti-Naxal operations, and maintaining peace across the nation.',
      descHi: 'नक्सल प्रभावित क्षेत्रों, आतंकवाद विरोधी अभियानों और देश के आंतरिक अमन-चैन को अक्षुण्ण रखने हेतु तैनात वीर जवान।'
    }
  ];

  const currentPhoto = photos.find(p => p.id === activePhoto) || photos[0];

  const forces = [
    {
      code: 'CRPF',
      nameEn: 'Central Reserve Police Force',
      nameHi: 'केंद्रीय रिजर्व पुलिस बल',
      mottoEn: 'Service and Loyalty',
      mottoHi: 'सेवा और निष्ठा',
      icon: Shield,
      color: 'border-l-red-600',
      badgeBg: 'bg-red-50 text-red-800 border-red-200',
      descEn: 'India’s premier internal security force with 246+ battalions. Spearheads anti-Naxal operations in Left-Wing Extremism (LWE) regions, counter-insurgency in Jammu & Kashmir, riot control (RAF), and elite jungle warfare strike units (CoBRA).',
      descHi: 'भारत का प्रमुख आंतरिक सुरक्षा बल (246+ बटालियन)। वामपंथी उग्रवाद (नक्सल) क्षेत्रों में निर्णायक अभियान, जम्मू-कश्मीर में आतंकवाद विरोधी कार्रवाई, दंगा नियंत्रण (RAF) और कोबरा (CoBRA) विशेष कमांडो यूनिट।'
    },
    {
      code: 'BSF',
      nameEn: 'Border Security Force',
      nameHi: 'सीमा सुरक्षा बल',
      mottoEn: 'Duty Unto Death',
      mottoHi: 'जीवन पर्यन्त कर्तव्य',
      icon: Compass,
      color: 'border-l-amber-600',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      descEn: 'The nation’s "First Line of Defence", guarding 6,386 km of international borders with Pakistan and Bangladesh. Operates under extreme terrain: Thar Desert heat (50°C+), Rann of Kutch swamps, icy LoC terrain, and riverine Sunderbans.',
      descHi: 'देश की "प्रथम रक्षा पंक्ति", जो पाकिस्तान और बांग्लादेश के साथ 6,386 किमी अंतरराष्ट्रीय सीमाओं की रक्षा करती है। थार रेगिस्तान (50°C+), कच्छ के दलदल, बर्फीली नियंत्रण रेखा और सुंदरबन के जलक्षेत्रों में तैनात।'
    },
    {
      code: 'CISF',
      nameEn: 'Central Industrial Security Force',
      nameHi: 'केंद्रीय औद्योगिक सुरक्षा बल',
      mottoEn: 'Protection and Security',
      mottoHi: 'संरक्षण एवं सुरक्षा',
      icon: Building,
      color: 'border-l-blue-600',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
      descEn: 'Guards critical national infrastructure across India, including 66+ commercial airports, aerospace facilities (ISRO), nuclear power stations (BARC), Delhi Metro, major seaports, and industrial complexes.',
      descHi: 'देश के 66+ हवाई अड्डों, परमाणु ऊर्जा संयंत्रों (BARC), अंतरिक्ष अनुसंधान केंद्रों (ISRO), दिल्ली मेट्रो और प्रमुख बंदरगाहों सहित महत्वपूर्ण राष्ट्रीय प्रतिष्ठानों की अचूक सुरक्षा।'
    },
    {
      code: 'ITBP',
      nameEn: 'Indo-Tibetan Border Police',
      nameHi: 'भारत-तिब्बत सीमा पुलिस',
      mottoEn: 'Valour - Determination - Devotion',
      mottoHi: 'शौर्य - दृढ़ता - कर्म निष्ठा',
      icon: Mountain,
      color: 'border-l-sky-600',
      badgeBg: 'bg-sky-50 text-sky-800 border-sky-200',
      descEn: 'Elite mountain-trained force guarding 3,488 km of the Indo-China border (LAC) from Karakoram Pass in Ladakh to Arunachal Pradesh at extreme altitudes reaching 18,700 feet in -40°C arctic blizzard conditions.',
      descHi: 'लद्दाख के काराकोरम दर्रे से लेकर अरुणाचल प्रदेश तक 3,488 किमी भारत-चीन सीमा (LAC) पर 18,700 फीट की ऊंचाई और -40°C में तैनात "हिमवीर"।'
    },
    {
      code: 'SSB',
      nameEn: 'Sashastra Seema Bal',
      nameHi: 'सशस्त्र सीमा बल',
      mottoEn: 'Service, Security and Brotherhood',
      mottoHi: 'सेवा, सुरक्षा और बन्धुत्व',
      icon: Users,
      color: 'border-l-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      descEn: 'Guards India’s porous international borders with Nepal (1,751 km) and Bhutan (699 km). Prevents cross-border smuggling, trafficking, and unauthorized transit while carrying out extensive Civic Action Programs with border populations.',
      descHi: 'नेपाल (1,751 किमी) और भूटान (699 किमी) की मैत्रीपूर्ण अंतरराष्ट्रीय सीमाओं की सुरक्षा, तस्करी पर रोक और सीमावर्ती जनता के साथ व्यापक सामाजिक कल्याण कार्यक्रम।'
    },
    {
      code: 'AR',
      nameEn: 'Assam Rifles',
      nameHi: 'असम राइफल्स',
      mottoEn: 'Sentinels of the North East',
      mottoHi: 'पूर्वोत्तर के प्रहरी',
      icon: Flag,
      color: 'border-l-indigo-600',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      descEn: 'India’s oldest paramilitary force (raised in 1835). Safeguards the 1,643 km Indo-Myanmar border and maintains internal peace, counter-insurgency operations, and community development across the North-Eastern states.',
      descHi: 'भारत का सबसे प्राचीन अर्धसैनिक बल (स्थापना 1835)। भारत-म्यांमार सीमा (1,643 किमी) की सुरक्षा और पूर्वोत्तर राज्यों में शांति, सुरक्षा एवं विकास में अग्रणी भूमिका।'
    },
    {
      code: 'NSG',
      nameEn: 'National Security Guard',
      nameHi: 'राष्ट्रीय सुरक्षा गार्ड',
      mottoEn: 'Omnipresent Omnipotent Security',
      mottoHi: 'सर्वत्र सर्वोत्तम सुरक्षा',
      icon: Award,
      color: 'border-l-slate-800',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
      descEn: 'Federal contingency counter-terrorist commando force ("Black Cats"). Highly specialized in swift surgical anti-terrorist operations, hostage rescue, anti-hijacking, and neutralizing urban terror emergencies.',
      descHi: 'देश का शीर्ष आतंकवाद-रोधी कमांडो दस्ता ("ब्लैक कैट्स")। बंधक बचाव, विमान अपहरण-रोधी अभियानों और आपातकालीन आतंकी खतरों के त्वरित खात्मे हेतु विशेष प्रशिक्षित।'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      
      {/* 1. OFFICIAL ADVISORY TICKER */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-2 overflow-hidden">
          <span className="bg-amber-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shrink-0 uppercase tracking-wider">
            {t("Advisory / सूचना", "महत्वपूर्ण सूचना / Advisory")}
          </span>
          <p className="truncate text-xs font-medium">
            {t(
              "Ministry of Home Affairs Directive: Sentinel is a strictly supportive, non-punitive personnel welfare monitoring platform. All health evaluations route exclusively to designated Unit Medical Officers. National CAPF Mental Health Helpline: 14416.",
              "गृह मंत्रालय निर्देश: सेंटिनल पूर्णतः सहायक एवं गैर-दंडात्मक कार्मिक कल्याण मंच है। सभी स्वास्थ्य मूल्यांकन केवल अधिकृत बटालियन चिकित्सा अधिकारियों को भेजे जाते हैं। राष्ट्रीय मानसिक स्वास्थ्य हेल्पलाइन: 14416।"
            )}
          </p>
        </div>
      </div>

      {/* 2. HERO SECTION: MHA WELFARE INITIATIVE */}
      <section className="bg-white border-b border-slate-200 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Mission, Mandate & Context */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#003366] text-xs font-bold">
              <Shield className="w-4 h-4 text-[#ff9933]" />
              <span>{t("MINISTRY OF HOME AFFAIRS • GOVERNMENT OF INDIA", "गृह मंत्रालय | भारत सरकार")}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0a2540] tracking-tight leading-tight">
              {t(
                "Central Armed Police Forces (CAPF) Personnel Welfare & Early Stress Care Platform",
                "केंद्रीय सशस्त्र पुलिस बल (CAPF) कार्मिक कल्याण एवं प्रारंभिक तनाव प्रबंधन मंच"
              )}
            </h1>

            <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed">
              {t(
                "Dedicated national platform for physical, mental, and psychological welfare of brave personnel across CRPF, BSF, CISF, ITBP, SSB, AR, and NSG.",
                "सशस्त्र सीमा बल एवं केंद्रीय सशस्त्र पुलिस बलों (CRPF, BSF, CISF, ITBP, SSB, AR, NSG) के वीर जवानों के कल्याण, समग्र स्वास्थ्य एवं पारिवारिक सहयोग हेतु समर्पित राष्ट्रीय मंच।"
              )}
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#003366] uppercase tracking-wider">
                <Heart className="w-4 h-4 text-red-600" />
                <span>{t("Our Welfare Commitment", "हमारा कल्याणकारी संकल्प")}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {t(
                  "The Ministry of Home Affairs is dedicated to ensuring the physical, psychological, and social well-being of over 10 lakh paramilitary personnel serving in remote borders, high-altitude outposts, and internal security duties. Sentinel ensures early medical de-escalation, scheduled rest cycles, and family support with zero punitive actions.",
                  "गृह मंत्रालय सुदूर सीमाओं, उच्च ऊंचाई वाली चौकियों और आंतरिक सुरक्षा कर्तव्यों में सेवारत 10 लाख से अधिक अर्धसैनिक कर्मियों की शारीरिक, मनोवैज्ञानिक और सामाजिक भलाई सुनिश्चित करने के लिए समर्पित है। सेंटिनल शून्य दंडात्मक कार्रवाई के साथ शीघ्र चिकित्सा देखभाल, विश्राम चक्र और पारिवारिक सहायता सुनिश्चित करता है।"
                )}
              </p>
            </div>

            {/* Quick Link Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#portal-cards"
                className="px-5 py-3 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition"
              >
                <span>{t("Access Portal Workspaces", "पोर्टल वर्कस्पेस खोलें")}</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <a
                href="#forces-directory"
                className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg shadow-2xs transition"
              >
                <span>{t("View Armed Forces Under MHA", "गृह मंत्रालय के अधीन सुरक्षा बल देखें")}</span>
              </a>
            </div>

            {/* Institutional Trust Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t("100% Medical Officer Oversight", "100% चिकित्सा अधिकारी पर्यवेक्षण")}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{t("Zero Punitive Decisions", "शून्य दंडात्मक निर्णय")}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-semibold">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>{t("OPSEC Telemetry Protection", "ऑपसेक (OPSEC) डेटा गोपनीयता")}</span>
              </span>
            </div>
          </div>

          {/* Right Column: Hero Visuals */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-slate-300 rounded-2xl shadow-md overflow-hidden flex flex-col">
              
              {/* Photo Selector Tabs */}
              <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-wrap gap-1 text-[11px] font-bold">
                {photos.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActivePhoto(p.id)}
                    className={`px-3 py-1.5 rounded-md transition ${
                      activePhoto === p.id
                        ? 'bg-[#003366] text-white shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {language === 'hi' ? p.titleHi.split(' ')[0] + ' ' + p.titleHi.split(' ')[1] : p.titleEn.split(' ')[0] + ' ' + p.titleEn.split(' ')[1]}
                  </button>
                ))}
              </div>

              {/* Active Photo Display */}
              <div className="relative w-full h-72 sm:h-96 md:h-[400px] bg-slate-900 overflow-hidden group">
                <img
                  src={currentPhoto.src}
                  alt={language === 'hi' ? currentPhoto.titleHi : currentPhoto.titleEn}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded w-fit mb-1.5 border border-amber-400/40">
                    {language === 'hi' ? currentPhoto.subtitleHi : currentPhoto.subtitleEn}
                  </span>
                  <h3 className="text-base sm:text-xl font-bold text-white leading-tight">
                    {language === 'hi' ? currentPhoto.titleHi : currentPhoto.titleEn}
                  </h3>
                  <p className="text-xs text-slate-200 mt-1.5 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                    {language === 'hi' ? currentPhoto.descHi : currentPhoto.descEn}
                  </p>
                </div>
              </div>

              {/* Photo Thumbnails Strip */}
              <div className="p-2.5 bg-slate-100 border-t border-slate-200 grid grid-cols-4 gap-2">
                {photos.map((p, idx) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePhoto(p.id)}
                    className={`relative rounded-lg overflow-hidden border-2 transition h-14 sm:h-20 group ${
                      activePhoto === p.id ? 'border-[#ff9933] shadow-sm ring-2 ring-[#ff9933]/30' : 'border-slate-300 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={p.src} alt={p.titleEn} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-white truncate px-1 text-center font-semibold">
                      {language === 'hi' ? p.titleHi.split(' ')[0] : p.titleEn.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              {/* Caption Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t("Verified MHA Paramilitary Welfare Field Operations", "प्रमाणित गृह मंत्रालय अर्धसैनिक कल्याण क्षेत्र अभियान")}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {photos.findIndex(p => p.id === activePhoto) + 1} / {photos.length}
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. TEST CALL TO ACTUAL PHONE BANNER */}
      <section className="bg-gradient-to-r from-emerald-50 via-blue-50 to-indigo-50 border-b border-emerald-200 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold text-[10px] uppercase">
                  {t("Interactive Testing Feature", "इंटरएक्टिव परीक्षण सुविधा")}
                </span>
                <span className="text-xs font-bold text-emerald-800">
                  {t("Real-Time 1:1 Video Call to Your Physical Phone", "अपने असली मोबाइल फ़ोन पर लाइव 1:1 वीडियो कॉल")}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {t(
                  "Enter any mobile number in Soldier or Family portal to log in with OTP, then scan the QR code to test live video call directly between your laptop and smartphone.",
                  "जवान या परिवार पोर्टल में अपना नंबर दर्ज करें, स्क्रीन पर आया OTP भरें, और QR कोड स्कैन करके लैपटॉप और मोबाइल के बीच तुरंत लाइव वीडियो कॉल टेस्ट करें।"
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/soldier"
              className="px-4 py-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>{t("Test via Soldier Portal", "जवान पोर्टल से टेस्ट करें")}</span>
            </Link>
            <Link
              href="/call"
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t("Mobile Call Screen", "मोबाइल कॉल स्क्रीन")}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. THREE DESIGNATED WORKSPACES */}
      <section id="portal-cards" className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#0a2540] tracking-tight">
              {t("Designated Sentinel Portal Workspaces", "निर्धारित सेंटिनल पोर्टल वर्कस्पेस")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
              {t(
                "Role-based secure access architectures governed by MHA OPSEC Directive §6a. Every portal serves a non-punitive, supportive mandate.",
                "गृह मंत्रालय ऑपसेक निर्देश §6a द्वारा शासित भूमिका-आधारित सुरक्षित पहुंच वास्तुकला। प्रत्येक पोर्टल एक गैर-दंडात्मक, सहायक जनादेश पूरा करता है।"
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* PORTAL 1: SOLDIER */}
            <div className="gov-card rounded-2xl p-6 flex flex-col justify-between border-t-4 border-t-sky-600 hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                    {t("Mobile-First PWA", "मोबाइल-प्रथम पीडब्ल्यूए")}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#0a2540]">
                    {t("जवान पोर्टल (Soldier Portal)", "जवान पोर्टल (Soldier Portal)")}
                  </h3>
                  <p className="text-xs font-semibold text-sky-800 mt-0.5">
                    {t("Self-Care, Decompression & Video Connect", "स्व-देखभाल, तनाव-मुक्ति एवं वीडियो संवाद")}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {t(
                    "Allows paramilitary personnel to view confirmed rest schedules, submit voluntary self-checks, update family next-of-kin, and connect with loved ones via 1:1 video call.",
                    "जवानों को निर्धारित विश्राम कार्यक्रम देखने, स्वैच्छिक स्व-जांच दर्ज करने, परिवार का विवरण अपडेट करने और 1:1 वीडियो कॉल द्वारा परिजनों से जुड़ने की सुविधा देता है।"
                  )}
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-[#003366]">{t("Features:", "मुख्य विशेषताएं:")}</div>
                  <div>• {t("Instant OTP login with any mobile number", "किसी भी मोबाइल नंबर से तुरंत ओटीपी लॉगिन")}</div>
                  <div>• {t("Family member registration & emergency link", "परिवार सदस्य पंजीकरण एवं आपातकालीन संपर्क")}</div>
                  <div>• {t("Direct 1:1 video calling to actual phone", "असली मोबाइल फ़ोन पर सीधी 1:1 वीडियो कॉलिंग")}</div>
                  <div>• {t("Bilingual Sahayak AI chat assistance", "द्विभाषी 'सहायक' एआई चैट सहायता")}</div>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href="/soldier"
                  className="w-full py-3 bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <span>{t("जवान पोर्टल खोलें / Open Soldier Portal", "जवान पोर्टल खोलें / Open Soldier Portal")}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* PORTAL 2: MEDICAL OFFICER */}
            <div className="gov-card rounded-2xl p-6 flex flex-col justify-between border-t-4 border-t-indigo-600 hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {t("Desktop Clinical Console", "डेस्कटॉप नैदानिक कंसोल")}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#0a2540]">
                    {t("चिकित्सा अधिकारी कंसोल (MO Console)", "चिकित्सा अधिकारी कंसोल (MO Console)")}
                  </h3>
                  <p className="text-xs font-semibold text-indigo-800 mt-0.5">
                    {t("Clinical Triage & Non-Punitive Rest Rotations", "नैदानिक ट्राइएज एवं गैर-दंडात्मक विश्राम रोटेशन")}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {t(
                    "Unit Medical Officers review automated predictive risk evaluations with explainable SHAP factors, conducting voluntary counseling and prescribing duty-rest transitions.",
                    "बटालियन चिकित्सा अधिकारी पारदर्शी SHAP कारकों के साथ तनाव जोखिम का मूल्यांकन करते हैं और जवानों के लिए मानवीय परामर्श व ड्यूटी-विश्राम रोटेशन निर्धारित करते हैं।"
                  )}
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-[#003366]">{t("Features:", "मुख्य विशेषताएं:")}</div>
                  <div>• {t("OTP-authorized Medical Officer access", "ओटीपी-सत्यापित चिकित्सा अधिकारी पहुंच")}</div>
                  <div>• {t("Explainable SHAP predictive risk factors", "पारदर्शी SHAP प्रेडिक्टिव तनाव कारक")}</div>
                  <div>• {t("Clinical case status transitions (TRIAGED, IN_CARE)", "नैदानिक केस स्थिति बदलाव (TRIAGED, IN_CARE)")}</div>
                  <div>• {t("Zero punitive command reporting", "शून्य दंडात्मक कमांड रिपोर्टिंग")}</div>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href="/mo"
                  className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <span>{t("चिकित्सा कंसोल खोलें / Open MO Console", "चिकित्सा कंसोल खोलें / Open MO Console")}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* PORTAL 3: FAMILY */}
            <div className="gov-card rounded-2xl p-6 flex flex-col justify-between border-t-4 border-t-emerald-600 hover:shadow-lg transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {t("OPSEC-Isolated Feed", "ऑपसेक-सुरक्षित फ़ीड")}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#0a2540]">
                    {t("परिवार कल्याण पोर्टल (Family Portal)", "परिवार कल्याण पोर्टल (Family Portal)")}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                    {t("Reassurance Check-Ins & Scheduled Calls", "तसल्ली संदेश एवं निर्धारित वीडियो कॉल")}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {t(
                    'Provides verified family members with reassuring "I am Safe" check-in statuses, scheduled rest-hour video calls, and an urgent welfare inquiry channel directly to the Unit MO.',
                    'पंजीकृत परिजनों को "मैं ठीक हूँ" स्थिति संदेश, निर्धारित विश्राम समय में वीडियो कॉल और किसी आपात स्थिति में यूनिट मेडिकल ऑफिसर को सीधे कल्याण जांच अनुरोध भेजने की सुविधा।'
                  )}
                </p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-[#003366]">{t("Features:", "मुख्य विशेषताएं:")}</div>
                  <div>• {t("Requires Soldier Service ID, Relation & Mobile OTP", "सर्विस आईडी, संबंध एवं मोबाइल ओटीपी सत्यापन")}</div>
                  <div>• {t("Deliberately data-starved (no operational locations)", "ऑपसेक सुरक्षित (कोई संवेदनशील ड्यूटी डेटा नहीं)")}</div>
                  <div>• {t("1:1 Video Call connection with jawan", "जवान के साथ सीधा 1:1 वीडियो कॉल संपर्क")}</div>
                  <div>• {t("Medical Officer emergency inquiry submission", "चिकित्सा अधिकारी को आपातकालीन जांच अनुरोध")}</div>
                </div>
              </div>

              <div className="pt-6">
                <Link
                  href="/family"
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <span>{t("परिवार पोर्टल खोलें / Open Family Portal", "परिवार पोर्टल खोलें / Open Family Portal")}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. ARMED FORCES UNDER MINISTRY OF HOME AFFAIRS */}
      <section id="forces-directory" className="bg-white border-t border-slate-200 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              <Award className="w-4 h-4 text-[#ff9933]" />
              <span>{t("Forces Directory", "सशस्त्र बल निर्देशिका")}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#0a2540] tracking-tight">
              {t("Central Armed Police Forces (CAPF) Under MHA", "गृह मंत्रालय के अधीन केंद्रीय सशस्त्र पुलिस बल (CAPF)")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto">
              {t(
                "Serving across borders, extreme high-altitude outposts, industrial assets, and internal security duties under the Ministry of Home Affairs, Government of India.",
                "भारत सरकार के गृह मंत्रालय के अंतर्गत अंतरराष्ट्रीय सीमाओं, दुर्गम हिमालयी चौकियों, औद्योगिक प्रतिष्ठानों और आंतरिक सुरक्षा में मुस्तैद सुरक्षा बल।"
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {forces.map((f) => {
              const IconComp = f.icon;
              return (
                <div 
                  key={f.code}
                  className={`gov-card rounded-2xl p-5 border-l-4 ${f.color} flex flex-col justify-between space-y-3 hover:shadow-md transition`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${f.badgeBg}`}>
                        {f.code}
                      </span>
                      <IconComp className="w-5 h-5 text-slate-400" />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-[#0a2540] text-sm">
                        {language === 'hi' ? f.nameHi : f.nameEn}
                      </h3>
                      <p className="text-[11px] font-bold text-amber-700 mt-0.5 italic">
                        {language === 'hi' ? f.mottoHi : f.mottoEn}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {language === 'hi' ? f.descHi : f.descEn}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">MHA Paramilitary Arm</span>
                    <span className="font-bold text-[#003366]">Active Welfare Coverage ✓</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

    </div>
  );
}
