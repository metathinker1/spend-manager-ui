import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { downloadCsv } from '../../lib/csv';
import { recordRequests } from '../../test/handlers';
import { matrixLast12 } from '../../test/fixtures';
import { currentLocation, currentSearch, renderWithProviders } from '../../test/render';
import { server } from '../../test/server';
import MatrixReportPage from './MatrixReportPage';

vi.mock('../../lib/csv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/csv')>()),
  downloadCsv: vi.fn(),
}));

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2026, 10, 1) }));
afterEach(() => vi.useRealTimers());

describe('MatrixReportPage', () => {
  it('defaults to the last 12 months and renders cells, zeros and totals', async () => {
    const recorder = recordRequests('/api/reports/category-by-month', () => matrixLast12);
    server.use(recorder.handler);
    renderWithProviders(<MatrixReportPage />, { route: '/reports/matrix' });

    const table = await screen.findByTestId('matrix-table');
    expect(recorder.urls[0]!.searchParams.toString()).toBe('range=last12');
    const header = within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    expect(header[0]).toBe('Category');
    expect(header[1]).toBe('Apr 2025');
    expect(header.at(-1)).toBe('Total');
    const groceries = within(table).getByRole('row', { name: /^Groceries/ });
    expect(
      within(groceries)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual([
      '—',
      '—',
      '$9.99',
      '—',
      '—',
      '—',
      '—',
      '—',
      '—',
      '$50.00',
      '$80.00',
      '-$15.00',
      '$124.99',
    ]);
    expect(within(table).getByRole('link', { name: '$332.33' })).toBeInTheDocument();
  });

  it('drills down from a cell to that category and month', async () => {
    const { user } = renderWithProviders(<MatrixReportPage />, { route: '/reports/matrix' });
    const table = await screen.findByTestId('matrix-table');
    const groceries = within(table).getByRole('row', { name: /^Groceries/ });

    await user.click(within(groceries).getByRole('link', { name: '$9.99' }));

    expect(currentLocation()).toBe(
      '/transactions?date_from=2025-06-01&date_to=2025-06-30&category_id=10',
    );
  });

  it('drills down from a row total to the report period', async () => {
    const { user } = renderWithProviders(<MatrixReportPage />, { route: '/reports/matrix' });
    const table = await screen.findByTestId('matrix-table');
    const uncategorized = within(table).getByRole('row', { name: /^Uncategorized/ });

    await user.click(within(uncategorized).getByRole('link', { name: '$62.34' }));

    expect(currentLocation()).toBe(
      '/transactions?date_from=2025-04-01&date_to=2026-03-31&uncategorized=true',
    );
  });

  it('drills down from a column total to all spending in that month', async () => {
    const { user } = renderWithProviders(<MatrixReportPage />, { route: '/reports/matrix' });
    const table = await screen.findByTestId('matrix-table');
    const totals = within(table).getByRole('row', { name: /^Total/ });

    await user.click(within(totals).getByRole('link', { name: '$132.34' }));

    expect(currentSearch().get('date_from')).toBe('2026-02-01');
    expect(currentSearch().get('date_to')).toBe('2026-02-28');
    expect(currentSearch().getAll('category_id')).toEqual(['10', '11', '12']);
    expect(currentSearch().get('uncategorized')).toBe('true');
  });

  it('switches to a year and steps it', async () => {
    const { user } = renderWithProviders(<MatrixReportPage />, { route: '/reports/matrix' });
    await screen.findByTestId('matrix-table');

    await user.click(screen.getByRole('radio', { name: 'Year' }));
    expect(currentLocation()).toBe('/reports/matrix?year=2026');
    await user.click(screen.getByRole('button', { name: 'Previous year' }));
    expect(currentLocation()).toBe('/reports/matrix?year=2025');
    await user.click(screen.getByRole('radio', { name: 'Last 12 months' }));
    expect(currentLocation()).toBe('/reports/matrix?range=last12');
  });

  it('downloads the CSV', async () => {
    const { user } = renderWithProviders(<MatrixReportPage />, { route: '/reports/matrix' });
    await screen.findByTestId('matrix-table');

    await user.click(screen.getByRole('button', { name: 'Download CSV' }));

    expect(downloadCsv).toHaveBeenCalledWith(
      'category_by_month_last12_2026-03.csv',
      expect.stringContaining('Total,0.00'),
    );
  });

  it('shows the empty state for a year', async () => {
    server.use(
      http.get('*/api/reports/category-by-month', () =>
        HttpResponse.json({
          ...matrixLast12,
          rows: [],
          column_totals_cents: [],
          grand_total_cents: 0,
        }),
      ),
    );
    renderWithProviders(<MatrixReportPage />, { route: '/reports/matrix?year=2019' });

    expect(await screen.findByTestId('report-empty')).toHaveTextContent('No spending in 2019.');
  });

  it('shows plain totals until categories load', async () => {
    server.use(http.get('*/api/categories', () => new Promise(() => {})));
    renderWithProviders(<MatrixReportPage />, { route: '/reports/matrix' });

    const table = await screen.findByTestId('matrix-table');
    const totals = within(table).getByRole('row', { name: /^Total/ });
    expect(within(totals).queryAllByRole('link')).toHaveLength(0);
  });

  it('shows errors', async () => {
    server.use(http.get('*/api/reports/category-by-month', () => HttpResponse.error()));
    renderWithProviders(<MatrixReportPage />, { route: '/reports/matrix' });

    expect(await screen.findByTestId('query-error')).toHaveTextContent(
      "Can't reach the Spend Manager service.",
    );
  });
});
