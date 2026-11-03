import { categories, DINING, GROCERIES, HOUSEHOLD } from '../../test/fixtures';
import {
  categoryDrillDownUrl,
  periodRange,
  spendingCategoryIds,
  totalDrillDownUrl,
} from './drillDown';

const AUGUST = { dateFrom: '2026-08-01', dateTo: '2026-08-31' };

describe('drill-down', () => {
  it('maps a category value to its category and dates', () => {
    expect(categoryDrillDownUrl(GROCERIES, AUGUST)).toBe(
      '/transactions?date_from=2026-08-01&date_to=2026-08-31&category_id=10',
    );
  });

  it('maps the Uncategorized row to uncategorized=true', () => {
    expect(categoryDrillDownUrl(null, AUGUST)).toBe(
      '/transactions?date_from=2026-08-01&date_to=2026-08-31&uncategorized=true',
    );
  });

  it('counts every expense category except Transfer as spending', () => {
    expect(spendingCategoryIds(categories)).toEqual([GROCERIES, HOUSEHOLD, DINING]);
    expect(
      spendingCategoryIds([{ id: 1, name: ' TRANSFER ', type: 'expense', is_hidden: false }]),
    ).toEqual([]);
  });

  it('maps a total to all spending categories plus uncategorized, transfers hidden', () => {
    const url = totalDrillDownUrl(categories, AUGUST);
    expect(url).toBe(
      '/transactions?date_from=2026-08-01&date_to=2026-08-31' +
        '&category_id=10&category_id=11&category_id=12&uncategorized=true',
    );
    expect(url).not.toContain('include_transfers');
  });

  it('uses the report period dates', () => {
    expect(periodRange({ date_from: '2025-04-01', date_to: '2026-03-31' })).toEqual({
      dateFrom: '2025-04-01',
      dateTo: '2026-03-31',
    });
  });
});
