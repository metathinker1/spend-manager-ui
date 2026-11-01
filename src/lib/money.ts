const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Integer cents for display, e.g. `-1200` → `-$12.00` (floating point for display only). */
export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}
