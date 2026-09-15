'use client';
import React from 'react';
import Link from 'next/link';
import { Shield, PhoneCall, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const GovFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#0a2540] text-white mt-auto border-t-4 border-[#003366]">
      <div className="gov-tricolor-bar w-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#ff9933]" />
            <span className="font-bold text-sm tracking-wide text-white">
              {t("MHA Sentinel Platform", "गृह मंत्रालय सेंटिनल मंच")}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {t(
              "Official AI-assisted welfare, clinical stress monitoring, and family connectivity platform for Central Armed Police Forces under the Ministry of Home Affairs, Government of India.",
              "भारत सरकार के गृह मंत्रालय के तहत केंद्रीय सशस्त्र पुलिस बलों (CAPF) के लिए आधिकारिक एआई-सहायता प्राप्त कल्याण, नैदानिक तनाव निगरानी और पारिवारिक संपर्क मंच।"
            )}
          </p>
          <div className="pt-1 flex items-center gap-2 text-[11px] text-amber-300 font-semibold">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>{t("National Helpline: 14416 (24x7 Toll Free)", "राष्ट्रीय हेल्पलाइन: 14416 (24x7 निःशुल्क)")}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-700 pb-1.5">
            {t("Access Portals", "प्रवेश पोर्टल")}
          </h4>
          <ul className="space-y-1.5 text-[11px] text-slate-300">
            <li>
              <Link href="/soldier" className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span>
                <span>{t("Soldier Self-Care Portal", "जवान स्व-देखभाल पोर्टल")}</span>
              </Link>
            </li>
            <li>
              <Link href="/mo" className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span>
                <span>{t("Medical Officer (MO) Clinical Console", "चिकित्सा अधिकारी (MO) नैदानिक कंसोल")}</span>
              </Link>
            </li>
            <li>
              <Link href="/family" className="hover:text-amber-300 transition flex items-center gap-1.5">
                <span>•</span>
                <span>{t("Parivar Kalyan (Family Connect)", "परिवार कल्याण (सुरक्षित संपर्क)")}</span>
              </Link>
            </li>

          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-700 pb-1.5">
            {t("Welfare Policies", "कल्याणकारी नीतियां")}
          </h4>
          <ul className="space-y-1.5 text-[11px] text-slate-400">
            <li>• {t("Ayushman CAPF Healthcare Scheme", "आयुष्मान सीएपीएफ स्वास्थ्य सेवा योजना")}</li>
            <li>• {t("Non-Punitive Medical Officer Care", "गैर-दंडात्मक चिकित्सा अधिकारी देखभाल")}</li>
            <li>• {t("Scheduled Rest & Duty Rotation Directives", "निर्धारित विश्राम और ड्यूटी रोटेशन निर्देश")}</li>
            <li>• {t("Parivar Kalyan Video Connect Protocols", "परिवार कल्याण वीडियो संपर्क प्रोटोकॉल")}</li>
            <li>• {t("Mental Well-Being & Counseling Support", "मानसिक स्वास्थ्य एवं परामर्श सहायता")}</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-700 pb-1.5">
            {t("Personnel Welfare Directorate", "कार्मिक कल्याण निदेशालय")}
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {t(
              "Dedicated to safeguarding the health, resilience, and morale of over 10 lakh brave personnel serving across border outposts and internal security sectors.",
              "सीमा चौकियों और आंतरिक सुरक्षा क्षेत्रों में सेवारत 10 लाख से अधिक वीर जवानों के स्वास्थ्य, लचीलेपन और मनोबल की रक्षा के लिए समर्पित।"
            )}
          </p>
          <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 text-[11px]">
            <span className="text-slate-400">{t("Operated by: ", "संचालक: ")}</span>
            <span className="text-amber-300 font-bold">{t("MHA Welfare & Medical Directorate", "गृह मंत्रालय कल्याण एवं चिकित्सा निदेशालय")}</span>
            <span className="block text-[10px] text-slate-400 mt-0.5">{t("Government of India", "भारत सरकार")}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#06182a] py-3 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 text-center sm:text-left">
          <div>
            © 2026 {t("Ministry of Home Affairs, Government of India. All rights reserved.", "गृह मंत्रालय, भारत सरकार। सर्वाधिकार सुरक्षित।")}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span>{t("Website Policies", "वेबसाइट नीतियां")}</span>
            <span>•</span>
            <span>{t("Hyperlinking Policy", "हाइपरलिंकिंग नीति")}</span>
            <span>•</span>
            <span>{t("Privacy Policy", "गोपनीयता नीति")}</span>
            <span>•</span>
            <span>{t("Security Certified", "सुरक्षा प्रमाणित")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
