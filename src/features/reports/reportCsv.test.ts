import { matrixLast12, spendingYear } from '../../test/fixtures';
import {
  categoryByMonthCsv,
  categoryByMonthFileName,
  percentOfTotal,
  spendingByCategoryCsv,
  spendingByCategoryFileName,
} from './reportCsv';

describe('report CSVs', () => {
  it('builds the spending CSV with a Total row', () => {
    expect(spendingByCategoryCsv(spendingYear).split('\r\n')).toEqual([
      'category,spending,percent,lines',
      'Groceries,115.00,45.6,3',
      'Household,40.00,15.9,1',
      'Dining,35.00,13.9,2',
      'Uncategorized,62.34,24.7,2',
      'Total,252.34,100.0,8',
      '',
    ]);
    expect(spendingByCategoryFileName(spendingYear)).toBe('spending_by_category_2026.csv');
  });

  it('leaves percent blank when the total is not positive', () => {
    expect(percentOfTotal(500, 0)).toBe('');
    expect(percentOfTotal(500, -100)).toBe('');
    const refundsOnly = {
      ...spendingYear,
      rows: [{ category_id: 1, category_name: '=Odd', spending_cents: -1500, line_count: 1 }],
      total_cents: -1500,
    };
    expect(spendingByCategoryCsv(refundsOnly).split('\r\n')[1]).toBe("'=Odd,-15.00,,1");
  });

  it('builds the matrix CSV with month columns and totals', () => {
    const lines = categoryByMonthCsv(matrixLast12).split('\r\n');
    expect(lines[0]).toBe(`category,${matrixLast12.months.join(',')},total`);
    expect(lines[1]).toBe(
      'Groceries,0.00,0.00,9.99,0.00,0.00,0.00,0.00,0.00,0.00,50.00,80.00,-15.00,124.99',
    );
    expect(lines[5]).toBe(
      'Total,0.00,0.00,9.99,0.00,0.00,0.00,0.00,0.00,70.00,85.00,132.34,35.00,332.33',
    );
  });

  it('names matrix files by year or by the last month of last12', () => {
    expect(categoryByMonthFileName(matrixLast12)).toBe('category_by_month_last12_2026-03.csv');
    const year = {
      ...matrixLast12,
      period: { ...matrixLast12.period, kind: 'year' as const, label: '2025' },
    };
    expect(categoryByMonthFileName(year)).toBe('category_by_month_2025.csv');
  });
});
