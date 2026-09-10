'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, PhoneCall, CheckCircle2, Lock } from 'lucide-react';
import { AshokStambh } from './AshokStambh';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '@/context/LanguageContext';

export const GovNavbar: React.FC = () => {
  const { t, language } = useLanguage();
  const pathname = usePathname();

  return (
    <>
      {/* 1. TOP CITIZEN STRIP */}
      <header className="bg-[#0a2540] text-slate-200 text-xs border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-bold text-white tracking-wide text-[12px]">
              <span className="inline-block w-4 h-2.5 rounded-xs overflow-hidden border border-slate-400">
                <span className="block h-1/3 bg-[#ff9933]"></span>
                <span className="block h-1/3 bg-white"></span>
                <span className="block h-1/3 bg-[#138808]"></span>
              </span>
              {t("भारत सरकार | Government of India", "भारत सरकार | Government of India")}
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-300 font-medium text-[11px]">
              {t("Ministry of Home Affairs", "गृह मंत्रालय")}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-300 flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-amber-400" />
              <span>{t("24x7 Helpline: ", "24x7 हेल्पलाइन: ")}<strong className="text-amber-300">14416</strong></span>
            </span>
            <span className="text-slate-500">|</span>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* 2. OFFICIAL MHA BRANDING HEADER */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <Link href="/" className="shrink-0 group">
              <AshokStambh className="w-12 h-14 transition group-hover:scale-105" />
            </Link>
            <div className="border-l-0 md:border-l border-slate-300 md:pl-4">
              <div className="text-[13px] sm:text-[14px] font-extrabold text-[#0a2540] tracking-tight uppercase">
                {t("गृह मंत्रालय | MINISTRY OF HOME AFFAIRS", "गृह मंत्रालय | MINISTRY OF HOME AFFAIRS")}
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold text-slate-600 tracking-wider uppercase">
                CENTRAL ARMED POLICE FORCES (CRPF • BSF • CISF • ITBP • SSB • AR • NSG)
              </div>
              <div className="text-[12px] sm:text-[13px] font-bold text-[#003366] flex items-center gap-1.5 mt-0.5 justify-center md:justify-start">
                <Shield className="w-3.5 h-3.5 text-[#ff9933]" />
                <span>
                  {t(
                    "Sentinel — Personnel Stress & Welfare Monitoring Platform",
                    "सेंटिनल — कार्मिक कल्याण एवं तनाव प्रबंधन मंच"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                {t("Secured & Active", "सुरक्षित एवं सक्रिय")}
              </span>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                {t("100% Medical Officer Oversight", "100% चिकित्सा अधिकारी पर्यवेक्षण")}
              </p>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="h-10 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-extrabold text-blue-900 leading-none">DIGITAL</span>
                <span className="text-[9px] font-extrabold text-[#ff9933] leading-none">INDIA</span>
              </div>
              <div className="h-10 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded flex flex-col justify-center items-center">
                <span className="text-[9px] font-bold text-slate-700 leading-none">MHA</span>
                <span className="text-[8px] text-slate-500 leading-none">CAPF CELL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="gov-tricolor-bar w-full" />

      {/* 3. NAVBAR */}
      <nav className="bg-[#003366] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto text-xs font-semibold">
          <div className="flex items-center space-x-1 py-1.5">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md transition whitespace-nowrap ${
                pathname === '/' ? 'bg-white/20 text-white font-bold' : 'hover:bg-white/10 text-slate-100'
              }`}
            >
              {t("Home", "मुख्य पृष्ठ")}
            </Link>
            <Link 
              href="/soldier" 
              className={`px-3 py-2 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                pathname === '/soldier' ? 'bg-white/20 text-white font-bold' : 'hover:bg-white/10 text-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>{t("Soldier Portal", "जवान पोर्टल")}</span>
            </Link>
            <Link 
              href="/mo" 
              className={`px-3 py-2 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                pathname === '/mo' ? 'bg-white/20 text-white font-bold' : 'hover:bg-white/10 text-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>{t("MO Console", "चिकित्सा अधिकारी (MO)")}</span>
            </Link>
            <Link 
              href="/family" 
              className={`px-3 py-2 rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                pathname === '/family' ? 'bg-white/20 text-white font-bold' : 'hover:bg-white/10 text-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{t("Family Portal", "परिवार पोर्टल")}</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-blue-100 py-1.5 pr-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[10px] tracking-wider">
              {t("MHA SECURE GATEWAY §6a", "गृह मंत्रालय सुरक्षित गेटवे §6a")}
            </span>
          </div>
        </div>
      </nav>
    </>
  );
};
