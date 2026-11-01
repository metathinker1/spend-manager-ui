import {
  addMonths,
  currentYearMonth,
  daysInMonth,
  formatDate,
  formatMonth,
  monthLabel,
  monthRange,
  monthStringRange,
  parseIsoDate,
  yearRange,
} from './dates';

describe('dates', () => {
  it('formats ISO dates without time zones', () => {
    expect(formatDate('2026-08-14')).toBe('Aug 14, 2026');
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026');
    expect(formatDate('not a date')).toBe('not a date');
  });

  it('formats months', () => {
    expect(formatMonth('2025-09')).toBe('Sep 2025');
    expect(monthLabel({ year: 2026, month: 8 })).toBe('August 2026');
  });

  it('parses only real dates', () => {
    expect(parseIsoDate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseIsoDate('2025-02-29')).toBeNull();
    expect(parseIsoDate('2025-00-10')).toBeNull();
    expect(parseIsoDate('2025-1-10')).toBeNull();
  });

  it('knows month lengths', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 12)).toBe(31);
  });

  it('builds ranges', () => {
    expect(monthRange({ year: 2026, month: 2 })).toEqual({
      dateFrom: '2026-02-01',
      dateTo: '2026-02-28',
    });
    expect(monthStringRange('2025-12')).toEqual({ dateFrom: '2025-12-01', dateTo: '2025-12-31' });
    expect(yearRange(2025)).toEqual({ dateFrom: '2025-01-01', dateTo: '2025-12-31' });
  });

  it('steps months across years', () => {
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths({ year: 2025, month: 12 }, 1)).toEqual({ year: 2026, month: 1 });
    expect(addMonths({ year: 2026, month: 3 }, -15)).toEqual({ year: 2024, month: 12 });
  });

  it('reads the current month from local time', () => {
    expect(currentYearMonth(new Date(2026, 10, 1, 0, 30))).toEqual({ year: 2026, month: 11 });
  });
});
