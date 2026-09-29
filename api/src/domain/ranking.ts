export interface RankableCandidate {
  priceAgorot: number;
  distanceKm: number;
  etaMinutes: number | null;
  matchQuality: 'exact' | 'approximate';
}

// Roughly balances price and distance, with ETA a lighter third factor —
// there's no "correct" split the brief specifies, so this favors not
// letting any single dimension dominate just because of its raw units.
const WEIGHTS = { price: 0.4, distance: 0.4, eta: 0.2 } as const;

/** Min-max normalizes `value` against `values` to [0, 1], lower is better. Flat sets normalize to 0 for everyone. */
function normalize(values: number[], value: number): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return max === min ? 0 : (value - min) / (max - min);
}

/**
 * Exact matches (every requested size/crust/sauce/topping was actually
 * available) sort before approximate ones (something was substituted or
 * missing) — users should never see a compromised match ranked above a
 * pizzeria that could fulfill the order exactly, even at a higher price.
 *
 * Within each group, candidates are ranked by a composite value score
 * blending price, distance, and ETA (see WEIGHTS) rather than price alone.
 * Each dimension is min-max normalized across the whole candidate set
 * first, so a few agorot of price difference doesn't get drowned out by
 * distance being measured in whole kilometers, or vice versa. A missing
 * ETA is substituted with the worst *known* ETA in the set rather than
 * the best, so an unknown wait time never outranks a known one.
 */
export function rankByValue<T extends RankableCandidate>(candidates: T[]): T[] {
  const prices = candidates.map((c) => c.priceAgorot);
  const distances = candidates.map((c) => c.distanceKm);
  const knownEtas = candidates.map((c) => c.etaMinutes).filter((eta): eta is number => eta !== null);
  const worstKnownEta = knownEtas.length > 0 ? Math.max(...knownEtas) : 0;
  const effectiveEta = (c: T) => c.etaMinutes ?? worstKnownEta;
  const etas = candidates.map(effectiveEta);

  const valueScore = (c: T) =>
    WEIGHTS.price * normalize(prices, c.priceAgorot) +
    WEIGHTS.distance * normalize(distances, c.distanceKm) +
    WEIGHTS.eta * normalize(etas, effectiveEta(c));

  return [...candidates].sort((a, b) => {
    if (a.matchQuality !== b.matchQuality) return a.matchQuality === 'exact' ? -1 : 1;
    return valueScore(a) - valueScore(b);
  });
}
