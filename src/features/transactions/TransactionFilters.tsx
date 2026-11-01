import { Button, Checkbox, Group, MultiSelect, Stack, TextInput } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import type { Account, Category } from '../../api/client';
import {
  byVisibility,
  categoryOptions,
  isTransferCategory,
  UNCATEGORIZED_VALUE,
} from './categoryOptions';
import {
  EMPTY_FILTER,
  isEmptyFilter,
  MAX_SEARCH_LENGTH,
  type TransactionFilter,
  withChange,
} from './filterUrl';
import { PeriodControl } from './PeriodControl';

const SEARCH_DELAY_MS = 300;

interface Props {
  filter: TransactionFilter;
  accounts: Account[];
  categories: Category[];
  /** `replace` updates the current history entry instead of adding one (search typing). */
  onChange: (filter: TransactionFilter, options?: { replace?: boolean }) => void;
}

export function TransactionFilters({ filter, accounts, categories, onChange }: Props) {
  const change = (partial: Partial<TransactionFilter>) => onChange(withChange(filter, partial));

  const categoryValue = [
    ...(filter.uncategorized ? [UNCATEGORIZED_VALUE] : []),
    ...filter.categoryIds.map(String),
  ];
  const changeCategories = (values: string[]) => {
    const categoryIds = values.filter((v) => v !== UNCATEGORIZED_VALUE).map(Number);
    const added = categoryIds.filter((id) => !filter.categoryIds.includes(id));
    // The Transfer category matches nothing while transfers are hidden.
    const pickedTransfer = added.some((id) =>
      isTransferCategory(categories.find((c) => c.id === id)),
    );
    change({
      categoryIds,
      uncategorized: values.includes(UNCATEGORIZED_VALUE),
      ...(pickedTransfer ? { includeTransfers: true } : {}),
    });
  };

  return (
    <Stack gap="sm" data-testid="transaction-filters">
      <PeriodControl
        dateFrom={filter.dateFrom}
        dateTo={filter.dateTo}
        onChange={(range) => change(range)}
      />
      <Group gap="sm" align="flex-end" wrap="wrap">
        <MultiSelect
          label="Accounts"
          placeholder={filter.accountIds.length ? undefined : 'All accounts'}
          data={byVisibility(accounts).map((a) => ({ value: String(a.id), label: a.name }))}
          value={filter.accountIds.map(String)}
          onChange={(values) => change({ accountIds: values.map(Number) })}
          clearable
          searchable
          w={260}
          size="xs"
        />
        <MultiSelect
          label="Categories"
          placeholder={categoryValue.length ? undefined : 'All categories'}
          data={categoryOptions(categories)}
          value={categoryValue}
          onChange={changeCategories}
          clearable
          searchable
          w={320}
          size="xs"
        />
        <SearchBox
          value={filter.q}
          onSearch={(q) => onChange(withChange(filter, { q }), { replace: true })}
        />
        <Checkbox
          label="Show transfers"
          checked={filter.includeTransfers}
          onChange={(e) => change({ includeTransfers: e.currentTarget.checked })}
          mb={6}
        />
        <Button
          variant="subtle"
          size="xs"
          disabled={isEmptyFilter(filter)}
          onClick={() => onChange(EMPTY_FILTER)}
        >
          Clear filters
        </Button>
      </Group>
    </Stack>
  );
}

/** Search text, applied 300 ms after the last keystroke. */
function SearchBox({ value, onSearch }: { value?: string; onSearch: (q?: string) => void }) {
  const [text, setText] = useState(value ?? '');
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    // The URL changed from elsewhere (e.g. Clear filters): show it.
    setShown(value);
    setText(value ?? '');
  }

  // Keep the latest callback without restarting the delay on every render.
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  useEffect(() => {
    const q = text.trim() || undefined;
    if (q === value) return;
    const timer = setTimeout(() => onSearchRef.current(q), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, value]);

  return (
    <TextInput
      label="Search"
      placeholder="Payee or memo"
      value={text}
      maxLength={MAX_SEARCH_LENGTH}
      onChange={(e) => setText(e.currentTarget.value)}
      w={220}
      size="xs"
    />
  );
}
