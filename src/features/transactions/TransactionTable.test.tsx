import { screen, within } from '@testing-library/react';
import { useState } from 'react';
import { costcoSplit, refundTxn, transferTxn, uncategorizedTxn } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { TransactionTable } from './TransactionTable';

const ITEMS = [refundTxn, costcoSplit, transferTxn, uncategorizedTxn];

function Harness({ autoExpand = false }: { autoExpand?: boolean }) {
  const [filterKey, setFilterKey] = useState(0);
  return (
    <>
      <button onClick={() => setFilterKey((k) => k + 1)}>change filter</button>
      <TransactionTable key={filterKey} items={ITEMS} autoExpand={autoExpand} />
    </>
  );
}

describe('TransactionTable', () => {
  it('shows one row per transaction with formatted values', () => {
    renderWithProviders(<Harness />);

    const refund = screen.getByTestId('transaction-row-108');
    expect(within(refund).getByText('Mar 15, 2026')).toBeInTheDocument();
    expect(within(refund).getByText('$15.00')).toBeInTheDocument();
    expect(
      within(screen.getByTestId('transaction-row-106')).getByText('Split (2)'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('transaction-row-106')).getByText('-$120.00'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('transaction-row-104')).getByText('Uncategorized'),
    ).toBeInTheDocument();
  });

  it('marks transfer lines with a badge', () => {
    renderWithProviders(<Harness />);

    expect(
      within(screen.getByTestId('transaction-row-105')).getByText('Transfer', {
        selector: '.mantine-Badge-label',
      }),
    ).toBeInTheDocument();
  });

  it('keeps splits collapsed by default and expands on click', async () => {
    const { user } = renderWithProviders(<Harness />);
    const expander = screen.getByRole('button', { name: 'Show splits of COSTCO' });

    expect(expander).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('split-row-201')).not.toBeInTheDocument();

    await user.click(expander);

    expect(screen.getByRole('button', { name: 'Hide splits of COSTCO' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByTestId('split-row-201')).toBeInTheDocument();
    expect(screen.getByTestId('split-row-202')).toBeInTheDocument();
  });

  it('starts expanded with a category condition and dims splits outside the filter', () => {
    renderWithProviders(<Harness autoExpand />);

    const matching = screen.getByTestId('split-row-201');
    const other = screen.getByTestId('split-row-202');
    expect(matching).toHaveAttribute('data-matches', 'true');
    expect(within(matching).queryByText(/not in filter/i)).not.toBeInTheDocument();
    expect(other).toHaveAttribute('data-matches', 'false');
    expect(within(other).getByText(/not in filter/i)).toBeInTheDocument();
    expect(within(other).getByText('paper towels')).toBeInTheDocument();
  });

  it('resets manual toggles when the filter changes', async () => {
    const { user } = renderWithProviders(<Harness autoExpand />);

    await user.click(screen.getByRole('button', { name: 'Hide splits of COSTCO' }));
    expect(screen.queryByTestId('split-row-201')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'change filter' }));

    expect(screen.getByTestId('split-row-201')).toBeInTheDocument();
  });
});
