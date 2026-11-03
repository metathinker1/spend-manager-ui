// Report CSVs, built in the browser (Functional Design §3.7, §3.8).
import type { CategoryByMonthReport, SpendingByCategoryReport } from '../../api/client';
import { amountCell, type CsvCell, toCsv } from '../../lib/csv';

/** Share of the total with one decimal, or `''` when the total is not positive. */
export function percentOfTotal(cents: number, totalCents: number): string {
  return totalCents > 0 ? ((cents / totalCents) * 100).toFixed(1) : '';
}

export function spendingByCategoryCsv(report: SpendingByCategoryReport): string {
  const lines = report.rows.reduce((sum, row) => sum + row.line_count, 0);
  const rows: CsvCell[][] = [
    ['category', 'spending', 'percent', 'lines'],
    ...report.rows.map((row) => [
      row.category_name,
      amountCell(row.spending_cents),
      { raw: percentOfTotal(row.spending_cents, report.total_cents) },
      row.line_count,
    ]),
    [
      'Total',
      amountCell(report.total_cents),
      { raw: percentOfTotal(report.total_cents, report.total_cents) },
      lines,
    ],
  ];
  return toCsv(rows);
}

export function spendingByCategoryFileName(report: SpendingByCategoryReport): string {
  return `spending_by_category_${report.period.label}.csv`;
}

export function categoryByMonthCsv(report: CategoryByMonthReport): string {
  const rows: CsvCell[][] = [
    ['category', ...report.months, 'total'],
    ...report.rows.map((row) => [
      row.category_name,
      ...row.cells_cents.map(amountCell),
      amountCell(row.total_cents),
    ]),
    ['Total', ...report.column_totals_cents.map(amountCell), amountCell(report.grand_total_cents)],
  ];
  return toCsv(rows);
}

export function categoryByMonthFileName(report: CategoryByMonthReport): string {
  const label =
    report.period.kind === 'last12' ? `last12_${report.months.at(-1)}` : report.period.label;
  return `category_by_month_${label}.csv`;
}
