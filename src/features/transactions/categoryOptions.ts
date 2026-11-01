import type { Category } from '../../api/client';

export const UNCATEGORIZED_VALUE = 'uncategorized';

export function byVisibility<T extends { is_hidden: boolean }>(items: T[]): T[] {
  return [...items.filter((i) => !i.is_hidden), ...items.filter((i) => i.is_hidden)];
}

/** Uncategorized first, then Expense and Income groups, hidden ones last (FD §3.3). */
export function categoryOptions(categories: Category[]) {
  const group = (type: Category['type']) =>
    byVisibility(categories.filter((c) => c.type === type)).map((c) => ({
      value: String(c.id),
      label: c.is_hidden ? `${c.name} (hidden)` : c.name,
    }));
  return [
    { group: 'Other', items: [{ value: UNCATEGORIZED_VALUE, label: 'Uncategorized' }] },
    { group: 'Expense', items: group('expense') },
    { group: 'Income', items: group('income') },
  ];
}

export function isTransferCategory(category: Category | undefined): boolean {
  return category?.name.trim().toLowerCase() === 'transfer';
}
