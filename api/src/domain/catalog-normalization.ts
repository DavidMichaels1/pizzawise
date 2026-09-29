import type { Crust, Sauce, Topping } from '@prisma/client';

/**
 * Pizzeria catalogs name the same thing differently: "green olives" vs.
 * "olives (green)", "extra_cheese" vs. "Double Cheese", "MUSHROOMS" vs.
 * "mushroom". We normalize each raw label into a token key (lowercased,
 * accent-stripped, punctuation removed, words sorted) so word order and
 * formatting stop mattering, then look that key up in a synonym table.
 * Unrecognized labels simply don't match anything — see README for the
 * documented trade-off (e.g. "porcini mushroom" folds into MUSHROOM,
 * "red onion" folds into ONION; variety distinctions are lost).
 */
function tokenKey(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .sort()
    .join(' ');
}

function buildLookup<T extends string>(synonyms: Record<T, string[]>): Map<string, T> {
  const lookup = new Map<string, T>();
  for (const [canonical, variants] of Object.entries(synonyms) as [T, string[]][]) {
    for (const variant of variants) lookup.set(tokenKey(variant), canonical);
  }
  return lookup;
}

const TOPPING_SYNONYMS: Record<Topping, string[]> = {
  MUSHROOM: ['mushroom', 'mushrooms', 'porcini mushroom'],
  ONION: ['onion', 'onions', 'red onion'],
  OLIVES: ['green olives', 'olives (green)', 'olives'],
  EXTRA_CHEESE: ['extra cheese', 'extra_cheese', 'double cheese'],
  PEPPERONI: ['pepperoni'],
  PINEAPPLE: ['pineapple'],
  ANCHOVY: ['anchovy'],
  BUFFALO_MOZZARELLA: ['buffalo mozzarella'],
  ARTICHOKE: ['artichoke'],
  TRUFFLE_OIL: ['truffle oil'],
  PROSCIUTTO: ['prosciutto'],
  CORN: ['corn'],
  JALAPENO: ['jalapeño', 'jalapeno'],
};

const CRUST_SYNONYMS: Record<Crust, string[]> = {
  THIN: ['thin', 'thin & crispy', 'thin and crispy', 'classic'],
  STUFFED: ['stuffed'],
  GLUTEN_FREE: ['gluten free', 'gf'],
  SOURDOUGH: ['sourdough'],
  PAN: ['pan'],
  NEAPOLITAN: ['neapolitan'],
};

const SAUCE_SYNONYMS: Record<Sauce, string[]> = {
  TOMATO: ['tomato'],
  WHITE: ['white'],
  PESTO: ['pesto'],
  BBQ: ['bbq'],
  SAN_MARZANO: ['san marzano'],
};

const toppingLookup = buildLookup(TOPPING_SYNONYMS);
const crustLookup = buildLookup(CRUST_SYNONYMS);
const sauceLookup = buildLookup(SAUCE_SYNONYMS);

export const matchTopping = (raw: string): Topping | undefined => toppingLookup.get(tokenKey(raw));
export const matchCrust = (raw: string): Crust | undefined => crustLookup.get(tokenKey(raw));
export const matchSauce = (raw: string): Sauce | undefined => sauceLookup.get(tokenKey(raw));
