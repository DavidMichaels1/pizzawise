import { describe, expect, it } from 'vitest';
import { matchCrust, matchSauce, matchTopping } from '../catalog-normalization.ts';

describe('matchTopping', () => {
  it('matches regardless of case', () => {
    expect(matchTopping('MUSHROOMS')).toBe('MUSHROOM');
    expect(matchTopping('mushroom')).toBe('MUSHROOM');
  });

  it('matches regardless of word order and punctuation', () => {
    expect(matchTopping('green olives')).toBe('OLIVES');
    expect(matchTopping('olives (green)')).toBe('OLIVES');
  });

  it('matches underscore and spaced variants the same way', () => {
    expect(matchTopping('extra_cheese')).toBe('EXTRA_CHEESE');
    expect(matchTopping('extra cheese')).toBe('EXTRA_CHEESE');
    expect(matchTopping('Double Cheese')).toBe('EXTRA_CHEESE');
  });

  it('strips accents', () => {
    expect(matchTopping('jalapeño')).toBe('JALAPENO');
    expect(matchTopping('jalapeno')).toBe('JALAPENO');
  });

  it('returns undefined for a topping with no canonical equivalent', () => {
    expect(matchTopping('feta cheese')).toBeUndefined();
  });
});

describe('matchCrust', () => {
  it('folds a pizzeria default into THIN', () => {
    expect(matchCrust('Classic')).toBe('THIN');
    expect(matchCrust('Thin & Crispy')).toBe('THIN');
  });

  it('matches gluten free variants', () => {
    expect(matchCrust('Gluten Free')).toBe('GLUTEN_FREE');
    expect(matchCrust('GF')).toBe('GLUTEN_FREE');
  });
});

describe('matchSauce', () => {
  it('matches multi-word sauces regardless of case', () => {
    expect(matchSauce('San Marzano')).toBe('SAN_MARZANO');
  });
});
