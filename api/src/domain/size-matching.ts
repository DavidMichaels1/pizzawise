import type { Size } from '@prisma/client';

export interface RawSize {
  id: string;
  label: string;
  priceAgorot: number;
}

export interface SizeMatch {
  raw: RawSize;
  /** false when the pizzeria's tier count forced an approximation. */
  exact: boolean;
}

const SIZE_RANK: Record<Size, number> = { SMALL: 0, MEDIUM: 1, LARGE: 2 };

/**
 * Pizzeria size labels are too inconsistent to match by name (S/M/L,
 * Piccola/Grande, Personal/Family, a single "One Size"...). Instead we sort
 * a pizzeria's own sizes cheapest-to-priciest and map our canonical
 * Small/Medium/Large onto that ordinal scale. This works uniformly no
 * matter how many tiers a pizzeria offers.
 */
export function matchSize(sizes: RawSize[], requested: Size): SizeMatch {
  const sorted = [...sizes].sort((a, b) => a.priceAgorot - b.priceAgorot);
  // Floor (not round) so a tie between tiers favors the cheaper one — a
  // pizzeria with 2 sizes shouldn't charge MEDIUM requests LARGE prices.
  const index = Math.floor((SIZE_RANK[requested] / 2) * (sorted.length - 1));
  const raw = sorted[index];
  if (!raw) throw new Error('Pizzeria has no sizes');
  return { raw, exact: sorted.length === 3 };
}
