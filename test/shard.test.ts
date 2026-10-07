import { test } from 'node:test';
import assert from 'node:assert';
import { UnknownAffinity, shardHost, storeBase } from '../src/vault/shard.ts';

test('latam and br live on the na shard', () => {
  // riot-geo returns an AFFINITY; the storefront host is keyed by SHARD. Sending
  // the affinity straight through gives Cloudflare 1016 behind a 530, which looks
  // nothing like a region problem. This cost an afternoon once.
  assert.equal(shardHost('latam'), 'pd.na.a.pvp.net');
  assert.equal(shardHost('br'), 'pd.na.a.pvp.net');
});

test('the four real shards are their own host', () => {
  for (const s of ['na', 'eu', 'ap', 'kr']) {
    assert.equal(shardHost(s), 'pd.' + s + '.a.pvp.net');
  }
});

test('an unmapped affinity throws instead of building a dead hostname', () => {
  assert.throws(() => shardHost('pbe'), UnknownAffinity);
  assert.throws(() => shardHost('esports'), UnknownAffinity);
  assert.throws(() => shardHost('nonsense'), UnknownAffinity);
});

test('storeBase carries the trailing slash the callers assume', () => {
  assert.equal(storeBase('latam'), 'https://pd.na.a.pvp.net/store/');
});
