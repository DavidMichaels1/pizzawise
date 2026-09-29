export interface RankableCandidate {
  priceAgorot: number;
  matchQuality: 'exact' | 'approximate';
}

/**
 * Exact matches (every requested size/crust/sauce/topping was actually
 * available) sort before approximate ones (something was substituted or
 * missing) — users should never see a compromised match ranked above a
 * pizzeria that could fulfill the order exactly, even at a higher price.
 * Within each group, cheapest first.
 */
export function rankByValue<T extends RankableCandidate>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => {
    if (a.matchQuality !== b.matchQuality) return a.matchQuality === 'exact' ? -1 : 1;
    return a.priceAgorot - b.priceAgorot;
  });
}
