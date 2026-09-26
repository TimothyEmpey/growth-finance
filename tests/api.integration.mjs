import assert from 'node:assert/strict';
const base = 'http://localhost:8787/api';
const call = async (path, { token, body, method, origin } = {}) =>
  fetch(base + path, {
    method: method || (body ? 'POST' : 'GET'),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
const suffix = crypto.randomUUID();
const register = async (name) => {
  const response = await call('/auth/register', {
    body: { name, email: `${name}-${suffix}@example.test`, password: 'Local-test-only-12345' },
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  return data;
};
assert.equal((await call('/portfolio')).status, 401);
assert.equal((await call('/health', { origin: 'https://untrusted.example' })).status, 403);
const a = await register('test-a');
const b = await register('test-b');
await call('/favorites', { token: a.token, body: { id: 'fixture', active: true }, method: 'PUT' });
assert.deepEqual((await (await call('/portfolio', { token: a.token })).json()).favorites, [
  'fixture',
]);
assert.deepEqual((await (await call('/portfolio', { token: b.token })).json()).favorites, []);
await call('/journal', {
  token: a.token,
  body: { instrumentId: 'fixture', body: 'Private fixture note' },
});
assert.equal(
  (await (await call('/journal?instrument=fixture', { token: a.token })).json()).length,
  1,
);
assert.equal(
  (await (await call('/journal?instrument=fixture', { token: b.token })).json()).length,
  0,
);
assert.equal((await call('/connections/portal', { token: a.token, body: {} })).status, 503);
await call('/auth/logout', { token: a.token, body: {} });
assert.equal((await call('/auth/me', { token: a.token })).status, 401);
await call('/auth/logout', { token: b.token, body: {} });
console.log(
  'PASS: registration, secure cookies, user isolation, journal isolation, missing-provider state, CORS, and session revocation. Two example.test fixtures remain only in the local development database.',
);
