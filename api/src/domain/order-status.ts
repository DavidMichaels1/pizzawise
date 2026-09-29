export type OrderStatus = 'PLACED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

// Used when a pizzeria didn't report an ETA — only for pacing the status
// simulation below, never shown to the user as a real estimate.
const FALLBACK_ETA_MINUTES = 45;

/**
 * There's no real kitchen behind this order, so status isn't a stored state
 * machine driven by events — it's a pure function of elapsed time against
 * the pizzeria's ETA. Cancellation is the one genuine state, so it's an
 * explicit override.
 */
export function deriveOrderStatus(
  placedAt: Date,
  etaMinutes: number | null,
  cancelledAt: Date | null,
  now: Date = new Date(),
): OrderStatus {
  if (cancelledAt) return 'CANCELLED';

  const eta = etaMinutes ?? FALLBACK_ETA_MINUTES;
  const elapsedMinutes = (now.getTime() - placedAt.getTime()) / 60_000;

  if (elapsedMinutes >= eta) return 'DELIVERED';
  if (elapsedMinutes >= eta * 0.6) return 'OUT_FOR_DELIVERY';
  if (elapsedMinutes >= eta * 0.2) return 'PREPARING';
  return 'PLACED';
}
