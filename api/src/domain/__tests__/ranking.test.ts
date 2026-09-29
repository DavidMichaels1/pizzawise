import { describe, expect, it } from 'vitest';
import { rankByValue } from '../ranking.ts';

const candidate = (
  priceAgorot: number,
  matchQuality: 'exact' | 'approximate',
  distanceKm = 1,
  etaMinutes: number | null = 20,
) => ({ priceAgorot, matchQuality, distanceKm, etaMinutes });

describe('rankByValue', () => {
  it('puts every exact match before every approximate match, regardless of value score', () => {
    const cheapApproximate = candidate(2000, 'approximate');
    const pricierExact = candidate(9000, 'exact');
    expect(rankByValue([cheapApproximate, pricierExact])).toEqual([pricierExact, cheapApproximate]);
  });

  it('sorts by price when distance and ETA are equal across candidates', () => {
    const a = candidate(5000, 'exact');
    const b = candidate(3000, 'exact');
    const c = candidate(7000, 'exact');
    expect(rankByValue([a, b, c])).toEqual([b, a, c]);
  });

  it('lets a closer, pricier pizzeria outrank a cheaper but much farther one', () => {
    const cheapButFar = candidate(3000, 'exact', 20, 60);
    const pricierButClose = candidate(3200, 'exact', 0.5, 10);
    expect(rankByValue([cheapButFar, pricierButClose])).toEqual([pricierButClose, cheapButFar]);
  });

  it('treats a missing ETA as the worst observed ETA, not the best', () => {
    const best = candidate(5000, 'exact', 1, 10);
    const worst = candidate(5000, 'exact', 1, 50);
    const unknown = candidate(5000, 'exact', 1, null);
    const ranked = rankByValue([unknown, best, worst]);
    expect(ranked[0]).toEqual(best);
    expect(ranked[ranked.length - 1]).not.toEqual(best);
  });

  it('groups and sorts a mix of both match qualities correctly', () => {
    const exactCheap = candidate(3000, 'exact');
    const exactPricey = candidate(6000, 'exact');
    const approxCheap = candidate(1000, 'approximate');
    const approxPricey = candidate(4000, 'approximate');
    expect(rankByValue([approxPricey, exactPricey, approxCheap, exactCheap])).toEqual([
      exactCheap,
      exactPricey,
      approxCheap,
      approxPricey,
    ]);
  });

  it('returns an empty array unchanged', () => {
    expect(rankByValue([])).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const input = [candidate(5000, 'exact'), candidate(3000, 'exact')];
    const copy = [...input];
    rankByValue(input);
    expect(input).toEqual(copy);
  });
});
