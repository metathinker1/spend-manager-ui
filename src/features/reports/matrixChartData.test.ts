import type { CategoryByMonthReport } from '../../api/client';
import { matrixLast12 } from '../../test/fixtures';
import { matrixChartData } from './matrixChartData';

describe('matrixChartData', () => {
  it('keeps every category when there are few', () => {
    const { data, series } = matrixChartData(matrixLast12);

    expect(series.map((s) => s.label)).toEqual([
      'Groceries',
      'Household',
      'Uncategorized',
      'Dining',
    ]);
    expect(series[2]?.color).toBe('gray.6');
    expect(data).toHaveLength(12);
    expect(data[11]).toEqual({ month: 'Mar 2026', c0: -15, c1: 0, c2: 50, c3: 0 });
  });

  it('combines the rest as Other', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      category_id: i + 1,
      category_name: `Cat ${i + 1}`,
      cells_cents: matrixLast12.months.map(() => (10 - i) * 100),
      total_cents: (10 - i) * 1200,
    }));
    const report: CategoryByMonthReport = { ...matrixLast12, rows };

    const { data, series } = matrixChartData(report);

    expect(series).toHaveLength(9);
    expect(series.at(-1)).toEqual({ name: 'other', label: 'Other', color: 'gray.4' });
    expect(data[0]?.other).toBe(2 + 1);
  });
});
