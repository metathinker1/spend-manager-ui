import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { recordRequests } from '../../test/handlers';
import { costcoSplit, transactionPage } from '../../test/fixtures';
import { currentLocation, renderWithProviders } from '../../test/render';
import { server } from '../../test/server';
import { TransactionsPage } from './TransactionsPage';

function respond(page = transactionPage()) {
  const recorder = recordRequests('/api/transactions', () => page);
  server.use(recorder.handler);
  return recorder.urls;
}

describe('TransactionsPage', () => {
  it('requests the URL filter plus the page size', async () => {
    const urls = respond();
    renderWithProviders(<TransactionsPage />, {
      route: '/transactions?category_id=10&uncategorized=true&page=2',
    });

    await screen.findByTestId('transaction-table');
    const params = urls.at(-1)!.searchParams;
    expect(params.getAll('category_id')).toEqual(['10']);
    expect(params.get('uncategorized')).toBe('true');
    expect(params.get('page')).toBe('2');
    expect(params.get('page_size')).toBe('50');
    expect(params.has('include_transfers')).toBe(false);
  });

  it('shows the matching-line summary and auto-expands splits for a category filter', async () => {
    respond();
    renderWithProviders(<TransactionsPage />, { route: '/transactions?category_id=10' });

    const summary = await screen.findByTestId('filter-summary');
    expect(summary).toHaveTextContent('5 matching lines · Total -$1,137.34');
    expect(summary).toHaveTextContent('Transactions 1–4 of 4');
    expect(screen.getByTestId('split-row-201')).toBeInTheDocument();
    expect(within(summary).getByRole('link', { name: 'Export CSV' })).toHaveAttribute(
      'href',
      '/api/transactions/export.csv?category_id=10',
    );
  });

  it('keeps splits collapsed without a category filter', async () => {
    respond(transactionPage({ items: [costcoSplit] }));
    renderWithProviders(<TransactionsPage />, { route: '/transactions?q=costco' });

    await screen.findByTestId('transaction-table');
    expect(screen.queryByTestId('split-row-201')).not.toBeInTheDocument();
  });

  it('pages through the list', async () => {
    respond(transactionPage({ total_transactions: 120, page: 2 }));
    const { user } = renderWithProviders(<TransactionsPage />, {
      route: '/transactions?q=x&page=2',
    });

    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(currentLocation()).toBe('/transactions?q=x&page=3');
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(currentLocation()).toBe('/transactions?q=x&page=2');
  });

  it('shows the empty state and clears the filters', async () => {
    respond(
      transactionPage({
        items: [],
        total_transactions: 0,
        matching_line_count: 0,
        matching_total_cents: 0,
      }),
    );
    const { user } = renderWithProviders(<TransactionsPage />, { route: '/transactions?q=zzz' });

    expect(await screen.findByText('No transactions match these filters.')).toBeInTheDocument();
    const exportLink = screen.getByText('Export CSV').closest('a')!;
    expect(exportLink).toHaveAttribute('aria-disabled', 'true');
    expect(exportLink).not.toHaveAttribute('href');
    await user.click(screen.getAllByRole('button', { name: 'Clear filters' }).at(-1)!);
    expect(currentLocation()).toBe('/transactions');
  });

  it('offers the first page when the page is past the end', async () => {
    respond(transactionPage({ items: [], total_transactions: 4, page: 9 }));
    const { user } = renderWithProviders(<TransactionsPage />, {
      route: '/transactions?uncategorized=true&page=9',
    });

    await user.click(await screen.findByRole('button', { name: 'Go to first page' }));

    expect(currentLocation()).toBe('/transactions?uncategorized=true');
  });

  it('explains invalid filters (422) and offers to clear them', async () => {
    server.use(
      http.get('*/api/transactions', () =>
        HttpResponse.json({ detail: [{ msg: 'bad' }] }, { status: 422 }),
      ),
    );
    const { user } = renderWithProviders(<TransactionsPage />, {
      route: '/transactions?account_id=1',
    });

    const panel = await screen.findByTestId('query-error');
    expect(panel).toHaveTextContent("These filters aren't valid.");
    await user.click(within(panel).getByRole('button', { name: 'Clear filters' }));
    expect(currentLocation()).toBe('/transactions');
  });

  it('retries after a service error', async () => {
    let fail = true;
    server.use(
      http.get('*/api/transactions', () =>
        fail
          ? HttpResponse.json({ detail: 'Internal server error' }, { status: 500 })
          : HttpResponse.json(transactionPage()),
      ),
    );
    const { user } = renderWithProviders(<TransactionsPage />, { route: '/transactions' });

    expect(await screen.findByTestId('query-error')).toHaveTextContent(
      'The service had an error — see its log.',
    );
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByTestId('transaction-table')).toBeInTheDocument();
  });
});
