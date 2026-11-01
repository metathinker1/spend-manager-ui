import { Anchor, Box, Button, Loader, Stack, Text, Title } from '@mantine/core';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useAccounts, useCategories, useTransactions } from '../../api/hooks';
import { QueryErrorPanel } from '../../app/QueryErrorPanel';
import { FilterSummary } from './FilterSummary';
import {
  EMPTY_FILTER,
  hasCategoryCondition,
  parseFilter,
  serializeFilter,
  type TransactionFilter,
} from './filterUrl';
import { Pager } from './Pager';
import { TransactionFilters } from './TransactionFilters';
import { TransactionTable } from './TransactionTable';

/** The transaction list; the URL holds the filter (FR-L7). */
export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = useMemo(() => parseFilter(searchParams), [searchParams]);
  const filterKey = serializeFilter(filter).toString();
  const setFilter = useCallback(
    (next: TransactionFilter, options?: { replace?: boolean }) =>
      setSearchParams(serializeFilter(next), options),
    [setSearchParams],
  );

  const transactions = useTransactions(filter);
  const accounts = useAccounts();
  const categories = useCategories();
  const page = transactions.data;

  return (
    <Stack gap="md">
      <Title order={2}>Transactions</Title>
      <TransactionFilters
        filter={filter}
        accounts={accounts.data ?? []}
        categories={categories.data ?? []}
        onChange={setFilter}
      />
      {transactions.isError ? (
        <QueryErrorPanel
          error={transactions.error}
          onRetry={() => void transactions.refetch()}
          onClearFilters={() => setFilter(EMPTY_FILTER)}
        />
      ) : !page ? (
        <Loader aria-label="Loading transactions" />
      ) : (
        <>
          <FilterSummary page={page} filter={filter} />
          {page.items.length === 0 ? (
            <Stack gap="xs" align="flex-start" data-testid="transactions-empty">
              {page.total_transactions > 0 ? (
                <>
                  <Text>This page is past the end of the list.</Text>
                  <Anchor component="button" onClick={() => setFilter({ ...filter, page: 1 })}>
                    Go to first page
                  </Anchor>
                </>
              ) : (
                <>
                  <Text>No transactions match these filters.</Text>
                  <Button size="xs" variant="light" onClick={() => setFilter(EMPTY_FILTER)}>
                    Clear filters
                  </Button>
                </>
              )}
            </Stack>
          ) : (
            <Box
              style={{ opacity: transactions.isPlaceholderData ? 0.5 : 1 }}
              aria-busy={transactions.isPlaceholderData}
            >
              <TransactionTable
                key={filterKey}
                items={page.items}
                autoExpand={hasCategoryCondition(filter)}
              />
            </Box>
          )}
          <Pager
            page={filter.page}
            pageSize={page.page_size}
            total={page.total_transactions}
            onPage={(p) => setFilter({ ...filter, page: p })}
          />
        </>
      )}
    </Stack>
  );
}
