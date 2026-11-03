import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { downloadCsv } from '../../lib/csv';
import { recordRequests } from '../../test/handlers';
import { spendingYear } from '../../test/fixtures';
import { currentLocation, currentSearch, renderWithProviders } from '../../test/render';
import { server } from '../../test/server';
import SpendingReportPage from './SpendingReportPage';

vi.mock('../../lib/csv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/csv')>()),
  downloadCsv: vi.fn(),
}));

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2026, 10, 1) }));
afterEach(() => vi.useRealTimers());

describe('SpendingReportPage', () => {
  it('defaults to the current year and shows rows, percentages and the total', async () => {
    const recorder = recordRequests('/api/reports/spending-by-category', () => spendingYear);
    server.use(recorder.handler);
    renderWithProviders(<SpendingReportPage />, { route: '/reports/spending' });

    const table = await screen.findByTestId('spending-table');
    expect(recorder.urls[0]!.searchParams.toString()).toBe('year=2026');
    const rows = within(table).getAllByRole('row');
    expect(rows.map((row) => row.textContent)).toEqual([
      'CategorySpending% of totalLines',
      'Groceries$115.0045.6%3',
      'Household$40.0015.9%1',
      'Dining$35.0013.9%2',
      'Uncategorized$62.3424.7%2',
      'Total$252.34100.0%8',
    ]);
  });

  it('drills down from a category, the Uncategorized row and the total', async () => {
    const { user } = renderWithProviders(<SpendingReportPage />, {
      route: '/reports/spending?year=2026',
    });
    const table = await screen.findByTestId('spending-table');

    await user.click(within(table).getByRole('link', { name: '$115.00' }));
    expect(currentLocation()).toBe(
      '/transactions?date_from=2026-01-01&date_to=2026-12-31&category_id=10',
    );
  });

  it('drills down from the Uncategorized row', async () => {
    const { user } = renderWithProviders(<SpendingReportPage />, {
      route: '/reports/spending?year=2026',
    });

    await user.click(await screen.findByRole('link', { name: '$62.34' }));

    expect(currentLocation()).toBe(
      '/transactions?date_from=2026-01-01&date_to=2026-12-31&uncategorized=true',
    );
  });

  it('drills down from the total to every spending category plus uncategorized', async () => {
    const { user } = renderWithProviders(<SpendingReportPage />, {
      route: '/reports/spending?year=2026',
    });

    await user.click(await screen.findByRole('link', { name: '$252.34' }));

    expect(currentSearch().getAll('category_id')).toEqual(['10', '11', '12']);
    expect(currentSearch().get('uncategorized')).toBe('true');
    expect(currentSearch().has('include_transfers')).toBe(false);
  });

  it('steps years and switches to months', async () => {
    const { user } = renderWithProviders(<SpendingReportPage />, {
      route: '/reports/spending?year=2026',
    });
    await screen.findByTestId('spending-table');

    await user.click(screen.getByRole('button', { name: 'Previous year' }));
    expect(currentLocation()).toBe('/reports/spending?year=2025');

    await user.click(screen.getByRole('radio', { name: 'Month' }));
    expect(currentLocation()).toBe('/reports/spending?year=2025&month=12');

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(currentLocation()).toBe('/reports/spending?year=2026&month=1');

    await user.click(screen.getByRole('radio', { name: 'Year' }));
    expect(currentLocation()).toBe('/reports/spending?year=2026');
  });

  it('starts month mode at the current month in the current year', async () => {
    const { user } = renderWithProviders(<SpendingReportPage />, {
      route: '/reports/spending?year=2026',
    });
    await screen.findByTestId('spending-table');

    await user.click(screen.getByRole('radio', { name: 'Month' }));

    expect(currentLocation()).toBe('/reports/spending?year=2026&month=11');
  });

  it('downloads the CSV', async () => {
    const { user } = renderWithProviders(<SpendingReportPage />, {
      route: '/reports/spending?year=2026',
    });
    await screen.findByTestId('spending-table');

    await user.click(screen.getByRole('button', { name: 'Download CSV' }));

    expect(downloadCsv).toHaveBeenCalledWith(
      'spending_by_category_2026.csv',
      expect.stringContaining('Total,252.34,100.0,8'),
    );
  });

  it('shows the empty state', async () => {
    server.use(
      http.get('*/api/reports/spending-by-category', () =>
        HttpResponse.json({ ...spendingYear, rows: [], total_cents: 0 }),
      ),
    );
    renderWithProviders(<SpendingReportPage />, { route: '/reports/spending?year=2026&month=8' });

    expect(await screen.findByTestId('report-empty')).toHaveTextContent(
      'No spending in August 2026.',
    );
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeEnabled();
  });

  it('shows errors with Retry', async () => {
    server.use(
      http.get('*/api/reports/spending-by-category', () =>
        HttpResponse.json({ detail: 'Internal server error' }, { status: 500 }),
      ),
    );
    renderWithProviders(<SpendingReportPage />, { route: '/reports/spending' });

    expect(await screen.findByTestId('query-error')).toHaveTextContent('see its log');
  });

  it('shows a plain total until categories load', async () => {
    server.use(http.get('*/api/categories', () => new Promise(() => {})));
    renderWithProviders(<SpendingReportPage />, { route: '/reports/spending?year=2026' });

    const table = await screen.findByTestId('spending-table');
    expect(within(table).queryByRole('link', { name: '$252.34' })).not.toBeInTheDocument();
    expect(within(table).getByText('$252.34')).toBeInTheDocument();
  });
});
