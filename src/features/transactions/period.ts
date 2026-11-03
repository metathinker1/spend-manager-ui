// Period control of the filter bar (Functional Design §3.2): the mode is
// derived from the two dates, never stored.
import { daysInMonth, parseIsoDate, type YearMonth } from '../../lib/dates';

export type PeriodMode = 'all' | 'month' | 'year' | 'custom';

export function periodMode(dateFrom?: string, dateTo?: string): PeriodMode {
  if (!dateFrom && !dateTo) return 'all';
  const from = dateFrom ? parseIsoDate(dateFrom) : null;
  const to = dateTo ? parseIsoDate(dateTo) : null;
  if (!from || !to || from.year !== to.year || from.day !== 1) return 'custom';
  if (from.month === 1 && to.month === 12 && to.day === 31) return 'year';
  if (from.month === to.month && to.day === daysInMonth(to.year, to.month)) return 'month';
  return 'custom';
}

/** The month (or year, with month 1) a month/year period starts in. */
export function periodStart(dateFrom: string): YearMonth {
  const date = parseIsoDate(dateFrom);
  if (!date) throw new Error(`invalid date: ${dateFrom}`);
  return { year: date.year, month: date.month };
}
