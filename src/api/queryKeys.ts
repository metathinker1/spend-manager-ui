// TanStack Query keys (NFR Design §3.3). Everything except `health` is
// refreshed after an import.
export const queryKeys = {
  health: ['health'] as const,
  dbHealth: ['dbHealth'] as const,
  accounts: ['accounts'] as const,
  categories: ['categories'] as const,
  snapshots: ['snapshots'] as const,
  transactions: (search: string) => ['transactions', search] as const,
  spending: (year: number, month?: number) => ['report', 'spending', year, month ?? null] as const,
  matrix: (period: MatrixQuery) =>
    ['report', 'matrix', 'year' in period ? period.year : 'last12'] as const,
};

export type MatrixQuery = { year: number } | { range: 'last12' };
