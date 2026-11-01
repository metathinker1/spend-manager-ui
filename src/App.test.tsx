import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { App } from './App';
import { errorMessage } from './app/errorMessage';
import { RouteErrorBoundary } from './app/RouteErrorBoundary';
import { ApiError } from './api/client';
import { dbProblem } from './test/handlers';
import { currentLocation, renderWithProviders } from './test/render';
import { server } from './test/server';

describe('App shell', () => {
  it('redirects / to Transactions and shows the environment and navigation', async () => {
    renderWithProviders(<App />, { route: '/' });

    expect(await screen.findByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
    expect(currentLocation()).toBe('/transactions');
    expect(screen.getByTestId('env-badge')).toHaveTextContent('development');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Transactions', 'Spending', 'By month', 'Import']);
    expect(within(nav).getByRole('link', { name: 'Transactions' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('loads the report screens', async () => {
    const { user } = renderWithProviders(<App />, { route: '/transactions' });

    await user.click(await screen.findByRole('link', { name: 'Spending' }));
    expect(
      await screen.findByRole('heading', { name: 'Spending by category' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'By month' }));
    expect(await screen.findByRole('heading', { name: 'Category by month' })).toBeInTheDocument();
  });

  it('shows Page not found for unknown routes', async () => {
    const { user } = renderWithProviders(<App />, { route: '/nope' });

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Go to Transactions' }));
    expect(currentLocation()).toBe('/transactions');
  });

  it('marks production in red', async () => {
    server.use(http.get('*/health', () => HttpResponse.json({ status: 'ok', env: 'production' })));
    renderWithProviders(<App />, { route: '/import' });

    expect(await screen.findByTestId('env-badge')).toHaveTextContent('production');
  });
});

describe('HealthGate', () => {
  it('explains an unreachable service and recovers with Retry', async () => {
    server.use(http.get('*/health', () => HttpResponse.error()));
    const { user } = renderWithProviders(<App />, { route: '/transactions' });

    const message = await screen.findByTestId('health-unreachable');
    expect(message).toHaveTextContent('uv run uvicorn spend_manager.main:app');

    server.resetHandlers();
    await user.click(within(message).getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Transactions' })).toBeInTheDocument();
  });

  it.each([
    ['missing', 'Database not found', 'SPEND_MANAGER_DB_PATH'],
    ['unreadable', "Database can't be read", 'service log'],
    [
      'schema_outdated',
      'Database schema is out of date',
      'spend-manager-db migrate --env development',
    ],
    ['schema_newer', 'Database is newer than the service', 'older than the database'],
  ] as const)('explains a database problem: %s', async (reason, title, hint) => {
    server.use(dbProblem(reason));
    renderWithProviders(<App />, { route: '/reports/spending' });

    const problem = await screen.findByTestId('health-db-problem');
    expect(problem).toHaveTextContent(title);
    expect(problem).toHaveTextContent(hint);
  });

  it('keeps Import available when the database is missing', async () => {
    server.use(dbProblem('missing'));
    renderWithProviders(<App />, { route: '/import' });

    expect(await screen.findByTestId('health-missing-notice')).toHaveTextContent(
      'The first import creates the development database.',
    );
    expect(screen.getByRole('heading', { name: 'Import from MoneyWell' })).toBeInTheDocument();
  });

  it('blocks Import for other database problems', async () => {
    server.use(dbProblem('schema_outdated'));
    renderWithProviders(<App />, { route: '/import' });

    expect(await screen.findByTestId('health-db-problem')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Import from MoneyWell' }),
    ).not.toBeInTheDocument();
  });
});

describe('errors', () => {
  it('maps request errors to messages', () => {
    expect(errorMessage(new ApiError(0, 'x'))).toBe("Can't reach the Spend Manager service.");
    expect(errorMessage(new ApiError(422, 'x'))).toBe("These filters aren't valid.");
    expect(errorMessage(new ApiError(503, 'x'))).toBe('The service had an error — see its log.');
    expect(errorMessage(new ApiError(404, 'not here'))).toBe('not here');
    expect(errorMessage(new Error('x'))).toBe('Something went wrong.');
  });

  it('shows a message instead of a blank screen when a screen throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Broken(): never {
      throw new Error('boom');
    }
    renderWithProviders(
      <RouteErrorBoundary>
        <Broken />
      </RouteErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reload the page' })).toBeInTheDocument();
  });
});
