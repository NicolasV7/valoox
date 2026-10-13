import { expect, test } from 'vitest';
import { expiresAt } from '../../src/lib/expiry.ts';
import { storeView } from '../workers/fixtures.ts';

test('every store section can invalidate the view before the daily rotation', () => {
  const view = { ...storeView(), fetchedAt: 1000, remaining: 3600 };
  expect(expiresAt(view)).toBe(4600000);
  expect(expiresAt({ ...view, bundles: [{ remaining: 60 }] })).toBe(1060000);
  expect(expiresAt({ ...view, night: { remaining: 30 } })).toBe(1030000);
  expect(expiresAt({ ...view, accessory: { remaining: 10 } })).toBe(1010000);
});

test('zero and negative durations are stale, rather than ignored as absent', () => {
  const view = { ...storeView(), fetchedAt: 1000 };
  for (const remaining of [0, -5]) {
    expect(expiresAt({ ...view, bundles: [{ remaining }] })).toBe(1000000);
    expect(expiresAt({ ...view, night: { remaining } })).toBe(1000000);
    expect(expiresAt({ ...view, accessory: { remaining } })).toBe(1000000);
    expect(expiresAt({ ...view, remaining })).toBe(1000000);
  }
});
