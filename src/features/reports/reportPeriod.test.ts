import {
  parseMatrixPeriod,
  parseSpendingPeriod,
  serializeMatrixPeriod,
  serializeSpendingPeriod,
} from './reportPeriod';

const NOW = new Date(2026, 10, 1);
const params = (query: string) => new URLSearchParams(query);

describe('report periods', () => {
  it('defaults spending to the current year', () => {
    expect(parseSpendingPeriod(params(''), NOW)).toEqual({ year: 2026 });
    expect(parseSpendingPeriod(params('year=1800&month=3'), NOW)).toEqual({ year: 2026 });
  });

  it('reads spending year and month', () => {
    expect(parseSpendingPeriod(params('year=2025&month=8'), NOW)).toEqual({ year: 2025, month: 8 });
    expect(parseSpendingPeriod(params('year=2025&month=13'), NOW)).toEqual({ year: 2025 });
  });

  it('writes spending periods', () => {
    expect(serializeSpendingPeriod({ year: 2025, month: 8 }).toString()).toBe('year=2025&month=8');
    expect(serializeSpendingPeriod({ year: 2025 }).toString()).toBe('year=2025');
  });

  it('defaults the matrix to the last 12 months', () => {
    expect(parseMatrixPeriod(params(''))).toEqual({ range: 'last12' });
    expect(parseMatrixPeriod(params('year=abc'))).toEqual({ range: 'last12' });
    expect(parseMatrixPeriod(params('year=2025'))).toEqual({ year: 2025 });
    expect(serializeMatrixPeriod({ year: 2025 }).toString()).toBe('year=2025');
    expect(serializeMatrixPeriod({ range: 'last12' }).toString()).toBe('range=last12');
  });
});
