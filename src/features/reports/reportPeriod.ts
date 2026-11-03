// Report period ↔ URL (Functional Design §2): spending `?year=&month=`
// (default: current year); matrix `?year=` or `?range=last12` (default).
import { currentYearMonth } from '../../lib/dates';
import type { MatrixQuery } from '../../api/queryKeys';

export interface SpendingPeriod {
  year: number;
  month?: number;
}

function intParam(search: URLSearchParams, name: string, min: number, max: number) {
  const value = search.get(name);
  if (value === null || !/^\d+$/.test(value)) return undefined;
  const n = Number(value);
  return n >= min && n <= max ? n : undefined;
}

export function parseSpendingPeriod(search: URLSearchParams, now = new Date()): SpendingPeriod {
  const year = intParam(search, 'year', 1900, 2100);
  const month = intParam(search, 'month', 1, 12);
  if (year === undefined) return { year: currentYearMonth(now).year };
  return month === undefined ? { year } : { year, month };
}

export function serializeSpendingPeriod(period: SpendingPeriod): URLSearchParams {
  const params = new URLSearchParams({ year: String(period.year) });
  if (period.month !== undefined) params.set('month', String(period.month));
  return params;
}

export function parseMatrixPeriod(search: URLSearchParams): MatrixQuery {
  const year = intParam(search, 'year', 1900, 2100);
  return year === undefined ? { range: 'last12' } : { year };
}

export function serializeMatrixPeriod(period: MatrixQuery): URLSearchParams {
  return new URLSearchParams(
    'year' in period ? { year: String(period.year) } : { range: 'last12' },
  );
}
