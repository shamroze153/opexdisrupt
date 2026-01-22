
export interface RawMeterReading {
  date: string;
  campus: string;
  block: string;
  meterNumber: string;
  location: string;
  units_7_8: number;      // 7 PM - 8 PM Units
  units_8_9: number;      // 8 PM - 9 PM Units
  units_9_10am_next: number; // 9 PM - 10 AM Next Day Units
  remarks: string;
}

export interface SoftFMRow {
  no: string | number;
  description: string;
  existingStaff: number;
  targetStaff: number;
  difference?: number;
}

export interface ConsumptionData extends RawMeterReading {
  isSummerTariff: boolean;
  isWeekend: boolean;
  baseCost_7_8: number;
  peakSurcharge_7_8: number;
  baseCost_8_9: number;
  peakSurcharge_8_9: number;
  baseCost_9_10am: number;
  peakSurcharge_9_10am: number;
  totalUnits: number;
  totalBaseCost: number;
  totalPeakSurcharge: number;
  totalCost: number;
  peakUnits: number;
  dayOfWeek: string;
  formattedDate?: string;
}

export interface CampusSummary {
  campus: string;
  totalUnits: number;
  totalCost: number;
  totalPeakSurcharge: number;
  peakExposure: number; 
}

export interface AIAnalysis {
  insight: string;
  recommendations: string[];
  peakSavingsTip: string;
}

export type AppView = 'portal' | 'hard-fm' | 'soft-fm';
export type FMSubView = 'dashboard' | 'controls';
export type FinancialPeriod = 'Monthly' | 'Quarterly' | 'Annually';
