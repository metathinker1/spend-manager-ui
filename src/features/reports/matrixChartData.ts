import type { CategoryByMonthReport } from '../../api/client';
import { formatMonth } from '../../lib/dates';

const CHART_CATEGORIES = 8;
const CHART_COLORS = [
  'blue.6',
  'teal.6',
  'grape.6',
  'orange.6',
  'cyan.6',
  'pink.6',
  'lime.7',
  'indigo.4',
];

/** Chart data: the 8 largest categories by total, the rest combined as "Other". */
export function matrixChartData(report: CategoryByMonthReport, limit = CHART_CATEGORIES) {
  const sorted = [...report.rows].sort((a, b) => b.total_cents - a.total_cents);
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const series = top.map((row, i) => ({
    name: `c${i}`,
    label: row.category_name,
    color: row.category_id === null ? 'gray.6' : CHART_COLORS[i % CHART_COLORS.length]!,
  }));
  if (rest.length) series.push({ name: 'other', label: 'Other', color: 'gray.4' });
  const data = report.months.map((month, m) => {
    const point: Record<string, string | number> = { month: formatMonth(month) };
    top.forEach((row, i) => (point[`c${i}`] = row.cells_cents[m]! / 100));
    if (rest.length) point.other = rest.reduce((sum, row) => sum + row.cells_cents[m]!, 0) / 100;
    return point;
  });
  return { data, series };
}
