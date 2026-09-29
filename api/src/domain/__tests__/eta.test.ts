import { describe, expect, it } from 'vitest';
import { normalizeEtaMinutes } from '../eta.ts';

describe('normalizeEtaMinutes', () => {
  it('passes a plain number through', () => {
    expect(normalizeEtaMinutes(25)).toBe(25);
  });

  it('passes null through', () => {
    expect(normalizeEtaMinutes(null)).toBeNull();
  });

  it('collapses a range string to its midpoint', () => {
    expect(normalizeEtaMinutes('40-50')).toBe(45);
  });

  it('rounds a midpoint that lands on .5', () => {
    expect(normalizeEtaMinutes('20-31')).toBe(26); // 25.5 -> 26
  });

  it('treats a malformed range as unknown', () => {
    expect(normalizeEtaMinutes('soon')).toBeNull();
  });
});
