// src/time/window.ts
import { DateTime } from 'luxon';
import { TimeWindowInput } from '../analytics/queryBuilder';

export interface HourWindowUtc {
  startUtc: string; // ISO
  endUtc: string; // ISO
}

export function getHourInterval(i: TimeWindowInput): string {
  const window = toUtcHourWindow(i);
  const start = new Date(window.startUtc);
  const end = new Date(window.endUtc);
  const startHour = String(start.getUTCHours()).padStart(2, '0');
  const endHour = String(end.getUTCHours()).padStart(2, '0');
  return `${startHour}-${endHour}`;
}

export function toUtcHourWindow(i: TimeWindowInput): HourWindowUtc {
  const s = DateTime.fromFormat(`${i.day} ${i.windowStart}`, 'yyyy-MM-dd HH:mm', { zone: i.orgTz });
  const e = DateTime.fromFormat(`${i.day} ${i.windowEnd}`, 'yyyy-MM-dd HH:mm', { zone: i.orgTz });
  if (!s.isValid || !e.isValid || e <= s) {
    throw new Error('Invalid hour window');
  }
  return {
    startUtc: s.toUTC().toISO({ suppressMilliseconds: false }),
    endUtc: e.toUTC().toISO({ suppressMilliseconds: false }),
  };
}
