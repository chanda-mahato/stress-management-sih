'use client';
import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      type="button"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition border ${
        language === 'hi'
          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
          : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
      } ${className}`}
      title={language === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
      aria-label="Toggle Portal Language"
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{language === 'hi' ? 'हिन्दी (Hindi)' : 'English'}</span>
      <span className="text-[10px] opacity-75 font-normal">
        ({language === 'hi' ? 'EN' : 'हिन्दी'})
      </span>
    </button>
  );
};
