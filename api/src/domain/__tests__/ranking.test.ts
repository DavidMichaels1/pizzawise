import { describe, expect, it } from 'vitest';
import { rankByValue } from '../ranking.ts';

const candidate = (priceAgorot: number, matchQuality: 'exact' | 'approximate') => ({ priceAgorot, matchQuality });

describe('rankByValue', () => {
  it('puts every exact match before every approximate match, regardless of price', () => {
    const cheapApproximate = candidate(2000, 'approximate');
    const pricierExact = candidate(9000, 'exact');
    expect(rankByValue([cheapApproximate, pricierExact])).toEqual([pricierExact, cheapApproximate]);
  });

  it('sorts exact matches cheapest first', () => {
    const a = candidate(5000, 'exact');
    const b = candidate(3000, 'exact');
    const c = candidate(7000, 'exact');
    expect(rankByValue([a, b, c])).toEqual([b, a, c]);
  });

  it('sorts approximate matches cheapest first', () => {
    const a = candidate(5000, 'approximate');
    const b = candidate(3000, 'approximate');
    const c = candidate(7000, 'approximate');
    expect(rankByValue([a, b, c])).toEqual([b, a, c]);
  });

  it('groups and sorts a mix of both correctly', () => {
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
