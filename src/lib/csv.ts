// CSV building for report downloads (Functional Design §3.12): RFC 4180
// quoting and the same formula guard as the service's transaction CSV.

/** A cell written as-is: numbers and amounts are never formula-guarded. */
export type RawCell = { raw: string };
export type CsvCell = string | number | RawCell;

const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

/** Integer cents as dollars without floating point, e.g. `-1230` → `-12.30`. */
export function centsToCsvAmount(cents: number): string {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, '0');
  return `${cents < 0 ? '-' : ''}${dollars}.${rest}`;
}

export function amountCell(cents: number): RawCell {
  return { raw: centsToCsvAmount(cents) };
}

export function guardFormula(text: string): string {
  return FORMULA_PREFIXES.some((prefix) => text.startsWith(prefix)) ? `'${text}` : text;
}

export function csvCell(cell: CsvCell): string {
  const text =
    typeof cell === 'number'
      ? String(cell)
      : typeof cell === 'string'
        ? guardFormula(cell)
        : cell.raw;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: CsvCell[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** Save `text` as a UTF-8 file through a temporary object URL. */
export function downloadCsv(fileName: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
