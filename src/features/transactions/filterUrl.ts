// Transaction filter ↔ URL (Functional Design §3.1). URL parameters use the
// API names, so the API request is the URL plus `page_size`.
import { parseIsoDate } from '../../lib/dates';

export const PAGE_SIZE = 50;
export const MAX_SEARCH_LENGTH = 100;

export interface TransactionFilter {
  dateFrom?: string;
  dateTo?: string;
  accountIds: number[];
  categoryIds: number[];
  uncategorized: boolean;
  includeTransfers: boolean;
  q?: string;
  page: number;
}

export const EMPTY_FILTER: TransactionFilter = {
  accountIds: [],
  categoryIds: [],
  uncategorized: false,
  includeTransfers: false,
  page: 1,
};

function validDate(value: string | null): string | undefined {
  return value !== null && parseIsoDate(value) ? value : undefined;
}

function ids(values: string[]): number[] {
  const parsed = values.filter((v) => /^\d+$/.test(v)).map(Number);
  return [...new Set(parsed)].sort((a, b) => a - b);
}

/** Read a filter from the URL. Never throws: invalid values are dropped. */
export function parseFilter(search: URLSearchParams): TransactionFilter {
  const page = Number(search.get('page'));
  const q = search.get('q')?.trim().slice(0, MAX_SEARCH_LENGTH);
  return {
    dateFrom: validDate(search.get('date_from')),
    dateTo: validDate(search.get('date_to')),
    accountIds: ids(search.getAll('account_id')),
    categoryIds: ids(search.getAll('category_id')),
    uncategorized: search.get('uncategorized') === 'true',
    includeTransfers: search.get('include_transfers') === 'true',
    q: q || undefined,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

/** URL parameters without defaults and with sorted ids: equal filters → equal URLs. */
export function serializeFilter(f: TransactionFilter, { withPage = true } = {}): URLSearchParams {
  const params = new URLSearchParams();
  if (f.dateFrom) params.set('date_from', f.dateFrom);
  if (f.dateTo) params.set('date_to', f.dateTo);
  for (const id of [...f.accountIds].sort((a, b) => a - b)) params.append('account_id', String(id));
  for (const id of [...f.categoryIds].sort((a, b) => a - b))
    params.append('category_id', String(id));
  if (f.uncategorized) params.set('uncategorized', 'true');
  if (f.includeTransfers) params.set('include_transfers', 'true');
  if (f.q) params.set('q', f.q);
  if (withPage && f.page > 1) params.set('page', String(f.page));
  return params;
}

/** Query parameters for `GET /api/transactions`. */
export function apiQuery(f: TransactionFilter) {
  return {
    date_from: f.dateFrom,
    date_to: f.dateTo,
    account_id: f.accountIds.length ? f.accountIds : undefined,
    category_id: f.categoryIds.length ? f.categoryIds : undefined,
    uncategorized: f.uncategorized || undefined,
    include_transfers: f.includeTransfers || undefined,
    q: f.q,
    page: f.page,
    page_size: PAGE_SIZE,
  };
}

function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function transactionsUrl(f: TransactionFilter): string {
  return withQuery('/transactions', serializeFilter(f));
}

export function exportCsvUrl(f: TransactionFilter): string {
  return withQuery('/api/transactions/export.csv', serializeFilter(f, { withPage: false }));
}

/** Apply a filter change; any change goes back to page 1. */
export function withChange(
  f: TransactionFilter,
  change: Partial<TransactionFilter>,
): TransactionFilter {
  return { ...f, ...change, page: 1 };
}

/** A category or uncategorized condition: split rows start expanded (FR-L1). */
export function hasCategoryCondition(f: TransactionFilter): boolean {
  return f.categoryIds.length > 0 || f.uncategorized;
}

export function isEmptyFilter(f: TransactionFilter): boolean {
  return serializeFilter(f, { withPage: false }).toString() === '';
}
