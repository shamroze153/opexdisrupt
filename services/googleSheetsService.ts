
import { RawMeterReading, SoftFMRow } from '../types';

const BASE_URL = 'https://script.google.com/macros/s/AKfycbzbhBqckijRjhRX7CQcB9XEqNdA2xkDMH3AC8bI2OJ-qpZqJ0NGx7G1lRG_BDp9-qj1/exec';

export const fetchSheetData = async (tab: 'data' | 'sfm' = 'data'): Promise<any[]> => {
  try {
    const cacheBuster = `&t=${new Date().getTime()}`;
    const response = await fetch(`${BASE_URL}?tab=${tab}${cacheBuster}`);
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    if (data.error) {
      console.error(`Apps Script Data Error (${tab}):`, data.error);
      return [];
    }

    if (tab === 'data') {
      return data.map((item: any) => ({
        date: String(item.date || ''),
        campus: String(item.campus || '').trim().toUpperCase().replace(/\s+/g, '-'),
        block: String(item.block || '').trim().toUpperCase(),
        meterNumber: String(item.meterNumber || '').trim().toUpperCase(),
        location: String(item.location || 'Unknown Area'),
        units_7_8: parseFloat(item.units_7_8) || 0,
        units_8_9: parseFloat(item.units_8_9) || 0,
        units_9_10am_next: parseFloat(item.units_9_10am_next) || 0,
        remarks: String(item.remarks || '')
      })).filter((m: any) => m.meterNumber && m.meterNumber.length > 1);
    } else {
      // Soft FM specific normalization - Mapping "Existing Setup" and "Single Shift Estimation" to staffing numbers
      return data.map((item: any) => {
        const existing = parseFloat(item.existing_setup) || 0;
        const target = parseFloat(item.single_shift_estimation) || 0;
        return {
          no: item.no || '',
          description: item.description || '',
          existingStaff: existing,
          targetStaff: target,
          difference: existing - target
        };
      });
    }
  } catch (error) {
    console.error("Sync Protocol Failure:", error);
    return [];
  }
};
