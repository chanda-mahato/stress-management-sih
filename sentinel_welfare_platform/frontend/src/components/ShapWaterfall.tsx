import React from 'react';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface Factor {
  feature: string;
  display_name: string;
  shap_value: number;
  actual_value: number;
  impact_direction: string;
}

interface ShapWaterfallProps {
  factors: Factor[];
}

export const ShapWaterfall: React.FC<ShapWaterfallProps> = ({ factors }) => {
  if (!factors || factors.length === 0) {
    return <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded border border-slate-200">No SHAP factor data available</div>;
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        <AlertCircle className="w-3.5 h-3.5 text-blue-700" />
        <span>Top 3 Clinical Drivers (SHAP Feature Attribution):</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {factors.map((f, i) => {
          const isRiskIncrease = f.shap_value > 0;
          return (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-xs hover:border-slate-300 transition">
              <div className="flex items-center gap-2">
                {isRiskIncrease ? (
                  <TrendingUp className="w-4 h-4 text-red-600 shrink-0" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-slate-900">{f.display_name}</span>
                  <span className="text-slate-500 ml-1.5 text-[11px]">({f.actual_value})</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-mono font-bold text-xs ${isRiskIncrease ? 'text-red-700' : 'text-emerald-700'}`}>
                  {f.shap_value > 0 ? `+${f.shap_value.toFixed(2)}` : f.shap_value.toFixed(2)}
                </span>
                <span className="text-[10px] block text-slate-500">{f.impact_direction}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
