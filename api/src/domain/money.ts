/**
 * Internal money unit is always integer agorot (1 ILS = 100 agorot), so
 * comparisons and sums never touch floating point. Pizzeria adapters convert
 * into this unit at the boundary; nothing downstream needs to know a given
 * pizzeria priced in cents or in decimal shekels.
 */
export function shekelsToAgorot(shekels: number): number {
  return Math.round(shekels * 100);
}

export function agorotToShekels(agorot: number): number {
  return agorot / 100;
}
