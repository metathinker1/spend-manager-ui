// Synthetic API responses shaped like spend-manager-service v0.3.0.
// No real financial data.
import type {
  Account,
  Category,
  CategoryByMonthReport,
  ImportResponse,
  Snapshot,
  SpendingByCategoryReport,
  SplitRow,
  TransactionPage,
  TransactionRow,
} from '../api/client';

export const GROCERIES = 10;
export const HOUSEHOLD = 11;
export const DINING = 12;
export const TRANSFER = 13;
export const SALARY = 20;

export const accounts: Account[] = [
  { id: 1, name: 'Checking', type: 'checking', is_hidden: false },
  { id: 2, name: 'Card', type: 'credit_card', is_hidden: false },
  { id: 3, name: 'Old Card', type: 'credit_card', is_hidden: true },
];

export const categories: Category[] = [
  { id: GROCERIES, name: 'Groceries', type: 'expense', is_hidden: false },
  { id: HOUSEHOLD, name: 'Household', type: 'expense', is_hidden: false },
  { id: DINING, name: 'Dining', type: 'expense', is_hidden: true },
  { id: TRANSFER, name: 'Transfer', type: 'expense', is_hidden: false },
  { id: SALARY, name: 'Salary', type: 'income', is_hidden: false },
];

export function split(overrides: Partial<SplitRow> & { id: number }): SplitRow {
  return {
    category_id: GROCERIES,
    category_name: 'Groceries',
    memo: null,
    amount_cents: -1000,
    is_transfer: false,
    matches: true,
    ...overrides,
  };
}

export function transaction(overrides: Partial<TransactionRow> & { id: number }): TransactionRow {
  return {
    date: '2026-02-14',
    account_id: 1,
    account_name: 'Checking',
    type: 'withdrawal',
    payee: 'Payee',
    memo: null,
    amount_cents: -1000,
    category_id: GROCERIES,
    category_name: 'Groceries',
    is_split: false,
    is_transfer: false,
    matches: true,
    splits: [],
    ...overrides,
  };
}

export const costcoSplit = transaction({
  id: 106,
  date: '2026-02-14',
  account_id: 2,
  account_name: 'Card',
  payee: 'COSTCO',
  memo: 'big shop',
  amount_cents: -12000,
  category_id: null,
  category_name: null,
  is_split: true,
  splits: [
    split({ id: 201, amount_cents: -8000 }),
    split({
      id: 202,
      category_id: HOUSEHOLD,
      category_name: 'Household',
      memo: 'paper towels',
      amount_cents: -4000,
      matches: false,
    }),
  ],
});

export const transferTxn = transaction({
  id: 105,
  date: '2026-02-10',
  payee: 'Online Transfer to Savings',
  amount_cents: -100000,
  category_id: TRANSFER,
  category_name: 'Transfer',
  is_transfer: true,
});

export const uncategorizedTxn = transaction({
  id: 104,
  date: '2026-02-03',
  payee: 'Corner Store',
  amount_cents: -1234,
  category_id: null,
  category_name: null,
});

export const refundTxn = transaction({
  id: 108,
  date: '2026-03-15',
  type: 'deposit',
  account_id: 2,
  account_name: 'Card',
  payee: 'Safeway',
  memo: 'refund',
  amount_cents: 1500,
});

export function transactionPage(overrides: Partial<TransactionPage> = {}): TransactionPage {
  return {
    items: [refundTxn, costcoSplit, transferTxn, uncategorizedTxn],
    page: 1,
    page_size: 50,
    total_transactions: 4,
    matching_line_count: 5,
    matching_total_cents: -113734,
    ...overrides,
  };
}

export const spendingYear: SpendingByCategoryReport = {
  period: {
    kind: 'year',
    date_from: '2026-01-01',
    date_to: '2026-12-31',
    label: '2026',
    months: Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, '0')}`),
  },
  rows: [
    { category_id: GROCERIES, category_name: 'Groceries', spending_cents: 11500, line_count: 3 },
    { category_id: HOUSEHOLD, category_name: 'Household', spending_cents: 4000, line_count: 1 },
    { category_id: DINING, category_name: 'Dining', spending_cents: 3500, line_count: 2 },
    { category_id: null, category_name: 'Uncategorized', spending_cents: 6234, line_count: 2 },
  ],
  total_cents: 25234,
};

export const LAST12_MONTHS = [
  '2025-04',
  '2025-05',
  '2025-06',
  '2025-07',
  '2025-08',
  '2025-09',
  '2025-10',
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
];

function cells(values: Record<string, number>): number[] {
  return LAST12_MONTHS.map((month) => values[month] ?? 0);
}

export const matrixLast12: CategoryByMonthReport = {
  period: {
    kind: 'last12',
    date_from: '2025-04-01',
    date_to: '2026-03-31',
    label: '2025-04 to 2026-03',
    months: LAST12_MONTHS,
  },
  months: LAST12_MONTHS,
  rows: [
    {
      category_id: GROCERIES,
      category_name: 'Groceries',
      cells_cents: cells({ '2025-06': 999, '2026-01': 5000, '2026-02': 8000, '2026-03': -1500 }),
      total_cents: 12499,
    },
    {
      category_id: HOUSEHOLD,
      category_name: 'Household',
      cells_cents: cells({ '2025-12': 7000, '2026-02': 4000 }),
      total_cents: 11000,
    },
    {
      category_id: DINING,
      category_name: 'Dining',
      cells_cents: cells({ '2026-01': 3500 }),
      total_cents: 3500,
    },
    {
      category_id: null,
      category_name: 'Uncategorized',
      cells_cents: cells({ '2026-02': 1234, '2026-03': 5000 }),
      total_cents: 6234,
    },
  ],
  column_totals_cents: cells({
    '2025-06': 999,
    '2025-12': 7000,
    '2026-01': 8500,
    '2026-02': 13234,
    '2026-03': 3500,
  }),
  grand_total_cents: 33233,
};

export const snapshots: Snapshot[] = [
  { name: 'Budget_20261003', kind: 'folder', snapshot_date: '2026-10-03' },
  { name: 'Budget_20260821.zip', kind: 'zip', snapshot_date: '2026-08-21' },
  { name: 'Undated', kind: 'folder', snapshot_date: null },
];

export const importResponse: ImportResponse = {
  moneywell_budget_id: 'BUDGET-1',
  counts: {
    accounts: { inserted: 0, skipped_existing: 4 },
    categories: { inserted: 1, skipped_existing: 68 },
    tags: { inserted: 0, skipped_existing: 4 },
    transactions: { inserted: 12, skipped_existing: 4060 },
    transaction_splits: { inserted: 2, skipped_existing: 345 },
    transaction_tags: { inserted: 0, skipped_existing: 0 },
    transaction_split_tags: { inserted: 0, skipped_existing: 0 },
  },
  warnings: ['activity X has no account; skipped'],
  backup: { status: 'created', file: 'spend_manager_development_20261101.db' },
};
