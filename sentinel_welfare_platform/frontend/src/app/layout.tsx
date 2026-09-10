import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import { GovNavbar } from '@/components/GovNavbar';
import { GovFooter } from '@/components/GovFooter';

export const metadata: Metadata = {
  title: 'Sentinel — Ministry of Home Affairs | Personnel Welfare & Stress Monitoring Platform',
  description: 'AI-Based Predictive Personnel Stress & Welfare Monitoring System — Ministry of Home Affairs, Government of India',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 antialiased font-sans selection:bg-[#003366] selection:text-white">
        <LanguageProvider>
          <GovNavbar />
          <main className="flex-1">
            {children}
          </main>
          <GovFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
