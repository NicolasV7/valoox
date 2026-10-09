import assert from 'node:assert';
import { test } from 'vitest';
import { deliver, message } from '../../src/alerts/post.ts';
import type { StoreView } from '../../src/types.ts';
import { hits } from '../../src/vault/alerts.ts';

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

test('a wanted skin in the daily store is a hit, with what it costs today', () => {
  // The price belongs to the panel rather than to the star, so it is picked
  // up here, where the two meet. The morning mail prints it.
  assert.deepEqual(hits(view(['a', 'b', 'c', 'd']), want('c')), [
    { id: 'c', name: 'Skin c', cost: 1775 },
  ]);
});

test('the night market counts too — that is where the discount is', () => {
  // And its price wins, because that is the number you would actually pay.
  assert.deepEqual(hits(view(['a'], ['z']), want('z')), [{ id: 'z', name: 'Skin z', cost: 1 }]);
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

const HOOK = '123456789012345678/' + 'a'.repeat(68);

/** Swap the global fetch for a scripted one, and always put it back. */
async function withFetch(reply: (n: number) => Response, body: () => Promise<void>) {
  const real = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => reply(++calls)) as typeof fetch;
  try {
    await body();
  } finally {
    globalThis.fetch = real;
  }
  return calls;
}

test('a message with nowhere to go is a failure, not a quiet success', async () => {
  await assert.rejects(deliver({}, 'hola'), /ningún canal/);
});

test('a channel that times out is retried, and a late success still counts', async () => {
  // The failure this exists for: a push that returns 5xx or never connects at
  // all. Without the retry one alert is simply lost and nothing says so.
  const calls = await withFetch(
    (n) => new Response(null, { status: n < 3 ? 522 : 204 }),
    async () => {
      assert.deepEqual(await deliver({ discord: HOOK }, 'hola'), ['discord 204']);
    },
  );
  assert.equal(calls, 3, 'the first two attempts should have been retried');
});

test('a channel that never answers fails loudly, and says which one', async () => {
  const calls = await withFetch(
    () => new Response(null, { status: 522 }),
    async () => {
      await assert.rejects(deliver({ discord: HOOK }, 'hola'), /discord 522/);
    },
  );
  assert.equal(calls, 3, 'it should stop at three, not keep going');
});

test('a refusal is not retried — a 4xx will stay a 4xx', async () => {
  // Hammering a webhook Discord has already deleted is how an egress reputation
  // gets spent. One attempt, one honest answer.
  const calls = await withFetch(
    () => new Response(null, { status: 404 }),
    async () => {
      await assert.rejects(deliver({ discord: HOOK }, 'hola'), /discord 404/);
    },
  );
  assert.equal(calls, 1, 'a 404 is final');
});
