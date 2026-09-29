import { describe, expect, it } from 'vitest';
import { deriveOrderStatus } from '../order-status.ts';

const PLACED_AT = new Date('2026-01-01T12:00:00Z');
const minutesLater = (m: number) => new Date(PLACED_AT.getTime() + m * 60_000);

describe('deriveOrderStatus', () => {
  it('is PLACED right away', () => {
    expect(deriveOrderStatus(PLACED_AT, 40, null, minutesLater(0))).toBe('PLACED');
  });

  it('moves through PREPARING, OUT_FOR_DELIVERY, then DELIVERED as ETA elapses', () => {
    expect(deriveOrderStatus(PLACED_AT, 40, null, minutesLater(10))).toBe('PREPARING');
    expect(deriveOrderStatus(PLACED_AT, 40, null, minutesLater(30))).toBe('OUT_FOR_DELIVERY');
    expect(deriveOrderStatus(PLACED_AT, 40, null, minutesLater(41))).toBe('DELIVERED');
  });

  it('falls back to a default pace when ETA is unknown', () => {
    expect(deriveOrderStatus(PLACED_AT, null, null, minutesLater(0))).toBe('PLACED');
    expect(deriveOrderStatus(PLACED_AT, null, null, minutesLater(100))).toBe('DELIVERED');
  });

  it('is CANCELLED regardless of elapsed time, even after it would have been delivered', () => {
    const cancelledAt = minutesLater(5);
    expect(deriveOrderStatus(PLACED_AT, 40, cancelledAt, minutesLater(5))).toBe('CANCELLED');
    expect(deriveOrderStatus(PLACED_AT, 40, cancelledAt, minutesLater(999))).toBe('CANCELLED');
  });
});
