// Report value → transaction list (Functional Design §3.9). Transfers stay
// hidden, as in the reports, so the list total equals the clicked value
// with the sign flipped.
import type { Category } from '../../api/client';
import type { DateRange } from '../../lib/dates';
import { EMPTY_FILTER, transactionsUrl } from '../transactions/filterUrl';

/** A category row (or the Uncategorized row, `null`) for a date range. */
export function categoryDrillDownUrl(categoryId: number | null, range: DateRange): string {
  return transactionsUrl({
    ...EMPTY_FILTER,
    ...range,
    ...(categoryId === null ? { uncategorized: true } : { categoryIds: [categoryId] }),
  });
}

/** Ids of the categories that count as spending: expense, except "Transfer". */
export function spendingCategoryIds(categories: Category[]): number[] {
  return categories
    .filter((c) => c.type === 'expense' && c.name.trim().toLowerCase() !== 'transfer')
    .map((c) => c.id);
}

/** A total (column, grand or spending Total): every spending category plus uncategorized. */
export function totalDrillDownUrl(categories: Category[], range: DateRange): string {
  return transactionsUrl({
    ...EMPTY_FILTER,
    ...range,
    categoryIds: spendingCategoryIds(categories),
    uncategorized: true,
  });
}

export function periodRange(period: { date_from: string; date_to: string }): DateRange {
  return { dateFrom: period.date_from, dateTo: period.date_to };
}
