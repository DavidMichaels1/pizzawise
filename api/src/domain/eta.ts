/**
 * The pizzeria API reports avgEtaMinutes inconsistently: a plain number, a
 * range string like "40-50", or null. We collapse it to a single number
 * (the range's midpoint) or null, so downstream code never branches on type.
 */
export function normalizeEtaMinutes(value: number | string | null): number | null {
  if (value === null) return null;
  if (typeof value === 'number') return value;

  const [lo, hi] = value.split('-').map(Number);
  if (lo === undefined || hi === undefined || Number.isNaN(lo) || Number.isNaN(hi)) return null;
  return Math.round((lo + hi) / 2);
}
