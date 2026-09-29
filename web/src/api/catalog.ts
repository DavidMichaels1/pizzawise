// Mirrors the backend's canonical taxonomy (api/src/domain/catalog-enums.ts).
// Duplicated rather than shared across the two independent apps/packages —
// a fine trade-off at this scale, called out in the README.
export type Size = 'SMALL' | 'MEDIUM' | 'LARGE';
export type Crust = 'THIN' | 'STUFFED' | 'GLUTEN_FREE' | 'SOURDOUGH' | 'PAN' | 'NEAPOLITAN';
export type Sauce = 'TOMATO' | 'WHITE' | 'PESTO' | 'BBQ' | 'SAN_MARZANO';
export type Topping =
  | 'MUSHROOM'
  | 'ONION'
  | 'OLIVES'
  | 'EXTRA_CHEESE'
  | 'PEPPERONI'
  | 'PINEAPPLE'
  | 'ANCHOVY'
  | 'BUFFALO_MOZZARELLA'
  | 'ARTICHOKE'
  | 'TRUFFLE_OIL'
  | 'PROSCIUTTO'
  | 'CORN'
  | 'JALAPENO';

export const SIZE_OPTIONS: { value: Size; label: string }[] = [
  { value: 'SMALL', label: 'Small' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LARGE', label: 'Large' },
];

export const CRUST_OPTIONS: { value: Crust; label: string }[] = [
  { value: 'THIN', label: 'Thin' },
  { value: 'STUFFED', label: 'Stuffed' },
  { value: 'GLUTEN_FREE', label: 'Gluten Free' },
  { value: 'SOURDOUGH', label: 'Sourdough' },
  { value: 'PAN', label: 'Pan' },
  { value: 'NEAPOLITAN', label: 'Neapolitan' },
];

export const SAUCE_OPTIONS: { value: Sauce; label: string }[] = [
  { value: 'TOMATO', label: 'Tomato' },
  { value: 'WHITE', label: 'White' },
  { value: 'PESTO', label: 'Pesto' },
  { value: 'BBQ', label: 'BBQ' },
  { value: 'SAN_MARZANO', label: 'San Marzano' },
];

export const TOPPING_OPTIONS: { value: Topping; label: string }[] = [
  { value: 'MUSHROOM', label: 'Mushroom' },
  { value: 'ONION', label: 'Onion' },
  { value: 'OLIVES', label: 'Olives' },
  { value: 'EXTRA_CHEESE', label: 'Extra Cheese' },
  { value: 'PEPPERONI', label: 'Pepperoni' },
  { value: 'PINEAPPLE', label: 'Pineapple' },
  { value: 'ANCHOVY', label: 'Anchovy' },
  { value: 'BUFFALO_MOZZARELLA', label: 'Buffalo Mozzarella' },
  { value: 'ARTICHOKE', label: 'Artichoke' },
  { value: 'TRUFFLE_OIL', label: 'Truffle Oil' },
  { value: 'PROSCIUTTO', label: 'Prosciutto' },
  { value: 'CORN', label: 'Corn' },
  { value: 'JALAPENO', label: 'Jalapeño' },
];

export interface PizzaConfig {
  size: Size;
  crust: Crust;
  sauce: Sauce;
  toppings: Topping[];
}
