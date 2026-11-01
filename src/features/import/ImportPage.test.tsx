import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { importResponse } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';
import { ImportPage } from './ImportPage';

function recordImports(
  response: () => Response | Promise<Response> = () =>
    HttpResponse.json(importResponse, { status: 201 }),
) {
  const bodies: unknown[] = [];
  server.use(
    http.post('*/imports/moneywell-store', async ({ request }) => {
      bodies.push(await request.json());
      return response();
    }),
  );
  return bodies;
}

async function chooseAndOpen(user: ReturnType<typeof renderWithProviders>['user'], name: string) {
  await user.click(await screen.findByRole('radio', { name: new RegExp(name) }));
  await user.click(screen.getByRole('button', { name: 'Import…' }));
  return screen.findByRole('dialog', { name: 'Confirm import' });
}

describe('ImportPage', () => {
  it('lists snapshots newest first with kind and date', async () => {
    renderWithProviders(<ImportPage />);

    const list = await screen.findByTestId('snapshot-list');
    expect(
      within(list)
        .getAllByRole('radio')
        .map((r) => r.getAttribute('value')),
    ).toEqual(['Budget_20261003', 'Budget_20260821.zip', 'Undated']);
    expect(within(list).getByText('Oct 3, 2026')).toBeInTheDocument();
    expect(within(list).getByText('zip')).toBeInTheDocument();
    expect(within(list).getByText('—')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import…' })).toBeDisabled();
  });

  it('names the snapshot and environment, and Cancel sends nothing', async () => {
    const bodies = recordImports();
    const { user } = renderWithProviders(<ImportPage />);

    const dialog = await chooseAndOpen(user, 'Budget_20261003');
    await waitFor(() =>
      expect(dialog).toHaveTextContent('Import Budget_20261003 into the DEVELOPMENT database?'),
    );
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(bodies).toEqual([]);
  });

  it('imports, shows the result and refreshes cached data', async () => {
    const bodies = recordImports();
    const { user, queryClient } = renderWithProviders(<ImportPage />);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const dialog = await chooseAndOpen(user, 'Budget_20260821.zip');
    await user.click(within(dialog).getByRole('button', { name: 'Import' }));

    const result = await screen.findByTestId('import-result');
    expect(bodies).toEqual([{ budget_folder: 'Budget_20260821.zip' }]);
    expect(within(result).getByRole('row', { name: 'Transactions 12 4060' })).toBeInTheDocument();
    expect(within(result).getByText('activity X has no account; skipped')).toBeInTheDocument();
    expect(within(result).getByTestId('import-backup')).toHaveTextContent(
      'Backup: created spend_manager_development_20261101.db',
    );
    expect(invalidate).toHaveBeenCalledOnce();
    const { predicate } = invalidate.mock.calls[0]![0] as unknown as {
      predicate: (q: { queryKey: unknown[] }) => boolean;
    };
    expect(predicate({ queryKey: ['transactions', ''] })).toBe(true);
    expect(predicate({ queryKey: ['dbHealth'] })).toBe(true);
    expect(predicate({ queryKey: ['health'] })).toBe(false);
  });

  it('shows a failed backup as a warning', async () => {
    recordImports(() =>
      HttpResponse.json(
        { ...importResponse, backup: { status: 'failed', file: null } },
        { status: 201 },
      ),
    );
    const { user } = renderWithProviders(<ImportPage />);

    const dialog = await chooseAndOpen(user, 'Budget_20261003');
    await user.click(within(dialog).getByRole('button', { name: 'Import' }));

    expect(await screen.findByText('Backup failed')).toBeInTheDocument();
  });

  it.each([
    [{ status: 'skipped_unchanged', file: 'x.db' }, 'Backup: skipped (unchanged)'],
    [{ status: 'disabled', file: null }, 'Backup: disabled'],
  ])('describes backup status %j', async (backup, text) => {
    recordImports(() => HttpResponse.json({ ...importResponse, backup }, { status: 201 }));
    const { user } = renderWithProviders(<ImportPage />);

    const dialog = await chooseAndOpen(user, 'Undated');
    await user.click(within(dialog).getByRole('button', { name: 'Import' }));

    expect(await screen.findByTestId('import-backup')).toHaveTextContent(text);
  });

  it('shows a rejected import with the service detail', async () => {
    recordImports(() =>
      HttpResponse.json({ detail: '3 validation error(s): bad split' }, { status: 400 }),
    );
    const { user } = renderWithProviders(<ImportPage />);

    const dialog = await chooseAndOpen(user, 'Budget_20261003');
    await user.click(within(dialog).getByRole('button', { name: 'Import' }));

    const error = await screen.findByTestId('import-error');
    expect(error).toHaveTextContent('3 validation error(s): bad split');
    expect(error).toHaveTextContent('Nothing was written to the database.');
  });

  it('shows a server failure without claiming nothing was written', async () => {
    recordImports(() => HttpResponse.json({ detail: 'Internal server error' }, { status: 500 }));
    const { user } = renderWithProviders(<ImportPage />);

    const dialog = await chooseAndOpen(user, 'Budget_20261003');
    await user.click(within(dialog).getByRole('button', { name: 'Import' }));

    const error = await screen.findByTestId('import-error');
    expect(error).toHaveTextContent('The service had an error — see its log.');
    expect(error).not.toHaveTextContent('Nothing was written');
  });

  it('allows only one import at a time', async () => {
    let finish: () => void = () => {};
    recordImports(
      () =>
        new Promise<Response>((resolve) => {
          finish = () => resolve(HttpResponse.json(importResponse, { status: 201 }));
        }),
    );
    const { user } = renderWithProviders(<ImportPage />);

    const dialog = await chooseAndOpen(user, 'Budget_20261003');
    await user.click(within(dialog).getByRole('button', { name: 'Import' }));

    expect(await screen.findByText(/Importing Budget_20261003/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import…/ })).toBeDisabled();
    finish();
    expect(await screen.findByTestId('import-result')).toBeInTheDocument();
  });

  it('names the production environment', async () => {
    server.use(http.get('*/health', () => HttpResponse.json({ status: 'ok', env: 'production' })));
    const { user } = renderWithProviders(<ImportPage />);

    const dialog = await chooseAndOpen(user, 'Budget_20261003');

    await waitFor(() => expect(dialog).toHaveTextContent('into the PRODUCTION database?'));
  });

  it('explains an empty store folder', async () => {
    server.use(http.get('*/api/moneywell-snapshots', () => HttpResponse.json([])));
    renderWithProviders(<ImportPage />);

    expect(await screen.findByTestId('snapshots-empty')).toBeInTheDocument();
  });

  it('explains a missing store folder (404)', async () => {
    server.use(
      http.get('*/api/moneywell-snapshots', () =>
        HttpResponse.json({ detail: 'MoneyWell store root directory not found' }, { status: 404 }),
      ),
    );
    renderWithProviders(<ImportPage />);

    expect(await screen.findByTestId('snapshots-missing')).toHaveTextContent(
      'MONEYWELL_STORE_ROOT',
    );
  });

  it('shows other snapshot errors with Retry', async () => {
    server.use(http.get('*/api/moneywell-snapshots', () => HttpResponse.error()));
    renderWithProviders(<ImportPage />);

    expect(await screen.findByTestId('query-error')).toBeInTheDocument();
  });
});
