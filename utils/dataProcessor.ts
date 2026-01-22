
import { RawMeterReading, ConsumptionData, CampusSummary } from '../types';

const generateMockForDate = (date: string, campus: string, meters: any[]): RawMeterReading[] => {
  return meters.map(m => ({
    date,
    campus,
    block: campus.split('-')[1] || 'D',
    meterNumber: m.no,
    location: m.loc,
    units_7_8: Math.floor(Math.random() * 35 + 10),
    units_8_9: Math.floor(Math.random() * 30 + 10),
    units_9_10am_next: Math.floor(Math.random() * 180 + 50),
    remarks: 'Normal'
  }));
};

const METER_TEMPLATES = [
  { no: 'AL-214422', loc: 'GF' }, { no: 'AL-151959', loc: 'FF' },
  { no: 'AL-060851', loc: 'Data Center' }, { no: 'SCJ84858', loc: 'GF - West' },
  { no: 'SCJ84852', loc: 'GF - East' }, { no: 'SCJ84854', loc: 'FF - IT' }
];

const dates = [
  '2025-12-29', '2025-12-30', '2025-12-31', 
  '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'
];

export const MOCK_DATA: RawMeterReading[] = dates.flatMap(date => [
  ...generateMockForDate(date, '140-H', METER_TEMPLATES.slice(0, 2)),
  ...generateMockForDate(date, '141-D', METER_TEMPLATES.slice(3, 6))
]);

export const processReadings = (
  readings: RawMeterReading[], 
  baseRate: number,
  peakEnabledMeters: Set<string>
): ConsumptionData[] => {
  return readings.map(r => {
    const isPF = peakEnabledMeters.has(r.meterNumber);
    
    // Parse date parts manually to avoid timezone shifting
    const dateParts = r.date.split('-');
    const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      
    const month = dateObj.getMonth() + 1;
    const isSummer = month >= 4 && month <= 10;
    const dayOfWeekIndex = dateObj.getDay();
    const isWeekend = dayOfWeekIndex === 0 || dayOfWeekIndex === 6; 
    
    const PEAK_MULT = 1.25; // 25% PF Surcharge Impact

    const getSplitCost = (units: number, mult: number) => {
      const base = units * baseRate;
      const surcharge = isPF ? base * (mult - 1) : 0;
      return { base, surcharge };
    };

    const c78 = getSplitCost(r.units_7_8, PEAK_MULT);
    const c89 = getSplitCost(r.units_8_9, PEAK_MULT);

    // K-Electric logic: Overnight block (9 PM to 10 AM) has partial peak window depending on season
    const peakHoursInRange = isSummer ? 1.5 : 1.0;
    const peakRatio = peakHoursInRange / 13;
    const peakUnitsON = r.units_9_10am_next * peakRatio;

    const baseCost_ON = r.units_9_10am_next * baseRate;
    const peakSurcharge_ON = isPF ? (peakUnitsON * baseRate * (PEAK_MULT - 1)) : 0;

    const totalUnits = r.units_7_8 + r.units_8_9 + r.units_9_10am_next;
    const totalBaseCost = c78.base + c89.base + baseCost_ON;
    const totalPeakSurcharge = c78.surcharge + c89.surcharge + peakSurcharge_ON;

    // Formatting date strictly as "29 Dec 2025"
    const dayNum = dateObj.getDate();
    const monthName = dateObj.toLocaleString('en-GB', { month: 'short' });
    const yearNum = dateObj.getFullYear();
    const formattedDate = `${dayNum} ${monthName} ${yearNum}`;

    return {
      ...r,
      isSummerTariff: isSummer,
      isWeekend,
      baseCost_7_8: c78.base,
      peakSurcharge_7_8: c78.surcharge,
      baseCost_8_9: c89.base,
      peakSurcharge_8_9: c89.surcharge,
      baseCost_9_10am: baseCost_ON,
      peakSurcharge_9_10am: peakSurcharge_ON,
      totalUnits,
      totalBaseCost,
      totalPeakSurcharge,
      totalCost: totalBaseCost + totalPeakSurcharge,
      peakUnits: isPF ? (r.units_7_8 + r.units_8_9 + peakUnitsON) : 0,
      dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
      formattedDate,
    };
  });
};

export const summarizeByCampus = (data: ConsumptionData[]): CampusSummary[] => {
  const campusGroups: Record<string, ConsumptionData[]> = {};
  data.forEach(item => {
    if (!campusGroups[item.campus]) campusGroups[item.campus] = [];
    campusGroups[item.campus].push(item);
  });

  return Object.keys(campusGroups).map(campusName => {
    const group = campusGroups[campusName];
    const totalUnits = group.reduce((sum, curr) => sum + curr.totalUnits, 0);
    const totalCost = group.reduce((sum, curr) => sum + curr.totalCost, 0);
    const totalPeakSurcharge = group.reduce((sum, curr) => sum + curr.totalPeakSurcharge, 0);
    
    return {
      campus: campusName,
      totalUnits,
      totalCost,
      totalPeakSurcharge,
      peakExposure: totalCost === 0 ? 0 : (totalPeakSurcharge / totalCost) * 100
    };
  });
};
