// Mirrors the backend's canonical taxonomy (api/src/domain/catalog-enums.ts)
// and the web app's preset areas (web/src/components/LocationPicker.tsx) —
// duplicated rather than imported across package boundaries, the same
// deliberate trade-off called out in the README for web vs. api.
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

export const PRESET_AREAS: Record<string, { lat: number; lng: number }> = {
  'Dizengoff Center': { lat: 32.0748, lng: 34.7746 },
  'Rothschild Blvd': { lat: 32.0644, lng: 34.7748 },
  Florentin: { lat: 32.0567, lng: 34.7679 },
  'Neve Tzedek': { lat: 32.0616, lng: 34.7651 },
  'Ramat Aviv': { lat: 32.1133, lng: 34.8044 },
  'Jaffa Port': { lat: 32.0523, lng: 34.7519 },
};
