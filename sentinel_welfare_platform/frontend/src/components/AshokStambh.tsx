import React from 'react';

export const AshokStambh: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg
      viewBox="0 0 100 125"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="State Emblem of India"
    >
      {/* Base Ashoka Chakra / Abacus */}
      <circle cx="50" cy="92" r="7" stroke="#b45309" strokeWidth="1.5" fill="#fef3c7" />
      <circle cx="50" cy="92" r="1.5" fill="#b45309" />
      <line x1="50" y1="85" x2="50" y2="99" stroke="#b45309" strokeWidth="0.8" />
      <line x1="43" y1="92" x2="57" y2="92" stroke="#b45309" strokeWidth="0.8" />
      <line x1="45" y1="87" x2="55" y2="97" stroke="#b45309" strokeWidth="0.8" />
      <line x1="45" y1="97" x2="55" y2="87" stroke="#b45309" strokeWidth="0.8" />
      
      {/* Pedestal / Base Bar */}
      <rect x="24" y="99" width="52" height="4" rx="1.5" fill="#92400e" />
      <rect x="18" y="104" width="64" height="3" rx="1" fill="#78350f" />
      <text x="50" y="117" textAnchor="middle" fill="#78350f" fontSize="7" fontWeight="bold" fontFamily="sans-serif">
        सत्यमेव जयते
      </text>

      {/* Stylized Four Lions Capital */}
      <path
        d="M50 18 C44 18 40 22 40 28 C40 34 43 38 43 45 C43 52 38 58 38 68 C38 76 43 82 50 82 C57 82 62 76 62 68 C62 58 57 52 57 45 C57 38 60 34 60 28 C60 22 56 18 50 18 Z"
        fill="#b45309"
      />
      <path d="M47 22 C48 19 52 19 53 22 C55 24 57 23 57 26 C57 29 55 31 53 31 C51 31 49 31 47 31 C45 31 43 29 43 26 C43 23 45 24 47 22 Z" fill="#fef3c7" />
      <circle cx="46" cy="36" r="1.5" fill="#fef3c7" />
      <circle cx="54" cy="36" r="1.5" fill="#fef3c7" />
      <path d="M48 42 L52 42 L50 45 Z" fill="#fef3c7" />
      <path d="M44 49 C47 52 53 52 56 49" stroke="#fef3c7" strokeWidth="1.2" strokeLinecap="round" />

      {/* Left Lion Profile */}
      <path
        d="M38 28 C34 28 28 32 28 40 C28 48 33 54 35 62 C37 70 38 76 42 80 C39 74 36 67 34 58 C32 50 34 44 38 38 Z"
        fill="#d97706"
      />
      <circle cx="32" cy="38" r="1.2" fill="#fef3c7" />
      
      {/* Right Lion Profile */}
      <path
        d="M62 28 C66 28 72 32 72 40 C72 48 67 54 65 62 C63 70 62 76 58 80 C61 74 64 67 66 58 C68 50 66 44 62 38 Z"
        fill="#d97706"
      />
      <circle cx="68" cy="38" r="1.2" fill="#fef3c7" />

      {/* Flanking Animals on Abacus */}
      <path d="M28 88 C25 87 23 89 23 92 C23 95 27 96 30 94 C33 92 32 89 28 88 Z" fill="#92400e" />
      <path d="M72 88 C75 87 77 89 77 92 C77 95 73 96 70 94 C67 92 68 89 72 88 Z" fill="#92400e" />
    </svg>
  );
};
