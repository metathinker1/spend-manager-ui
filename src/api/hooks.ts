// Data hooks: one per endpoint (Application Design → Component Methods §3).
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiQuery,
  serializeFilter,
  type TransactionFilter,
} from '../features/transactions/filterUrl';
import { api, ApiError, type DbHealth, unwrap, UNREACHABLE } from './client';
import { type MatrixQuery, queryKeys } from './queryKeys';

const REFERENCE_STALE_MS = 5 * 60_000;
const DATA_STALE_MS = 30_000;

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => unwrap(api.GET('/health')),
    staleTime: Infinity,
  });
}

/** `/health/db` answers 503 with the same body when the database has a problem. */
export function useDbHealth() {
  return useQuery({
    queryKey: queryKeys.dbHealth,
    queryFn: fetchDbHealth,
    staleTime: Infinity,
  });
}

async function fetchDbHealth(): Promise<DbHealth> {
  let result;
  try {
    result = await api.GET('/health/db');
  } catch {
    throw new ApiError(0, UNREACHABLE);
  }
  if (result.response.status === 503) return result.error as DbHealth;
  return unwrap(Promise.resolve(result));
}

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => unwrap(api.GET('/api/accounts')),
    staleTime: REFERENCE_STALE_MS,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => unwrap(api.GET('/api/categories')),
    staleTime: REFERENCE_STALE_MS,
  });
}

export function useTransactions(filter: TransactionFilter) {
  return useQuery({
    queryKey: queryKeys.transactions(serializeFilter(filter).toString()),
    queryFn: () => unwrap(api.GET('/api/transactions', { params: { query: apiQuery(filter) } })),
    staleTime: DATA_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

export function useSpendingByCategory(params: { year: number; month?: number }) {
  return useQuery({
    queryKey: queryKeys.spending(params.year, params.month),
    queryFn: () =>
      unwrap(api.GET('/api/reports/spending-by-category', { params: { query: params } })),
    staleTime: DATA_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

export function useCategoryByMonth(params: MatrixQuery) {
  return useQuery({
    queryKey: queryKeys.matrix(params),
    queryFn: () => unwrap(api.GET('/api/reports/category-by-month', { params: { query: params } })),
    staleTime: DATA_STALE_MS,
    placeholderData: keepPreviousData,
  });
}

export function useSnapshots() {
  return useQuery({
    queryKey: queryKeys.snapshots,
    queryFn: () => unwrap(api.GET('/api/moneywell-snapshots')),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/** Start an import; on success every cached query except `health` is refreshed (FR-I5). */
export function useImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (budgetFolder: string) =>
      unwrap(api.POST('/imports/moneywell-store', { body: { budget_folder: budgetFolder } })),
    onSuccess: () =>
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] !== 'health' }),
  });
}
