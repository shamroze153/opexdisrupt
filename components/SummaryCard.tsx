
import React from 'react';

interface SummaryCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  colorClass: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, subValue, icon, colorClass }) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center space-x-6 hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">{label}</p>
        <h4 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h4>
        {subValue && <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">{subValue}</p>}
      </div>
    </div>
  );
};

export default SummaryCard;
