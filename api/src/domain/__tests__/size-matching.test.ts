import { describe, expect, it } from 'vitest';
import { matchSize } from '../size-matching.ts';

const size = (id: string, priceAgorot: number) => ({ id, label: id, priceAgorot });

describe('matchSize', () => {
  it('maps small/medium/large onto a 3-tier pizzeria exactly', () => {
    const sizes = [size('s', 3500), size('m', 4900), size('l', 6200)];
    expect(matchSize(sizes, 'SMALL')).toEqual({ raw: sizes[0], exact: true });
    expect(matchSize(sizes, 'MEDIUM')).toEqual({ raw: sizes[1], exact: true });
    expect(matchSize(sizes, 'LARGE')).toEqual({ raw: sizes[2], exact: true });
  });

  it('is indifferent to input order (sorts by price first)', () => {
    const sizes = [size('l', 9800), size('s', 4200)];
    expect(matchSize(sizes, 'SMALL').raw.id).toBe('s');
    expect(matchSize(sizes, 'LARGE').raw.id).toBe('l');
  });

  it('approximates a 2-tier pizzeria: small/medium to the cheaper, large to the pricier', () => {
    const sizes = [size('sm', 3390), size('lg', 5900)];
    expect(matchSize(sizes, 'SMALL')).toEqual({ raw: sizes[0], exact: false });
    expect(matchSize(sizes, 'MEDIUM')).toEqual({ raw: sizes[0], exact: false });
    expect(matchSize(sizes, 'LARGE')).toEqual({ raw: sizes[1], exact: false });
  });

  it('maps every request onto a single-size pizzeria', () => {
    const sizes = [size('one', 5200)];
    for (const requested of ['SMALL', 'MEDIUM', 'LARGE'] as const) {
      expect(matchSize(sizes, requested)).toEqual({ raw: sizes[0], exact: false });
    }
  });

  it('throws when a pizzeria has no sizes at all', () => {
    expect(() => matchSize([], 'MEDIUM')).toThrow();
  });
});
