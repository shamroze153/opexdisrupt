
import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ConsumptionData } from '../types';

interface MeterChartProps {
  data: ConsumptionData[];
}

const MeterChart: React.FC<MeterChartProps> = ({ data }) => {
  // Sort data and format for chart
  const chartData = [...data]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(m => ({
      name: m.meterNumber,
      date: m.formattedDate,
      // More realistic label showing date and meter
      label: `${m.formattedDate?.split(',')[0]} - ${m.meterNumber}`,
      '7PM-8PM (Early Peak)': m.units_7_8,
      '8PM-9PM (Core Peak)': m.units_8_9,
      'Overnight (Off-Peak)': m.units_9_10am_next,
    }));

  // Dynamic width calculation for high-density campus analysis (like 141-D)
  const minWidth = Math.max(800, chartData.length * 100);

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-md overflow-hidden">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-[1000] text-[#1B2559] uppercase tracking-tighter">Energy Distribution Graph</h3>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">
            Historical Power Profile <span className="text-indigo-600">(Standard Stacked View)</span>
          </p>
        </div>
        
        {/* Descriptive Legend Component */}
        <div className="flex flex-wrap gap-4 bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100">
           <div className="flex items-center space-x-2 pr-4 border-r border-slate-200">
             <div className="w-3 h-3 rounded-full bg-indigo-600 shadow-sm"></div>
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-700 uppercase leading-none">7PM-8PM</span>
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Early Peak</span>
             </div>
           </div>
           <div className="flex items-center space-x-2 pr-4 border-r border-slate-200">
             <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div>
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-700 uppercase leading-none">8PM-9PM</span>
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Core Peak</span>
             </div>
           </div>
           <div className="flex items-center space-x-2">
             <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-700 uppercase leading-none">Overnight</span>
               <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Low-Tariff Block</span>
             </div>
           </div>
        </div>
      </div>
      
      <div className="overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing pb-4">
        <div style={{ width: `${minWidth}px`, height: '450px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="color7" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="color8" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorON" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="label" 
                fontSize={9} 
                tick={{ fill: '#94a3b8', fontWeight: 800 }} 
                axisLine={false} 
                tickLine={false}
                dy={15}
              />
              <YAxis 
                fontSize={9} 
                tick={{ fill: '#94a3b8', fontWeight: 800 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => `${v} kWh`} 
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '24px', 
                  border: 'none', 
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', 
                  padding: '24px', 
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(10px)'
                }}
                labelStyle={{ fontWeight: 900, fontSize: '12px', marginBottom: '14px', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 800, padding: '4px 0' }}
                formatter={(value: any) => [`${value} kWh`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="7PM-8PM (Early Peak)" 
                stackId="1" 
                stroke="#6366f1" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#color7)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
              />
              <Area 
                type="monotone" 
                dataKey="8PM-9PM (Core Peak)" 
                stackId="1" 
                stroke="#f59e0b" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#color8)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }}
              />
              <Area 
                type="monotone" 
                dataKey="Overnight (Off-Peak)" 
                stackId="1" 
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorON)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-8 flex items-center justify-between px-4 border-t border-slate-50 pt-6">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Node Rendering</span>
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Scroll horizontally to view all campus meter readings</p>
      </div>
    </div>
  );
};

export default MeterChart;
