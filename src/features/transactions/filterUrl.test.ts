import {
  apiQuery,
  EMPTY_FILTER,
  exportCsvUrl,
  hasCategoryCondition,
  isEmptyFilter,
  PAGE_SIZE,
  parseFilter,
  serializeFilter,
  transactionsUrl,
  withChange,
  type TransactionFilter,
} from './filterUrl';

const parse = (query: string) => parseFilter(new URLSearchParams(query));

const FULL: TransactionFilter = {
  dateFrom: '2026-08-01',
  dateTo: '2026-08-31',
  accountIds: [2, 4],
  categoryIds: [12],
  uncategorized: true,
  includeTransfers: true,
  q: 'costco',
  page: 3,
};

describe('parseFilter', () => {
  it('reads every parameter', () => {
    expect(
      parse(
        'date_from=2026-08-01&date_to=2026-08-31&account_id=4&account_id=2&category_id=12' +
          '&uncategorized=true&include_transfers=true&q=costco&page=3',
      ),
    ).toEqual(FULL);
  });

  it('defaults to the empty filter', () => {
    expect(parse('')).toEqual({
      ...EMPTY_FILTER,
      dateFrom: undefined,
      dateTo: undefined,
      q: undefined,
    });
  });

  it.each([
    ['date_from=2026-13-01', 'dateFrom'],
    ['date_from=2026-02-30', 'dateFrom'],
    ['date_to=yesterday', 'dateTo'],
  ])('drops invalid dates: %s', (query, field) => {
    expect(parse(query)[field as 'dateFrom']).toBeUndefined();
  });

  it('drops non-numeric ids, removes duplicates and sorts', () => {
    expect(parse('account_id=x&account_id=3&account_id=1&account_id=3').accountIds).toEqual([1, 3]);
    expect(parse('category_id=-1&category_id=1.5&category_id=7').categoryIds).toEqual([7]);
  });

  it.each(['page=0', 'page=-2', 'page=abc', 'page=1.5'])('drops an invalid page: %s', (query) => {
    expect(parse(query).page).toBe(1);
  });

  it('only accepts "true" for flags', () => {
    expect(parse('uncategorized=1&include_transfers=yes')).toMatchObject({
      uncategorized: false,
      includeTransfers: false,
    });
  });

  it('trims the search text, ignores blanks and limits the length', () => {
    expect(parse('q=%20%20coffee%20').q).toBe('coffee');
    expect(parse('q=%20%20').q).toBeUndefined();
    expect(parse(`q=${'x'.repeat(150)}`).q).toHaveLength(100);
  });
});

describe('serializeFilter', () => {
  it('round-trips', () => {
    expect(parseFilter(serializeFilter(FULL))).toEqual(FULL);
  });

  it('omits defaults', () => {
    expect(serializeFilter(EMPTY_FILTER).toString()).toBe('');
    expect(serializeFilter({ ...EMPTY_FILTER, page: 1, q: '' }).toString()).toBe('');
  });

  it('sorts ids so equal filters give equal URLs', () => {
    const a = serializeFilter({ ...EMPTY_FILTER, accountIds: [4, 2], categoryIds: [9, 1] });
    const b = serializeFilter({ ...EMPTY_FILTER, accountIds: [2, 4], categoryIds: [1, 9] });
    expect(a.toString()).toBe(b.toString());
    expect(a.toString()).toBe('account_id=2&account_id=4&category_id=1&category_id=9');
  });

  it('can leave out the page', () => {
    expect(serializeFilter(FULL, { withPage: false }).has('page')).toBe(false);
  });
});

describe('URLs and API parameters', () => {
  it('builds the API query with the fixed page size', () => {
    expect(apiQuery(FULL)).toEqual({
      date_from: '2026-08-01',
      date_to: '2026-08-31',
      account_id: [2, 4],
      category_id: [12],
      uncategorized: true,
      include_transfers: true,
      q: 'costco',
      page: 3,
      page_size: PAGE_SIZE,
    });
    expect(apiQuery(EMPTY_FILTER)).toEqual({ page: 1, page_size: 50 });
  });

  it('builds list and CSV URLs', () => {
    expect(transactionsUrl(EMPTY_FILTER)).toBe('/transactions');
    expect(transactionsUrl({ ...EMPTY_FILTER, uncategorized: true, page: 2 })).toBe(
      '/transactions?uncategorized=true&page=2',
    );
    expect(exportCsvUrl(FULL)).toBe(
      '/api/transactions/export.csv?date_from=2026-08-01&date_to=2026-08-31&account_id=2' +
        '&account_id=4&category_id=12&uncategorized=true&include_transfers=true&q=costco',
    );
    expect(exportCsvUrl(EMPTY_FILTER)).toBe('/api/transactions/export.csv');
  });
});

describe('filter helpers', () => {
  it('resets the page on any change', () => {
    expect(withChange(FULL, { q: 'safeway' })).toMatchObject({ q: 'safeway', page: 1 });
  });

  it('detects a category condition', () => {
    expect(hasCategoryCondition(EMPTY_FILTER)).toBe(false);
    expect(hasCategoryCondition({ ...EMPTY_FILTER, q: 'x', includeTransfers: true })).toBe(false);
    expect(hasCategoryCondition({ ...EMPTY_FILTER, categoryIds: [1] })).toBe(true);
    expect(hasCategoryCondition({ ...EMPTY_FILTER, uncategorized: true })).toBe(true);
  });

  it('detects the empty filter regardless of page', () => {
    expect(isEmptyFilter({ ...EMPTY_FILTER, page: 4 })).toBe(true);
    expect(isEmptyFilter({ ...EMPTY_FILTER, includeTransfers: true })).toBe(false);
  });
});
