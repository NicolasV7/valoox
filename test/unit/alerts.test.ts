import assert from 'node:assert';
import { test } from 'vitest';
import type { Env, StoreView } from '../../src/types.ts';
import { deliver, hits, message, mintTopic } from '../../src/vault/alerts.ts';
import { assertAllowed } from '../../src/vault/upstream.ts';

// The whole alert engine is this one pure function. It matches on skin LEVEL
// uuids because that is what the storefront returns — the browser resolved the
// names once, at save time, precisely so this job never touches the 3.5 MB
// catalogue it could not afford to parse.

const view = (offers: string[], night: string[] = []) =>
  ({
    offers: offers.map((id) => ({ id, cost: 1775 })),
    night: night.length
      ? { remaining: 1, items: night.map((id) => ({ id, cost: 1, price: 1, percent: 50 })) }
      : null,
  }) as unknown as StoreView;

const want = (...ids: string[]) => ids.map((id) => ({ id, name: 'Skin ' + id }));

test('a wanted skin in the daily store is a hit', () => {
  assert.deepEqual(hits(view(['a', 'b', 'c', 'd']), want('c')), [{ id: 'c', name: 'Skin c' }]);
});

test('the night market counts too — that is where the discount is', () => {
  assert.deepEqual(hits(view(['a'], ['z']), want('z')), [{ id: 'z', name: 'Skin z' }]);
});

test('nothing wanted, nothing sent', () => {
  assert.deepEqual(hits(view(['a', 'b']), want('x', 'y')), []);
  assert.deepEqual(hits(view(['a']), []), []);
});

test('several hits in one day come back together, not as several alerts', () => {
  assert.equal(hits(view(['a', 'b', 'c']), want('a', 'c')).length, 2);
});

test('an empty store is not a crash', () => {
  assert.deepEqual(hits(view([]), want('a')), []);
  assert.deepEqual(hits({ offers: [], night: null } as unknown as StoreView, want('a')), []);
});

test('the message reads like a sentence in both shapes', () => {
  assert.equal(
    message([{ id: 'x', name: 'Reaver Vandal' }]),
    'Reaver Vandal está en tu tienda hoy.',
  );
  assert.equal(
    message([
      { id: 'x', name: 'Reaver Vandal' },
      { id: 'y', name: 'Prime Phantom' },
    ]),
    'Reaver Vandal, Prime Phantom están en tu tienda hoy.',
  );
});

test('the message carries no identifier, only names the user chose', () => {
  const m = message([{ id: 'e7c63390-eda7-46e0-bb7a-a6abdacd2433', name: 'Sakura Sheriff' }]);
  assert.ok(!m.includes('e7c63390'), 'a uuid in a push would leak through ntfy');
});

// --- the channel ------------------------------------------------------------

test('a minted topic is unguessable and survives the egress allowlist', () => {
  // The two things that can break independently: the alphabet (a topic with a
  // dot or a slash is blocked before it is sent, silently killing every alert)
  // and the entropy (on ntfy the name of a topic is the only thing protecting
  // it, so a guessable one is a public one).
  const t = mintTopic();
  assert.match(t, /^val-[0-9a-f]{20}$/);
  assert.doesNotThrow(() => assertAllowed('POST', 'https://ntfy.sh/' + t));
  assert.notEqual(t, mintTopic());
});

test('a message with nowhere to go is a failure, not a quiet success', async () => {
  await assert.rejects(deliver({} as Env, {}, 'hola'), /ningún canal/);
});

test('a timing-out ntfy is retried, and a late success still counts', async () => {
  // The failure this exists for: ntfy returns a Cloudflare 522 for roughly one
  // request in four from a Worker. Without the retry, one alert in four is lost
  // and nothing anywhere says so.
  const real = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return new Response(null, { status: calls < 3 ? 522 : 200 });
  }) as typeof fetch;
  try {
    const report = await deliver({ NTFY_TOKEN: 'tk_x' } as Env, { ntfy: 'val-abc' }, 'hola');
    assert.deepEqual(report, ['ntfy 200']);
    assert.equal(calls, 3, 'the first two attempts should have been retried');
  } finally {
    globalThis.fetch = real;
  }
});

test('a channel that never answers fails loudly, and says which one', async () => {
  const real = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return new Response(null, { status: 522 });
  }) as typeof fetch;
  try {
    await assert.rejects(deliver({} as Env, { ntfy: 'val-abc' }, 'hola'), /ntfy 522/);
    assert.equal(calls, 3, 'it should stop at three, not keep going');
  } finally {
    globalThis.fetch = real;
  }
});
