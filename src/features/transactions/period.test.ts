import { periodMode, periodStart } from './period';

describe('periodMode', () => {
  it.each([
    [undefined, undefined, 'all'],
    ['2026-08-01', '2026-08-31', 'month'],
    ['2024-02-01', '2024-02-29', 'month'],
    ['2026-02-01', '2026-02-28', 'month'],
    ['2026-01-01', '2026-12-31', 'year'],
    ['2024-02-01', '2024-02-28', 'custom'], // leap year: not the last day
    ['2026-08-02', '2026-08-31', 'custom'],
    ['2026-08-01', '2026-09-30', 'custom'],
    ['2025-12-01', '2026-12-31', 'custom'],
    ['2026-08-01', undefined, 'custom'],
    [undefined, '2026-08-31', 'custom'],
    ['bad', '2026-08-31', 'custom'],
  ])('%s – %s is %s', (from, to, mode) => {
    expect(periodMode(from, to)).toBe(mode);
  });
});

describe('periodStart', () => {
  it('returns the month of the start date', () => {
    expect(periodStart('2026-08-01')).toEqual({ year: 2026, month: 8 });
  });

  it('rejects an invalid date', () => {
    expect(() => periodStart('2026-13-01')).toThrow('invalid date');
  });
});
