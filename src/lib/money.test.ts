import { formatCents } from './money';

describe('formatCents', () => {
  it.each([
    [0, '$0.00'],
    [5, '$0.05'],
    [-1200, '-$12.00'],
    [123456, '$1,234.56'],
    [-123456789, '-$1,234,567.89'],
  ])('%i → %s', (cents, text) => {
    expect(formatCents(cents)).toBe(text);
  });
});
