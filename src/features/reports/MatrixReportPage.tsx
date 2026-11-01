import { Anchor, Box, Loader, Stack, Table, Text } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { Category, CategoryByMonthReport } from '../../api/client';
import { useCategories, useCategoryByMonth } from '../../api/hooks';
import { QueryErrorPanel } from '../../app/QueryErrorPanel';
import { formatMonth, monthStringRange } from '../../lib/dates';
import { formatCents } from '../../lib/money';
import { categoryDrillDownUrl, periodRange, totalDrillDownUrl } from './drillDown';
import classes from './MatrixReportPage.module.css';
import { MatrixPeriodControl } from './ReportPeriodControl';
import { parseMatrixPeriod, serializeMatrixPeriod } from './reportPeriod';
import { categoryByMonthCsv, categoryByMonthFileName } from './reportCsv';
import { matrixChartData } from './matrixChartData';
import { ReportHeader } from './ReportHeader';

/** Category × month spending for a year or the last 12 months (FD §3.8). */
export default function MatrixReportPage() {
  const [search, setSearch] = useSearchParams();
  const period = useMemo(() => parseMatrixPeriod(search), [search]);
  const report = useCategoryByMonth(period);
  const categories = useCategories();
  const data = report.data;

  return (
    <Stack gap="md">
      <ReportHeader
        title="Category by month"
        control={
          <MatrixPeriodControl
            value={period}
            onChange={(next) => setSearch(serializeMatrixPeriod(next))}
          />
        }
        csv={
          data?.rows.length
            ? { fileName: categoryByMonthFileName(data), build: () => categoryByMonthCsv(data) }
            : null
        }
      />
      {report.isError ? (
        <QueryErrorPanel error={report.error} onRetry={() => void report.refetch()} />
      ) : !data ? (
        <Loader aria-label="Loading report" />
      ) : data.rows.length === 0 ? (
        <Text data-testid="report-empty">
          No spending in {'year' in period ? period.year : 'the last 12 months'}.
        </Text>
      ) : (
        <Box style={{ opacity: report.isPlaceholderData ? 0.5 : 1 }}>
          <Stack gap="lg">
            <MatrixChart report={data} />
            <MatrixTable report={data} categories={categories.data} />
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

function DrillLink({ to, cents, title }: { to: string; cents: number; title: string }) {
  return (
    <Anchor component={Link} to={to} title={title} c={cents === 0 ? 'dimmed' : undefined}>
      {cents === 0 ? '—' : formatCents(cents)}
    </Anchor>
  );
}

export function MatrixTable({
  report,
  categories,
}: {
  report: CategoryByMonthReport;
  categories?: Category[];
}) {
  const range = periodRange(report.period);
  const total = (to: string | null, cents: number, title: string) =>
    to ? <DrillLink to={to} cents={cents} title={title} /> : formatCents(cents);
  return (
    <Table.ScrollContainer minWidth={1100}>
      <Table striped withColumnBorders data-testid="matrix-table" className={classes.table}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th className={classes.sticky}>Category</Table.Th>
            {report.months.map((month) => (
              <Table.Th key={month} ta="right">
                {formatMonth(month)}
              </Table.Th>
            ))}
            <Table.Th ta="right">Total</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {report.rows.map((row) => (
            <Table.Tr key={row.category_id ?? 'uncategorized'}>
              <Table.Th scope="row" className={classes.sticky} fw={400}>
                {row.category_name}
              </Table.Th>
              {row.cells_cents.map((cents, i) => {
                const month = report.months[i]!;
                return (
                  <Table.Td key={month} ta="right">
                    <DrillLink
                      to={categoryDrillDownUrl(row.category_id, monthStringRange(month))}
                      cents={cents}
                      title={`${row.category_name}, ${formatMonth(month)}`}
                    />
                  </Table.Td>
                );
              })}
              <Table.Td ta="right" fw={600}>
                <DrillLink
                  to={categoryDrillDownUrl(row.category_id, range)}
                  cents={row.total_cents}
                  title={`${row.category_name}, ${report.period.label}`}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
        <Table.Tfoot>
          <Table.Tr fw={700}>
            <Table.Th scope="row" className={classes.sticky}>
              Total
            </Table.Th>
            {report.column_totals_cents.map((cents, i) => {
              const month = report.months[i]!;
              return (
                <Table.Td key={month} ta="right">
                  {total(
                    categories ? totalDrillDownUrl(categories, monthStringRange(month)) : null,
                    cents,
                    `All spending, ${formatMonth(month)}`,
                  )}
                </Table.Td>
              );
            })}
            <Table.Td ta="right">
              {total(
                categories ? totalDrillDownUrl(categories, range) : null,
                report.grand_total_cents,
                `All spending, ${report.period.label}`,
              )}
            </Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    </Table.ScrollContainer>
  );
}

function MatrixChart({ report }: { report: CategoryByMonthReport }) {
  const { data, series } = matrixChartData(report);
  return (
    <BarChart
      h={320}
      data={data}
      dataKey="month"
      type="stacked"
      series={series}
      withLegend
      legendProps={{ verticalAlign: 'bottom' }}
      valueFormatter={(value) => formatCents(Math.round(value * 100))}
      yAxisProps={{ width: 90 }}
      aria-hidden
    />
  );
}
