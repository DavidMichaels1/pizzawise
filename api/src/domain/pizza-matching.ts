import type { Crust, Sauce, Size, Topping } from '@prisma/client';
import { matchCrust, matchSauce, matchTopping } from './catalog-normalization.ts';
import type { NormalizedMenu } from './menu.ts';
import { matchSize } from './size-matching.ts';

export interface PizzaRequest {
  size: Size;
  crust: Crust;
  sauce: Sauce;
  toppings: Topping[];
}

export interface MatchedPizza {
  priceAgorot: number;
  /** 'approximate' means at least one field below couldn't be matched exactly. */
  matchQuality: 'exact' | 'approximate';
  crustAvailable: boolean;
  sauceAvailable: boolean;
  missingToppings: Topping[];
}

/** Prices a canonical pizza request against one pizzeria's normalized menu. */
export function matchPizzaAgainstMenu(menu: NormalizedMenu, request: PizzaRequest): MatchedPizza {
  const sizeMatch = matchSize(menu.sizes, request.size);
  const crustMatch = menu.crusts.find((c) => matchCrust(c.label) === request.crust);
  const sauceAvailable = menu.sauces.some((s) => matchSauce(s) === request.sauce);

  const matchedToppings = menu.toppings.filter((t) => {
    const canonical = matchTopping(t.name);
    return canonical !== undefined && request.toppings.includes(canonical);
  });
  const matchedSet = new Set(matchedToppings.map((t) => matchTopping(t.name)));
  const missingToppings = request.toppings.filter((t) => !matchedSet.has(t));

  const priceAgorot =
    sizeMatch.raw.priceAgorot +
    (crustMatch?.priceAgorot ?? 0) +
    matchedToppings.reduce((sum, t) => sum + t.priceAgorot, 0);

  const matchQuality: MatchedPizza['matchQuality'] =
    sizeMatch.exact && crustMatch !== undefined && sauceAvailable && missingToppings.length === 0
      ? 'exact'
      : 'approximate';

  return {
    priceAgorot,
    matchQuality,
    crustAvailable: crustMatch !== undefined,
    sauceAvailable,
    missingToppings,
  };
}
