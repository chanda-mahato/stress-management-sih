import React from 'react';

interface RiskChipProps {
  color?: 'Green' | 'Yellow' | 'Orange' | 'Red' | string;
  tier?: string;
  confidence?: number;
  className?: string;
}

export const RiskChip: React.FC<RiskChipProps> = ({ color, tier, confidence, className = '' }) => {
  const resolvedColor = color || (tier ? tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase() : 'Green');
  const styles: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
    Green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      label: 'Low Risk',
      dot: 'bg-emerald-600'
    },
    Yellow: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      label: 'Stable Medium',
      dot: 'bg-amber-600'
    },
    Orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-900',
      border: 'border-orange-300',
      label: 'Borderline High',
      dot: 'bg-orange-600 animate-pulse'
    },
    Red: {
      bg: 'bg-red-50',
      text: 'text-red-900',
      border: 'border-red-300',
      label: 'High Risk Alert',
      dot: 'bg-red-600 animate-ping'
    }
  };

  const current = styles[resolvedColor] || styles.Green;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border} shadow-sm ${className}`}>
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      <span>{tier ? `${tier} (${current.label})` : current.label}</span>
      {confidence !== undefined && (
        <span className="opacity-80 text-[11px] font-mono font-bold">{(confidence * 100).toFixed(0)}%</span>
      )}
    </span>
  );
};
