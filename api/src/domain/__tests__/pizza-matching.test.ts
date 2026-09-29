import { describe, expect, it } from 'vitest';
import type { NormalizedMenu } from '../menu.ts';
import { matchPizzaAgainstMenu } from '../pizza-matching.ts';

const menu: NormalizedMenu = {
  pizzeriaId: 'p1',
  sizes: [
    { id: 's', label: 'Small', priceAgorot: 3500 },
    { id: 'm', label: 'Medium', priceAgorot: 4900 },
    { id: 'l', label: 'Large', priceAgorot: 6200 },
  ],
  crusts: [
    { id: 'thin', label: 'Thin', priceAgorot: 0 },
    { id: 'stuffed', label: 'Stuffed', priceAgorot: 900 },
  ],
  sauces: ['tomato', 'white'],
  toppings: [
    { id: 't1', name: 'mushroom', priceAgorot: 400 },
    { id: 't2', name: 'onion', priceAgorot: 300 },
  ],
};

describe('matchPizzaAgainstMenu', () => {
  it('prices an exact match and reports it as such', () => {
    const result = matchPizzaAgainstMenu(menu, {
      size: 'MEDIUM',
      crust: 'THIN',
      sauce: 'TOMATO',
      toppings: ['MUSHROOM'],
    });
    expect(result).toEqual({
      priceAgorot: 4900 + 0 + 400,
      matchQuality: 'exact',
      crustAvailable: true,
      sauceAvailable: true,
      missingToppings: [],
    });
  });

  it('sums multiple matched toppings onto the size and crust surcharge', () => {
    const result = matchPizzaAgainstMenu(menu, {
      size: 'LARGE',
      crust: 'STUFFED',
      sauce: 'WHITE',
      toppings: ['MUSHROOM', 'ONION'],
    });
    expect(result.priceAgorot).toBe(6200 + 900 + 400 + 300);
    expect(result.matchQuality).toBe('exact');
  });

  it('flags an unavailable crust as approximate but still prices the base pizza', () => {
    const result = matchPizzaAgainstMenu(menu, {
      size: 'SMALL',
      crust: 'GLUTEN_FREE',
      sauce: 'TOMATO',
      toppings: [],
    });
    expect(result.crustAvailable).toBe(false);
    expect(result.matchQuality).toBe('approximate');
    expect(result.priceAgorot).toBe(3500); // no crust surcharge applied
  });

  it('lists exactly the toppings that could not be matched, without charging for them', () => {
    const result = matchPizzaAgainstMenu(menu, {
      size: 'SMALL',
      crust: 'THIN',
      sauce: 'TOMATO',
      toppings: ['MUSHROOM', 'PEPPERONI'],
    });
    expect(result.missingToppings).toEqual(['PEPPERONI']);
    expect(result.priceAgorot).toBe(3500 + 400);
    expect(result.matchQuality).toBe('approximate');
  });

  it('flags an unavailable sauce', () => {
    const result = matchPizzaAgainstMenu(menu, {
      size: 'SMALL',
      crust: 'THIN',
      sauce: 'PESTO',
      toppings: [],
    });
    expect(result.sauceAvailable).toBe(false);
    expect(result.matchQuality).toBe('approximate');
  });
});
