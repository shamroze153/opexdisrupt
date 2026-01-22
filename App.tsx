
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReTooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { processReadings, MOCK_DATA, summarizeByCampus } from './utils/dataProcessor';
import { fetchSheetData } from './services/googleSheetsService';
import { getEnergyInsights } from './services/geminiService';
import { RawMeterReading, AppView, SoftFMRow, FinancialPeriod, ConsumptionData, AIAnalysis } from './types';
import SummaryCard from './components/SummaryCard';
import MeterChart from './components/MeterChart';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MOCK_SFM: SoftFMRow[] = [
  { no: 1, description: 'Janitorial Services (Cleaning Staff)', existingStaff: 25, targetStaff: 12 },
  { no: 2, description: 'Security Personnel (Gate & Floors)', existingStaff: 18, targetStaff: 9 },
  { no: 3, description: 'Reception & Helpdesk', existingStaff: 6, targetStaff: 3 },
  { no: 4, description: 'Catering & Kitchen Utility', existingStaff: 13, targetStaff: 6 },
];

// --- EXTERNALIZED SUB-COMPONENTS TO PREVENT BLINKING ---

interface PortalViewProps {
  onSelectView: (view: AppView) => void;
}

const PortalView: React.FC<PortalViewProps> = ({ onSelectView }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#F8FAFC]">
    <div className="text-center mb-16 space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="inline-block px-6 py-2 bg-indigo-100 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em]">Operational Excellence Workshop</div>
      <h1 className="text-6xl font-[1000] text-[#1B2559] tracking-tighter uppercase leading-[0.9]">Operational <span className="text-indigo-600">Portal</span></h1>
      <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[11px] pt-4">Strategic Facility Management & Financial Modeling Suite</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-5xl animate-in fade-in zoom-in-95 duration-1000 delay-200">
      <button onClick={() => onSelectView('hard-fm')} className="group relative bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-indigo-200/50 transition-all hover:-translate-y-2 text-left overflow-hidden">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mb-10 shadow-lg shadow-indigo-100 group-hover:rotate-12 transition-transform relative z-10">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <h2 className="text-4xl font-black text-[#1B2559] uppercase tracking-tighter mb-4 relative z-10">HARD FM</h2>
        <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8 relative z-10">Infrastructure & Energy Audit. Analyze grid load, configure tariffs, and visualize peak-hour PF penalties across meters.</p>
        <div className="flex items-center text-indigo-600 font-black text-[11px] uppercase tracking-widest relative z-10">Open Analysis <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></div>
      </button>

      <button onClick={() => onSelectView('soft-fm')} className="group relative bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-emerald-200/50 transition-all hover:-translate-y-2 text-left overflow-hidden">
        <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white mb-10 shadow-lg shadow-emerald-100 group-hover:-rotate-12 transition-transform relative z-10">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <h2 className="text-4xl font-black text-[#1B2559] uppercase tracking-tighter mb-4 relative z-10">SOFT FM</h2>
        <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8 relative z-10">Staffing & Shift Simulator. Adjust headcounts and salary benchmarks to visualize service level financial impacts.</p>
        <div className="flex items-center text-emerald-600 font-black text-[11px] uppercase tracking-widest relative z-10">Start Workshop <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg></div>
      </button>
    </div>
  </div>
);

interface SoftFMViewProps {
  onBack: () => void;
  avgSalary: number;
  setAvgSalary: (val: number) => void;
  financePeriod: FinancialPeriod;
  setFinancePeriod: (p: FinancialPeriod) => void;
  softFMData: SoftFMRow[];
  handleSoftFMChange: (idx: number, field: 'existingStaff' | 'targetStaff', val: string) => void;
  metrics: { existingCount: number; targetCount: number; diff: number; currentCost: number; newCost: number; savings: number; };
  periodMultiplier: number;
}

const SoftFMView: React.FC<SoftFMViewProps> = ({ 
  onBack, avgSalary, setAvgSalary, financePeriod, setFinancePeriod, 
  softFMData, handleSoftFMChange, metrics, periodMultiplier 
}) => {
  const chartData = [
    { name: 'Baseline', amount: metrics.currentCost, color: '#6366f1' },
    { name: 'Optimized', amount: metrics.newCost, color: '#10b981' }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-16">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-12">
        <div className="space-y-6">
          <button onClick={onBack} className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors group">
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg> Workplace Portal
          </button>
          <h2 className="text-6xl font-black uppercase tracking-tighter text-[#1B2559]">SOFT FM <span className="text-emerald-500">OPTIMIZER</span></h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3">Headcount Efficiency & Financial Projections</p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm min-w-[320px] space-y-4">
             <div className="flex justify-between items-center mb-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Monthly Salary (₨)</span>
             </div>
             <div className="relative group">
               <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black transition-colors group-focus-within:text-indigo-600">₨</span>
               <input 
                  type="number" 
                  value={avgSalary} 
                  onChange={(e) => setAvgSalary(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-xl font-black text-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-200 outline-none transition-all" 
                />
             </div>
          </div>
          <div className="bg-slate-100 p-2 rounded-[2rem] flex items-center space-x-2">
            {(['Monthly', 'Quarterly', 'Annually'] as FinancialPeriod[]).map(p => (
              <button 
                key={p} 
                onClick={() => setFinancePeriod(p)}
                className={`px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${financePeriod === p ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-12 py-10 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-xl font-black text-[#1B2559] uppercase tracking-widest">Shift Staffing Ledger</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Directly edit people counts to calculate efficiency</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 bg-slate-50/20">
                    <th className="px-10 py-8">Service Category</th>
                    <th className="px-10 py-8 text-center">Existing Staff</th>
                    <th className="px-10 py-8 text-center">Optimized Staff</th>
                    <th className="px-10 py-8 text-right">Headcount Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {softFMData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/20 transition-all">
                      <td className="px-10 py-8">
                         <div className="flex flex-col">
                           <span className="text-[15px] font-bold text-[#1B2559]">{row.description}</span>
                           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">REF: SFM-{idx + 1}</span>
                         </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <input 
                          type="number" value={row.existingStaff} 
                          onChange={(e) => handleSoftFMChange(idx, 'existingStaff', e.target.value)}
                          className="w-20 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-center font-black text-[#1B2559] focus:ring-2 focus:ring-indigo-200 outline-none"
                        />
                      </td>
                      <td className="px-10 py-8 text-center">
                        <input 
                          type="number" value={row.targetStaff} 
                          onChange={(e) => handleSoftFMChange(idx, 'targetStaff', e.target.value)}
                          className="w-20 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-center font-black text-emerald-700 focus:ring-2 focus:ring-emerald-200 outline-none"
                        />
                      </td>
                      <td className="px-10 py-8 text-right">
                        <span className="text-xl font-black text-rose-500">-{row.existingStaff - row.targetStaff}</span>
                        <span className="text-[10px] font-bold text-slate-400 ml-2 uppercase">FTE</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 font-black text-white">
                    <td className="px-10 py-10 text-[11px] uppercase tracking-widest">Total Integrated Headcount</td>
                    <td className="px-10 py-10 text-center text-4xl">{metrics.existingCount}</td>
                    <td className="px-10 py-10 text-center text-4xl text-emerald-400">{metrics.targetCount}</td>
                    <td className="px-10 py-10 text-right text-4xl text-rose-400">-{metrics.diff}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="p-12 bg-[#1B2559] text-white">
               <div className="flex items-center space-x-4 mb-8">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-400/30">
                    <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-widest">SFM Executive Insight & Comparison</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/10 pt-10">
                  <div className="space-y-6">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Baseline Expenditure</p>
                    <div className="space-y-2">
                      <p className="text-5xl font-black">₨ {metrics.currentCost.toLocaleString()}</p>
                      <p className="text-indigo-300 font-bold text-sm tracking-wide">
                        Math: {metrics.existingCount} staff × ₨ {avgSalary.toLocaleString()} / month 
                        {financePeriod !== 'Monthly' && ` × ${periodMultiplier} months`}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Optimized Single-Shift Model</p>
                    <div className="space-y-2">
                      <p className="text-5xl font-black text-emerald-400">₨ {metrics.newCost.toLocaleString()}</p>
                      <p className="text-emerald-300/60 font-bold text-sm tracking-wide">
                        Math: {metrics.targetCount} staff × ₨ {avgSalary.toLocaleString()} / month
                        {financePeriod !== 'Monthly' && ` × ${periodMultiplier} months`}
                      </p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 space-y-10">
          <SummaryCard label={`Total ${financePeriod} Savings`} value={`₨ ${metrics.savings.toLocaleString()}`} subValue={`${financePeriod} Delta`} icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} colorClass="bg-emerald-500 text-white shadow-emerald-100" />
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col items-center">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Budget Comparison ({financePeriod})</h4>
             <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={9} tick={{ fill: '#94a3b8', fontWeight: 800 }} />
                    <YAxis axisLine={false} tickLine={false} fontSize={9} tick={{ fill: '#94a3b8', fontWeight: 800 }} tickFormatter={(v) => `₨${v/1000}k`} />
                    <ReTooltip cursor={{ fill: '#f8fafc' }} formatter={(v) => `₨ ${v.toLocaleString()}`} />
                    <Bar dataKey="amount" radius={[15, 15, 0, 0]} barSize={50}>
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HardFMViewProps {
  onBack: () => void;
  showAdminPanel: boolean;
  setShowAdminPanel: (v: boolean) => void;
  baseRate: number;
  setBaseRate: (v: number) => void;
  allMeters: { meterNumber: string; campus: string | undefined; location: string | undefined; }[];
  toggleMeterPeak: (m: string) => void;
  peakEnabledMeters: Set<string>;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  availableDates: { raw: string; formatted: string | undefined; day: string | undefined; isWeekend: boolean | undefined; }[];
  energyTotals: { units: number; cost: number; pf: number; };
  filteredEnergy: ConsumptionData[];
  insights: AIAnalysis | null;
}

const HardFMView: React.FC<HardFMViewProps> = ({ 
  onBack, showAdminPanel, setShowAdminPanel, baseRate, setBaseRate, 
  allMeters, toggleMeterPeak, peakEnabledMeters, selectedDate, setSelectedDate, 
  availableDates, energyTotals, filteredEnergy, insights 
}) => {
  // Group meters by campus for the admin panel
  const groupedMeters = useMemo(() => {
    const groups: Record<string, typeof allMeters> = {};
    allMeters.forEach(m => {
      const campus = m.campus || 'Other';
      if (!groups[campus]) groups[campus] = [];
      groups[campus].push(m);
    });
    return groups;
  }, [allMeters]);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-16">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-12">
        <div className="space-y-6">
          <button onClick={onBack} className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors group">
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg> Workplace Portal
          </button>
          <h2 className="text-6xl font-black uppercase tracking-tighter text-[#1B2559]">HARD FM <span className="text-indigo-600">AUDIT</span></h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3">Infrastructure Analysis & Energy Factor Control</p>
        </div>
        <button 
          onClick={() => setShowAdminPanel(!showAdminPanel)}
          className={`px-10 py-6 rounded-[2rem] border-2 text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${showAdminPanel ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-300'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          Admin Control Center
        </button>
      </div>

      {showAdminPanel && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-in fade-in zoom-in-95 duration-500">
          <div className="lg:col-span-1 bg-white p-10 rounded-[3rem] border-4 border-indigo-50 shadow-sm space-y-8">
            <div>
              <h4 className="text-[12px] font-black text-[#1B2559] uppercase tracking-widest mb-4">Base Electricity Rate (PKR)</h4>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-600">₨</span>
                <input 
                  type="number" value={baseRate} onChange={(e) => setBaseRate(Number(e.target.value))}
                  className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-5 text-3xl font-black text-[#1B2559] focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                />
              </div>
            </div>
          </div>
          <div className="lg:col-span-3 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h4 className="text-[12px] font-black text-[#1B2559] uppercase tracking-widest mb-8">Peak Factor Meter Toggles (Campus Wise)</h4>
            
            <div className="space-y-10">
              {Object.entries(groupedMeters).map(([campus, meters]) => (
                <div key={campus} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-px flex-1 bg-slate-100"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{campus} CAMPUS</span>
                    <div className="h-px flex-1 bg-slate-100"></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {meters.map(m => (
                      <button 
                        key={m.meterNumber} 
                        onClick={() => toggleMeterPeak(m.meterNumber)} 
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${peakEnabledMeters.has(m.meterNumber) ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-slate-50/50 opacity-60'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-[#1B2559] uppercase">{m.meterNumber}</span>
                          <div className={`w-3 h-3 rounded-full ${peakEnabledMeters.has(m.meterNumber) ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate">{m.location}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Grid Operational Timeline</h3>
        <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setSelectedDate('All')} className={`px-10 py-6 rounded-[2.5rem] border-2 text-[11px] font-black uppercase transition-all shrink-0 ${selectedDate === 'All' ? 'bg-[#1B2559] text-white border-[#1B2559] shadow-lg shadow-indigo-200' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>AGGREGATE LOG</button>
          {availableDates.map(d => (
            <button key={d.raw} onClick={() => setSelectedDate(d.raw)} className={`px-10 py-6 rounded-[2.5rem] border-2 text-[11px] font-black uppercase transition-all shrink-0 flex flex-col items-center min-w-[180px] relative overflow-hidden ${selectedDate === d.raw ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-white text-slate-600 border-slate-100 hover:bg-indigo-50/20'}`}>
              {d.isWeekend && <span className="absolute top-2 right-4 text-[7px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black tracking-widest shadow-sm">WEEKEND</span>}
              <span className="text-[15px] font-black tracking-tight">{d.formatted}</span>
              <span className="text-[9px] font-bold uppercase mt-1 opacity-70 tracking-[0.2em]">{d.day}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <SummaryCard label="Units" value={energyTotals.units.toLocaleString()} icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} colorClass="bg-indigo-600 text-white shadow-indigo-100" />
        <SummaryCard label="Base Cost" value={`₨ ${energyTotals.cost.toLocaleString(undefined, {maximumFractionDigits: 0})}`} icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} colorClass="bg-[#1B2559] text-white" />
        <SummaryCard label="PF Surcharge" value={`₨ ${energyTotals.pf.toLocaleString(undefined, {maximumFractionDigits: 0})}`} icon={<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} colorClass="bg-amber-500 text-white" />
      </div>

      <MeterChart data={filteredEnergy} />

      {/* --- NEW INSIGHTS SECTION --- */}
      <div className="pt-10 space-y-10">
        <div className="flex items-center space-x-4">
          <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
          <h3 className="text-3xl font-black uppercase tracking-tighter text-[#1B2559]">System <span className="text-indigo-600">Intelligence</span></h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Static Tariff Schedule Guidelines */}
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center space-x-4 mb-2">
               <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center">
                 <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <h4 className="text-xl font-black text-[#1B2559] uppercase tracking-widest">Tariff Schedule Guidelines</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 space-y-3">
                 <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Early Peak Window</p>
                 <p className="text-2xl font-black text-[#1B2559]">7 PM — 8 PM</p>
                 <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase">High Priority Shift. 25% PF Impact threshold begins here.</p>
               </div>
               <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-3">
                 <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Core Peak Window</p>
                 <p className="text-2xl font-black text-[#1B2559]">8 PM — 9 PM</p>
                 <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase">Maximum Load Period. Highest probability of PF surcharge.</p>
               </div>
               <div className="md:col-span-2 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-3">
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Overnight Off-Peak Block</p>
                 <p className="text-2xl font-black text-[#1B2559]">9 PM — 10 AM (Next Day)</p>
                 <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase">Optimized Block. Transfer non-essential heavy loads (HVAC/IT) to this 13-hour window.</p>
               </div>
            </div>
          </div>

          {/* AI Strategic Insights */}
          <div className="bg-[#1B2559] p-12 rounded-[3.5rem] text-white shadow-xl shadow-indigo-100 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
            </div>
            
            <div className="flex items-center space-x-4 mb-2 relative z-10">
               <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
               </div>
               <h4 className="text-xl font-black text-indigo-300 uppercase tracking-widest">AI Strategic Insights</h4>
            </div>

            {insights ? (
              <div className="space-y-8 relative z-10">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Operational Status</p>
                  <p className="text-xl font-bold leading-relaxed">{insights.insight}</p>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Actionable Recommendations</p>
                  <ul className="grid grid-cols-1 gap-4">
                    {insights.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start space-x-3 bg-white/5 p-4 rounded-2xl border border-white/10 text-sm font-medium">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0"></span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center space-x-3 text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">High Impact Savings Tip</p>
                  </div>
                  <p className="mt-2 text-sm font-bold bg-emerald-500/10 text-emerald-300 px-6 py-4 rounded-2xl border border-emerald-500/20">{insights.peakSavingsTip}</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center space-y-4 animate-pulse">
                <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Consulting AI Model...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
  const [appView, setAppView] = useState<AppView>('portal');
  
  // Hard FM State
  const [baseRate, setBaseRate] = useState<number>(71);
  const [activeCampus, setActiveCampus] = useState<string>('All');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [rawReadings, setRawReadings] = useState<RawMeterReading[]>([]);
  const [peakEnabledMeters, setPeakEnabledMeters] = useState<Set<string>>(new Set());
  const [activeDays, setActiveDays] = useState<Set<string>>(new Set(DAYS_OF_WEEK));
  const [campusStates, setCampusStates] = useState<Record<string, boolean>>({});
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [insights, setInsights] = useState<AIAnalysis | null>(null);

  // Soft FM State
  const [softFMData, setSoftFMData] = useState<SoftFMRow[]>([]);
  const [avgSalary, setAvgSalary] = useState<number>(75000); 
  const [financePeriod, setFinancePeriod] = useState<FinancialPeriod>('Monthly');

  useEffect(() => {
    const init = async () => {
      try {
        const energyData = await fetchSheetData('data');
        const sfmData = await fetchSheetData('sfm');
        setRawReadings(energyData.length > 0 ? energyData : MOCK_DATA);
        setSoftFMData(sfmData.length > 0 ? sfmData : MOCK_SFM);
        
        const dataForDates = energyData.length > 0 ? energyData : MOCK_DATA;
        const uniqueDates = Array.from(new Set(dataForDates.map(d => d.date))).sort();
        if (uniqueDates.length > 0) setSelectedDate(uniqueDates[0]);

        const uniqueCampuses = Array.from(new Set(dataForDates.map(d => d.campus)));
        const initialPeak = new Set(dataForDates.map(m => m.meterNumber));
        setPeakEnabledMeters(initialPeak);
        
        const initialStates: Record<string, boolean> = {};
        uniqueCampuses.forEach(c => initialStates[c] = true);
        setCampusStates(initialStates);
      } catch (err) { console.error(err); }
    };
    init();
  }, []);

  const processedEnergy = useMemo(() => processReadings(rawReadings, baseRate, peakEnabledMeters), [rawReadings, baseRate, peakEnabledMeters]);

  // Fetch AI insights whenever hard FM data changes
  useEffect(() => {
    if (processedEnergy.length > 0) {
      const fetchInsights = async () => {
        const summaries = summarizeByCampus(processedEnergy);
        const aiInsights = await getEnergyInsights(summaries, processedEnergy.slice(0, 10));
        setInsights(aiInsights);
      };
      fetchInsights();
    }
  }, [processedEnergy]);

  const filteredEnergy = useMemo(() => {
    return processedEnergy.filter(d => {
      const campusMatch = (activeCampus === 'All' || d.campus === activeCampus);
      const dateMatch = (selectedDate === 'All' || d.date === selectedDate);
      const dayMatch = activeDays.has(d.dayOfWeek);
      const campusOn = campusStates[d.campus] !== false;
      return campusMatch && dateMatch && dayMatch && campusOn;
    });
  }, [activeCampus, selectedDate, activeDays, processedEnergy, campusStates]);

  const energyTotals = useMemo(() => ({
    units: filteredEnergy.reduce((a, c) => a + c.totalUnits, 0),
    cost: filteredEnergy.reduce((a, c) => a + c.totalCost, 0),
    pf: filteredEnergy.reduce((a, c) => a + c.totalPeakSurcharge, 0),
  }), [filteredEnergy]);

  const availableDates = useMemo(() => {
    const uniqueDates = Array.from(new Set(processedEnergy.map(d => d.date))).sort();
    return uniqueDates.map(d => {
      const entry = processedEnergy.find(p => p.date === d);
      return { raw: d, formatted: entry?.formattedDate, day: entry?.dayOfWeek, isWeekend: entry?.isWeekend };
    });
  }, [processedEnergy]);

  const availableCampuses = useMemo(() => Array.from(new Set(rawReadings.map(r => r.campus))).sort(), [rawReadings]);

  const allMeters = useMemo(() => {
    const uniqueMeters = Array.from(new Set(rawReadings.map(r => r.meterNumber)));
    return uniqueMeters.map(m => {
      const reading = rawReadings.find(r => r.meterNumber === m);
      return { meterNumber: m, campus: reading?.campus, location: reading?.location };
    });
  }, [rawReadings]);

  const handleSoftFMChange = (index: number, field: 'existingStaff' | 'targetStaff', val: string) => {
    const num = parseInt(val) || 0;
    const newData = [...softFMData];
    newData[index] = { ...newData[index], [field]: num };
    setSoftFMData(newData);
  };

  const periodMultiplier = useMemo(() => financePeriod === 'Quarterly' ? 3 : financePeriod === 'Annually' ? 12 : 1, [financePeriod]);

  const softFMMetrics = useMemo(() => {
    const existingCount = softFMData.reduce((acc, curr) => acc + curr.existingStaff, 0);
    const targetCount = softFMData.reduce((acc, curr) => acc + curr.targetStaff, 0);
    const currentCost = existingCount * avgSalary * periodMultiplier;
    const newCost = targetCount * avgSalary * periodMultiplier;
    return { existingCount, targetCount, diff: existingCount - targetCount, currentCost, newCost, savings: currentCost - newCost };
  }, [softFMData, avgSalary, periodMultiplier]);

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC] text-[#1E293B] font-jakarta selection:bg-indigo-100">
      {appView !== 'portal' && (
        <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 h-20 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-12">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setAppView('portal')}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${appView === 'hard-fm' ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                {appView === 'hard-fm' ? <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> : <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              </div>
              <h1 className="text-xl font-black uppercase tracking-tighter text-[#1B2559]">WORK<span className={appView === 'hard-fm' ? 'text-indigo-600' : 'text-emerald-500'}>SHOP</span></h1>
            </div>
          </div>
          {appView === 'hard-fm' && (
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-[450px]">
              {['All', ...availableCampuses].map(c => (
                <button key={c} onClick={() => setActiveCampus(c)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeCampus === c ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>{c}</button>
              ))}
            </div>
          )}
        </nav>
      )}

      <main className={`${appView === 'portal' ? '' : 'max-w-[1300px] mx-auto px-8 py-12'}`}>
        {appView === 'portal' && <PortalView onSelectView={setAppView} />}
        {appView === 'soft-fm' && (
          <SoftFMView 
            onBack={() => setAppView('portal')} 
            avgSalary={avgSalary} setAvgSalary={setAvgSalary}
            financePeriod={financePeriod} setFinancePeriod={setFinancePeriod}
            softFMData={softFMData} handleSoftFMChange={handleSoftFMChange}
            metrics={softFMMetrics} periodMultiplier={periodMultiplier}
          />
        )}
        {appView === 'hard-fm' && (
          <HardFMView 
            onBack={() => setAppView('portal')}
            showAdminPanel={showAdminPanel} setShowAdminPanel={setShowAdminPanel}
            baseRate={baseRate} setBaseRate={setBaseRate}
            allMeters={allMeters} toggleMeterPeak={(m) => {
              const next = new Set(peakEnabledMeters);
              if (next.has(m)) next.delete(m); else next.add(m);
              setPeakEnabledMeters(next);
            }}
            peakEnabledMeters={peakEnabledMeters}
            selectedDate={selectedDate} setSelectedDate={setSelectedDate}
            availableDates={availableDates} energyTotals={energyTotals}
            filteredEnergy={filteredEnergy}
            insights={insights}
          />
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;1000&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .animate-in { animation: animate-in 0.5s ease-out; }
        @keyframes animate-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
};

export default App;
