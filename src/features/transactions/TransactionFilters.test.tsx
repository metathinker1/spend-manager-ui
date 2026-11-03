import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { accounts, categories, DINING, TRANSFER } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { categoryOptions } from './categoryOptions';
import { EMPTY_FILTER, type TransactionFilter } from './filterUrl';
import { TransactionFilters } from './TransactionFilters';

const changes: { filter: TransactionFilter; replace?: boolean }[] = [];

function Harness({ initial = EMPTY_FILTER }: { initial?: TransactionFilter }) {
  const [filter, setFilter] = useState(initial);
  return (
    <>
      <TransactionFilters
        filter={filter}
        accounts={accounts}
        categories={categories}
        onChange={(next, options) => {
          changes.push({ filter: next, replace: options?.replace });
          setFilter(next);
        }}
      />
      <output data-testid="filter">{JSON.stringify(filter)}</output>
    </>
  );
}

/** The text input of a Mantine MultiSelect (its dropdown list carries the same label). */
const selectInput = (label: string) =>
  screen.getAllByLabelText(label).find((element) => element.tagName === 'INPUT')!;

const current = (): TransactionFilter => JSON.parse(screen.getByTestId('filter').textContent!);

beforeEach(() => {
  changes.length = 0;
  vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2026, 10, 1) });
});
afterEach(() => vi.useRealTimers());

describe('categoryOptions', () => {
  it('lists Uncategorized first, then Expense and Income with hidden ones last', () => {
    const options = categoryOptions(categories);
    expect(options.map((g) => g.group)).toEqual(['Other', 'Expense', 'Income']);
    expect(options[0]!.items).toEqual([{ value: 'uncategorized', label: 'Uncategorized' }]);
    expect(options[1]!.items.map((i) => i.label)).toEqual([
      'Groceries',
      'Household',
      'Transfer',
      'Dining (hidden)',
    ]);
    expect(options[2]!.items.map((i) => i.label)).toEqual(['Salary']);
  });
});

describe('TransactionFilters', () => {
  it('turns on "Show transfers" when the Transfer category is picked', async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(selectInput('Categories'));
    await user.click(screen.getByRole('option', { name: 'Transfer' }));

    expect(current()).toMatchObject({ categoryIds: [TRANSFER], includeTransfers: true });
    expect(screen.getByRole('checkbox', { name: 'Show transfers' })).toBeChecked();
  });

  it('maps the Uncategorized option to uncategorized=true', async () => {
    const { user } = renderWithProviders(
      <Harness initial={{ ...EMPTY_FILTER, categoryIds: [DINING], page: 3 }} />,
    );

    await user.click(selectInput('Categories'));
    await user.click(screen.getByRole('option', { name: 'Uncategorized' }));

    expect(current()).toMatchObject({ categoryIds: [DINING], uncategorized: true, page: 1 });
    expect(current().includeTransfers).toBe(false);
  });

  it('filters by account', async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(selectInput('Accounts'));
    await user.click(screen.getByRole('option', { name: 'Card' }));

    expect(current().accountIds).toEqual([2]);
  });

  it('applies search text after a pause, replacing the history entry', async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.type(screen.getByRole('textbox', { name: 'Search' }), ' costco ');
    expect(current().q).toBeUndefined();

    vi.advanceTimersByTime(300);

    await waitFor(() => expect(current().q).toBe('costco'));
    expect(changes).toHaveLength(1);
    expect(changes[0]!.replace).toBe(true);
  });

  it('clears all filters, including the search box', async () => {
    const { user } = renderWithProviders(
      <Harness initial={{ ...EMPTY_FILTER, q: 'costco', includeTransfers: true }} />,
    );
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('costco');

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(current()).toEqual(EMPTY_FILTER);
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
  });

  it('toggles transfers', async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(screen.getByRole('checkbox', { name: 'Show transfers' }));

    expect(current().includeTransfers).toBe(true);
  });
});

describe('PeriodControl', () => {
  it('switches to the current month and steps across years', async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(screen.getByRole('radio', { name: 'Month' }));
    expect(current()).toMatchObject({ dateFrom: '2026-11-01', dateTo: '2026-11-30' });
    expect(screen.getByText('November 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(current()).toMatchObject({ dateFrom: '2027-01-01', dateTo: '2027-01-31' });
  });

  it('shows the year mode for a whole-year range and steps it', async () => {
    const { user } = renderWithProviders(
      <Harness initial={{ ...EMPTY_FILTER, dateFrom: '2025-01-01', dateTo: '2025-12-31' }} />,
    );
    expect(screen.getByRole('radio', { name: 'Year' })).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Previous year' }));

    expect(current()).toMatchObject({ dateFrom: '2024-01-01', dateTo: '2024-12-31' });
  });

  it('switches to the current year and back to all dates', async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(screen.getByRole('radio', { name: 'Year' }));
    expect(current()).toMatchObject({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });

    await user.click(screen.getByRole('radio', { name: 'All' }));
    expect(current().dateFrom).toBeUndefined();
    expect(current().dateTo).toBeUndefined();
  });

  it('keeps custom ranges valid', () => {
    renderWithProviders(
      <Harness initial={{ ...EMPTY_FILTER, dateFrom: '2026-03-05', dateTo: '2026-03-20' }} />,
    );
    expect(screen.getByRole('radio', { name: 'Custom' })).toBeChecked();
    const from = screen.getByLabelText('From');

    fireEvent.change(from, { target: { value: '2026-04-01' } });
    expect(screen.getByText('"From" must not be after "To"')).toBeInTheDocument();
    expect(current().dateFrom).toBe('2026-03-05');

    fireEvent.change(from, { target: { value: '2026-03-01' } });
    expect(screen.queryByText('"From" must not be after "To"')).not.toBeInTheDocument();
    expect(current()).toMatchObject({ dateFrom: '2026-03-01', dateTo: '2026-03-20' });

    fireEvent.change(from, { target: { value: '' } });
    expect(current().dateFrom).toBeUndefined();
  });

  it('opens empty custom inputs from "All"', async () => {
    const { user } = renderWithProviders(<Harness />);

    await user.click(screen.getByRole('radio', { name: 'Custom' }));
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2026-02-28' } });

    expect(screen.getByRole('radio', { name: 'Custom' })).toBeChecked();
    expect(current()).toMatchObject({ dateTo: '2026-02-28' });
  });
});
