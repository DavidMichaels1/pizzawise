// Mirrors the Prisma Size/Crust/Sauce/Topping enums, as plain string arrays
// for use in Fastify JSON-schema route validation (which can't import
// Prisma's generated enum objects directly).
export const SIZES = ['SMALL', 'MEDIUM', 'LARGE'];
export const CRUSTS = ['THIN', 'STUFFED', 'GLUTEN_FREE', 'SOURDOUGH', 'PAN', 'NEAPOLITAN'];
export const SAUCES = ['TOMATO', 'WHITE', 'PESTO', 'BBQ', 'SAN_MARZANO'];
export const TOPPINGS = [
  'MUSHROOM',
  'ONION',
  'OLIVES',
  'EXTRA_CHEESE',
  'PEPPERONI',
  'PINEAPPLE',
  'ANCHOVY',
  'BUFFALO_MOZZARELLA',
  'ARTICHOKE',
  'TRUFFLE_OIL',
  'PROSCIUTTO',
  'CORN',
  'JALAPENO',
];
