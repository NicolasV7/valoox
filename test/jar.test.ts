import { test } from 'node:test';
import assert from 'node:assert';
import type { Jar } from '../src/types.ts';
import { absorb, serialize } from '../src/vault/jar.ts';

const res = (...cookies: string[]) =>
  ({ headers: { getSetCookie: () => cookies } }) as unknown as Response;

test('absorb keeps name=value and drops every attribute', () => {
  assert.deepEqual(
    absorb({}, res('ssid=abc; Path=/; Secure; HttpOnly; SameSite=Strict', 'tdid=xyz; Max-Age=31536000')),
    { ssid: 'abc', tdid: 'xyz' },
  );
});

test('rotation overwrites, absent cookies stay absent', () => {
  // Rolling the jar forward on every reauth is what buys weeks of session life.
  assert.equal(absorb({ ssid: 'old', tdid: 't' }, res('ssid=new')).ssid, 'new');
  assert.equal(absorb({ ssid: 'old' }, res('ssid=new')).tdid, undefined);
});

test('a cleared cookie never overwrites a live one', () => {
  assert.equal(absorb({ ssid: 'live' }, res('ssid=deleted; Max-Age=0')).ssid, 'live');
  assert.equal(absorb({ ssid: 'live' }, res('ssid=')).ssid, 'live');
  assert.deepEqual(absorb({}, res('malformed', '=novalue')), {});
});

test('serialize round-trips through absorb', () => {
  const jar: Jar = { ssid: 'a', tdid: 'b' };
  assert.equal(serialize(jar), 'ssid=a; tdid=b');
});


