import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowed, canonical, snap } from '../worker/snaptrade';
import { encrypt, decrypt, passwordHash, equal } from '../worker/security';
import { ordered, total } from '../src/finance';
import { demo } from '../src/demo';
test('favorites take precedence, others sort by value', () => {
  const p = ordered(demo.positions, ['eth'], 'All assets');
  assert.equal(p[0].symbol, 'ETH');
  assert.equal(p[1].symbol, 'NVDA');
  assert.deepEqual(
    ordered(demo.positions, [], 'Crypto').map((x) => x.symbol),
    ['BTC', 'ETH'],
  );
  assert.equal(ordered(demo.positions, [], 'All assets', 'apple')[0].symbol, 'AAPL');
});
test('combined valuation includes all demo assets', () => {
  assert.ok(Math.abs(total(demo.positions) - 123425.2628) < 0.001);
});
test('SnapTrade allowlist excludes all trading operations', () => {
  for (const p of [
    '/trade/place',
    '/accounts/a/orders',
    '/trade/impact',
    '/snapTrade/resetUserSecret',
  ])
    for (const m of ['GET', 'POST', 'DELETE']) assert.equal(allowed(p, m), false);
  assert.equal(allowed('/accounts/a/positions/all', 'GET'), true);
  assert.equal(allowed('/accounts/a/balances', 'GET'), true);
  assert.equal(allowed('/snapTrade/login', 'POST'), true);
});
test('signature canonicalizes nested keys', () => {
  assert.equal(
    canonical({ z: [{ b: 2, a: 1 }], a: null }),
    ' {"a":null,"z":[{"a":1,"b":2}]}'.trim(),
  );
});
test('encrypted credentials are owner-bound and authenticated', async () => {
  const key = 'ab'.repeat(32);
  const value = await encrypt('private', key, 'user-a');
  assert.equal(await decrypt(value, key, 'user-a'), 'private');
  await assert.rejects(() => decrypt(value, key, 'user-b'));
  await assert.rejects(() => decrypt(value, 'cd'.repeat(32), 'user-a'));
});
test('password hashes are salted and comparison handles length', async () => {
  const a = await passwordHash('long-test-password', 'a');
  const b = await passwordHash('long-test-password', 'b');
  assert.notEqual(a, b);
  assert.equal(equal(a, a), true);
  assert.equal(equal(a, b), false);
  assert.equal(equal(a, a + '0'), false);
});
test('portal request forces read permissions even if caller asks for trade', async () => {
  const previous = globalThis.fetch;
  let payload: any;
  globalThis.fetch = (async (_url, init) => {
    payload = JSON.parse(String(init?.body));
    return Response.json({ redirectURI: 'https://example.com' });
  }) as typeof fetch;
  try {
    await snap(
      { SNAPTRADE_CLIENT_ID: 'test', SNAPTRADE_CONSUMER_KEY: 'test' },
      '/snapTrade/login',
      { userId: 'a', userSecret: 'b' },
      { connectionType: 'trade' },
    );
    assert.equal(payload.connectionType, 'read');
  } finally {
    globalThis.fetch = previous;
  }
});
