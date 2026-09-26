// Deliberately narrow API: no trading, transfers, orders, or arbitrary proxy endpoint.
export type SnapEnv = { SNAPTRADE_CLIENT_ID: string; SNAPTRADE_CONSUMER_KEY: string };
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`)
    .join(',')}}`;
}
export function allowed(path: string, method: string) {
  return method === 'POST'
    ? ['/snapTrade/registerUser', '/snapTrade/login'].includes(path)
    : method === 'GET' &&
        (path === '/accounts' || /^\/accounts\/[^/]+\/(positions\/all|balances)$/.test(path));
}
export async function snap<T>(
  env: SnapEnv,
  path: string,
  credentials: Record<string, string> = {},
  body?: Record<string, unknown>,
): Promise<T> {
  const method = body ? 'POST' : 'GET';
  if (!allowed(path, method)) throw new Error('SnapTrade operation is not permitted');
  if (!env.SNAPTRADE_CLIENT_ID || !env.SNAPTRADE_CONSUMER_KEY)
    throw new Error('SnapTrade is not configured yet');
  const content =
    path === '/snapTrade/login' ? { ...body, connectionType: 'read' } : (body ?? null);
  const query = new URLSearchParams({
    clientId: env.SNAPTRADE_CLIENT_ID,
    timestamp: String(Math.floor(Date.now() / 1000)),
    ...credentials,
  }).toString();
  const fullPath = `/api/v1${path}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.SNAPTRADE_CONSUMER_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(canonical({ content, path: fullPath, query })),
  );
  const response = await fetch(`https://api.snaptrade.com${fullPath}?${query}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Signature: btoa(String.fromCharCode(...new Uint8Array(signature))),
    },
    body: content ? JSON.stringify(content) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(
      `Brokerage service returned ${response.status}. Please retry or reconnect your brokerage.`,
    );
  return response.json() as Promise<T>;
}
