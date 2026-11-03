import { Anchor, Box, Loader, Stack, Table, Text } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { Category, SpendingByCategoryReport } from '../../api/client';
import { useCategories, useSpendingByCategory } from '../../api/hooks';
import { QueryErrorPanel } from '../../app/QueryErrorPanel';
import { monthLabel } from '../../lib/dates';
import { formatCents } from '../../lib/money';
import { categoryDrillDownUrl, periodRange, totalDrillDownUrl } from './drillDown';
import { SpendingPeriodControl } from './ReportPeriodControl';
import { parseSpendingPeriod, serializeSpendingPeriod, type SpendingPeriod } from './reportPeriod';
import { percentOfTotal, spendingByCategoryCsv, spendingByCategoryFileName } from './reportCsv';
import { ReportHeader } from './ReportHeader';

function periodName({ year, month }: SpendingPeriod): string {
  return month === undefined ? String(year) : monthLabel({ year, month });
}

/** Spending by category for a month or a year (FD §3.7). */
export default function SpendingReportPage() {
  const [search, setSearch] = useSearchParams();
  const period = useMemo(() => parseSpendingPeriod(search), [search]);
  const report = useSpendingByCategory(period);
  const categories = useCategories();
  const data = report.data;

  return (
    <Stack gap="md">
      <ReportHeader
        title="Spending by category"
        control={
          <SpendingPeriodControl
            value={period}
            onChange={(next) => setSearch(serializeSpendingPeriod(next))}
          />
        }
        csv={
          data?.rows.length
            ? {
                fileName: spendingByCategoryFileName(data),
                build: () => spendingByCategoryCsv(data),
              }
            : null
        }
      />
      {report.isError ? (
        <QueryErrorPanel error={report.error} onRetry={() => void report.refetch()} />
      ) : !data ? (
        <Loader aria-label="Loading report" />
      ) : data.rows.length === 0 ? (
        <Text data-testid="report-empty">No spending in {periodName(period)}.</Text>
      ) : (
        <Box style={{ opacity: report.isPlaceholderData ? 0.5 : 1 }}>
          <Stack gap="lg">
            <SpendingChart report={data} />
            <SpendingTable report={data} categories={categories.data} />
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

export function SpendingTable({
  report,
  categories,
}: {
  report: SpendingByCategoryReport;
  categories?: Category[];
}) {
  const range = periodRange(report.period);
  const lines = report.rows.reduce((sum, row) => sum + row.line_count, 0);
  const percent = (cents: number) => {
    const value = percentOfTotal(cents, report.total_cents);
    return value && `${value}%`;
  };
  return (
    <Table.ScrollContainer minWidth={480}>
      <Table striped data-testid="spending-table">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Category</Table.Th>
            <Table.Th ta="right">Spending</Table.Th>
            <Table.Th ta="right">% of total</Table.Th>
            <Table.Th ta="right">Lines</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {report.rows.map((row) => (
            <Table.Tr key={row.category_id ?? 'uncategorized'}>
              <Table.Td c={row.category_id === null ? 'dimmed' : undefined}>
                {row.category_name}
              </Table.Td>
              <Table.Td ta="right">
                <Anchor
                  component={Link}
                  to={categoryDrillDownUrl(row.category_id, range)}
                  title={`Show the ${row.category_name} transactions`}
                >
                  {formatCents(row.spending_cents)}
                </Anchor>
              </Table.Td>
              <Table.Td ta="right">{percent(row.spending_cents)}</Table.Td>
              <Table.Td ta="right">{row.line_count}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
        <Table.Tfoot>
          <Table.Tr fw={700}>
            <Table.Td>Total</Table.Td>
            <Table.Td ta="right">
              {categories ? (
                <Anchor
                  component={Link}
                  to={totalDrillDownUrl(categories, range)}
                  title="Show all spending transactions"
                  fw={700}
                >
                  {formatCents(report.total_cents)}
                </Anchor>
              ) : (
                formatCents(report.total_cents)
              )}
            </Table.Td>
            <Table.Td ta="right">{percent(report.total_cents)}</Table.Td>
            <Table.Td ta="right">{lines}</Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    </Table.ScrollContainer>
  );
}

function SpendingChart({ report }: { report: SpendingByCategoryReport }) {
  const navigate = useNavigate();
  const range = periodRange(report.period);
  // Two series so the Uncategorized bar can have a neutral colour; each row
  // has a value in only one of them.
  const data = report.rows.map((row) => ({
    category: row.category_name,
    spending: row.category_id === null ? 0 : row.spending_cents / 100,
    uncategorized: row.category_id === null ? row.spending_cents / 100 : 0,
  }));
  const label = (value: unknown) =>
    typeof value === 'number' && value !== 0 ? formatCents(Math.round(value * 100)) : '';
  return (
    <BarChart
      h={Math.max(160, report.rows.length * 30 + 40)}
      data={data}
      dataKey="category"
      orientation="vertical"
      type="stacked"
      series={[
        { name: 'spending', label: 'Spending', color: 'blue.6' },
        { name: 'uncategorized', label: 'Uncategorized', color: 'gray.6' },
      ]}
      valueFormatter={(value) => formatCents(Math.round(value * 100))}
      yAxisProps={{ width: 180 }}
      gridAxis="x"
      barProps={{
        cursor: 'pointer',
        label: { position: 'right', formatter: label, fontSize: 11 },
        onClick: (_entry: unknown, index: number) => {
          const row = report.rows[index];
          if (row) void navigate(categoryDrillDownUrl(row.category_id, range));
        },
      }}
      aria-hidden
    />
  );
}
