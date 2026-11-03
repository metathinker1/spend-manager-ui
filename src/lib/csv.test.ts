import { amountCell, centsToCsvAmount, csvCell, downloadCsv, guardFormula, toCsv } from './csv';

describe('csv', () => {
  it.each([
    [0, '0.00'],
    [5, '0.05'],
    [-5, '-0.05'],
    [-1230, '-12.30'],
    [123456, '1234.56'],
  ])('formats %i cents as %s', (cents, text) => {
    expect(centsToCsvAmount(cents)).toBe(text);
  });

  it.each([
    ['=SUM(A1)', "'=SUM(A1)"],
    ['+1', "'+1"],
    ['-1', "'-1"],
    ['@x', "'@x"],
    ['\tx', "'\tx"],
    ['\rx', "'\rx"],
    ['Safe = ok', 'Safe = ok'],
  ])('guards formulas: %j', (text, guarded) => {
    expect(guardFormula(text)).toBe(guarded);
  });

  it('quotes per RFC 4180 and never guards numbers or amounts', () => {
    expect(csvCell('Joe\'s "Diner", Inc.')).toBe('"Joe\'s ""Diner"", Inc."');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell(-3)).toBe('-3');
    expect(csvCell(amountCell(-1230))).toBe('-12.30');
    expect(csvCell('-12.30')).toBe("'-12.30");
  });

  it('joins rows with CRLF', () => {
    expect(
      toCsv([
        ['a', 'b'],
        ['c', 1],
      ]),
    ).toBe('a,b\r\nc,1\r\n');
  });

  it('downloads through a temporary object URL', () => {
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return 'blob:test';
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv('report.csv', 'a,b\r\n');

    expect(click).toHaveBeenCalledOnce();
    expect(created[0]?.type).toBe('text/csv;charset=utf-8');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
