// Calendar dates as ISO strings (YYYY-MM-DD) and months (YYYY-MM), handled
// as plain numbers: no Date objects, so no time-zone shifts.

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const LONG_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface YearMonth {
  year: number;
  month: number; // 1–12
}

export interface DateRange {
  dateFrom: string;
  dateTo: string;
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

export function isoDate(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** `{year, month, day}` of a valid ISO date, else `null`. */
export function parseIsoDate(text: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/** `2026-08-14` → `Aug 14, 2026`. */
export function formatDate(iso: string): string {
  const date = parseIsoDate(iso);
  return date ? `${SHORT_MONTHS[date.month - 1]} ${date.day}, ${date.year}` : iso;
}

/** `2025-09` → `Sep 2025`. */
export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number) as [number, number];
  return `${SHORT_MONTHS[month - 1]} ${year}`;
}

/** `{2026, 8}` → `August 2026`. */
export function monthLabel({ year, month }: YearMonth): string {
  return `${LONG_MONTHS[month - 1]} ${year}`;
}

export function monthRange({ year, month }: YearMonth): DateRange {
  return {
    dateFrom: isoDate(year, month, 1),
    dateTo: isoDate(year, month, daysInMonth(year, month)),
  };
}

/** First to last day of a `YYYY-MM` month. */
export function monthStringRange(yearMonth: string): DateRange {
  const [year, month] = yearMonth.split('-').map(Number) as [number, number];
  return monthRange({ year, month });
}

export function yearRange(year: number): DateRange {
  return { dateFrom: isoDate(year, 1, 1), dateTo: isoDate(year, 12, 31) };
}

export function addMonths({ year, month }: YearMonth, count: number): YearMonth {
  const index = year * 12 + (month - 1) + count;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** The current month on this computer. */
export function currentYearMonth(now: Date = new Date()): YearMonth {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
