import { Button, Group, Text } from '@mantine/core';
import type { TransactionPage } from '../../api/client';
import { formatCents } from '../../lib/money';
import { exportCsvUrl, type TransactionFilter } from './filterUrl';

interface Props {
  page: TransactionPage;
  filter: TransactionFilter;
}

/** Matching lines and their total, the visible range, and the CSV link (FD §3.5, §3.6). */
export function FilterSummary({ page, filter }: Props) {
  const first = (page.page - 1) * page.page_size + 1;
  const last = Math.min(page.page * page.page_size, page.total_transactions);
  const noLines = page.matching_line_count === 0;
  return (
    <Group justify="space-between" wrap="wrap" data-testid="filter-summary">
      <Group gap="lg">
        <Text size="sm">
          <b>{page.matching_line_count.toLocaleString('en-US')}</b> matching{' '}
          {page.matching_line_count === 1 ? 'line' : 'lines'} · Total{' '}
          <b>{formatCents(page.matching_total_cents)}</b>
        </Text>
        {page.total_transactions > 0 && first <= last && (
          <Text size="sm" c="dimmed">
            Transactions {first.toLocaleString('en-US')}–{last.toLocaleString('en-US')} of{' '}
            {page.total_transactions.toLocaleString('en-US')}
          </Text>
        )}
      </Group>
      <Button
        component="a"
        href={noLines ? undefined : exportCsvUrl(filter)}
        download
        size="xs"
        variant="default"
        data-disabled={noLines || undefined}
        aria-disabled={noLines}
        onClick={(e) => noLines && e.preventDefault()}
      >
        Export CSV
      </Button>
    </Group>
  );
}
