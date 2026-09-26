import { hash, random, passwordHash, equal, encrypt, decrypt } from './security';
import { snap, SnapEnv } from './snaptrade';
import { readPortfolio } from './portfolio';
import { Article } from '../shared/types';
interface Env extends SnapEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  ENCRYPTION_KEY: string;
  FINNHUB_API_KEY?: string;
  APP_ORIGIN: string;
  ALLOW_SIGNUP: string;
}
class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const json = (body: unknown, status = 200) => Response.json(body, { status });
async function body(request: Request): Promise<Record<string, any>> {
  const text = await request.text();
  if (text.length > 20000) throw new HttpError(413, 'Request is too large');
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Invalid request body');
  }
}
async function limit(env: Env, key: string, max: number, seconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare(
    'INSERT INTO rate_limits(key,count,resets_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN resets_at<=? THEN 1 ELSE count+1 END,resets_at=CASE WHEN resets_at<=? THEN excluded.resets_at ELSE resets_at END RETURNING count',
  )
    .bind(key, now + seconds, now, now)
    .first<{ count: number }>();
  if ((row?.count || 0) > max)
    throw new HttpError(429, 'Please wait a moment before trying again.');
}
async function session(request: Request, env: Env) {
  const bearer = request.headers.get('Authorization');
  const token = bearer?.startsWith('Bearer ')
    ? bearer.slice(7)
    : request.headers.get('Cookie')?.match(/(?:^|;\s*)growth_session=([a-f0-9]+)/)?.[1];
  if (!token) throw new HttpError(401, 'Please sign in first.');
  const user = await env.DB.prepare(
    'SELECT u.id,u.email,u.name,s.token_hash FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?',
  )
    .bind(await hash(token), Date.now())
    .first<{ id: string; email: string; name: string; token_hash: string }>();
  if (!user) throw new HttpError(401, 'Your session has expired. Please sign in again.');
  return user;
}
async function credentials(env: Env, userId: string) {
  const row = await env.DB.prepare(
    'SELECT provider_user_id,encrypted_secret FROM snaptrade_users WHERE user_id=?',
  )
    .bind(userId)
    .first<{ provider_user_id: string; encrypted_secret: string }>();
  if (row)
    return {
      userId: row.provider_user_id,
      userSecret: await decrypt(row.encrypted_secret, env.ENCRYPTION_KEY, userId),
    };
  return null;
}
const numeric = (v: unknown): string | null =>
  v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) ? String(v) : null;
async function sync(env: Env, userId: string) {
  const creds = await credentials(env, userId);
  if (!creds) throw new HttpError(409, 'Connect a brokerage first.');
  const accounts = await snap<any[]>(env, '/accounts', creds);
  if (!Array.isArray(accounts)) throw new Error('Invalid brokerage account response');
  const statements: D1PreparedStatement[] = [
    env.DB.prepare('DELETE FROM brokerage_accounts WHERE user_id=?').bind(userId),
  ];
  const now = new Date().toISOString();
  // Fetch everything before the atomic database batch: a provider failure preserves the previous snapshot.
  for (const a of accounts) {
    const accountId = String(a.id);
    const path = `/accounts/${encodeURIComponent(accountId)}`;
    const positions = await snap<{ results: any[]; data_freshness?: { as_of: string } }>(
      env,
      path + '/positions/all',
      creds,
    );
    const balances = await snap<any[]>(env, path + '/balances', creds);
    if (!Array.isArray(positions.results) || !Array.isArray(balances))
      throw new Error('Invalid brokerage holdings response');
    statements.push(
      env.DB.prepare(
        'INSERT INTO brokerage_accounts(id,user_id,name,institution,currency,synced_at) VALUES(?,?,?,?,?,?)',
      ).bind(
        accountId,
        userId,
        a.name || 'Investment account',
        a.institution_name || 'Brokerage',
        a.balance?.total?.currency || 'USD',
        now,
      ),
    );
    for (const p of positions.results) {
      const instrument = p.instrument || {};
      const kind = instrument.kind;
      const currency = p.currency || instrument.currency || 'UNKNOWN';
      const asset =
        kind === 'crypto'
          ? 'Crypto'
          : kind === 'etf' || kind === 'mutualfund' || kind === 'cef'
            ? 'ETFs'
            : kind === 'stock' || kind === 'adr'
              ? 'Stocks'
              : kind === 'bond'
                ? 'Bonds'
                : 'Other';
      // Complex instruments remain visible, but must not be incorrectly valued as ordinary shares.
      const multiplier = [
        'stock',
        'adr',
        'etf',
        'mutualfund',
        'cef',
        'crypto',
        'tokenized_asset',
      ].includes(kind)
        ? '1'
        : 'unknown';
      const instrumentId = `${instrument.id || instrument.symbol || 'unknown'}:${currency}`;
      statements.push(
        env.DB.prepare(
          'INSERT INTO holdings(user_id,account_id,instrument_id,symbol,name,asset_class,currency,units,price,cost_basis,multiplier,cash_equivalent,as_of) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
        ).bind(
          userId,
          accountId,
          instrumentId,
          instrument.symbol || 'Unknown',
          instrument.description || instrument.symbol || 'Unknown instrument',
          asset,
          currency,
          numeric(p.units),
          numeric(p.price),
          numeric(p.cost_basis),
          multiplier,
          p.cash_equivalent ? 1 : 0,
          positions.data_freshness?.as_of || now,
        ),
      );
    }
    for (const b of balances) {
      const amount = numeric(b.cash);
      if (amount !== null)
        statements.push(
          env.DB.prepare(
            'INSERT INTO cash_balances(user_id,account_id,currency,amount) VALUES(?,?,?,?)',
          ).bind(userId, accountId, b.currency?.code || 'UNKNOWN', amount),
        );
    }
  }
  await env.DB.batch(statements);
  const portfolio = await readPortfolio(env.DB, userId);
  if (!portfolio.warnings.length) {
    const total = portfolio.positions.reduce((s, p) => s + (p.value ?? 0), 0);
    await env.DB.prepare(
      "INSERT INTO portfolio_snapshots(user_id,day,currency,value) VALUES(?,?,'USD',?) ON CONFLICT(user_id,day,currency) DO UPDATE SET value=excluded.value",
    )
      .bind(userId, now.slice(0, 10), String(total))
      .run();
  }
  return { ok: true, accounts: accounts.length };
}
async function news(env: Env, userId: string): Promise<Article[]> {
  if (!env.FINNHUB_API_KEY) return [];
  const portfolio = await readPortfolio(env.DB, userId);
  const stockSymbols = [
    ...new Set(portfolio.positions.filter((p) => p.assetClass === 'Stocks').map((p) => p.symbol)),
  ].slice(0, 12);
  const articles: Article[] = [];
  const categories = portfolio.positions.some((p) => p.assetClass === 'Crypto')
    ? ['general', 'crypto']
    : ['general'];
  for (const symbol of [...stockSymbols, ...categories.map((c) => `category:${c}`)]) {
    const cached = await env.DB.prepare(
      'SELECT payload FROM news_cache WHERE symbol=? AND expires_at>?',
    )
      .bind(symbol, Date.now())
      .first<{ payload: string }>();
    if (cached) {
      articles.push(...JSON.parse(cached.payload));
      continue;
    }
    const category = symbol.startsWith('category:');
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const params = new URLSearchParams(
      category ? { category: symbol.slice(9) } : { symbol, from, to },
    );
    const response = await fetch(
      `https://finnhub.io/api/v1/${category ? 'news' : 'company-news'}?${params}`,
      { headers: { 'X-Finnhub-Token': env.FINNHUB_API_KEY }, signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) continue;
    const data = (await response.json()) as any[];
    if (!Array.isArray(data)) continue;
    const normalized: Article[] = data
      .slice(0, 5)
      .map((n) => ({
        id: String(n.id),
        title: String(n.headline),
        source: String(n.source),
        publishedAt: new Date(n.datetime * 1000).toISOString(),
        url: typeof n.url === 'string' && n.url.startsWith('https://') ? n.url : undefined,
        symbols: category
          ? portfolio.positions
              .filter((p) =>
                symbol === 'category:crypto'
                  ? p.assetClass === 'Crypto'
                  : p.assetClass === 'ETFs' || p.assetClass === 'Bonds',
              )
              .map((p) => p.symbol)
          : [symbol],
        category: category ? (symbol === 'category:crypto' ? 'Crypto' : 'Macro') : 'Holdings',
        summary: String(n.summary || '').slice(0, 500),
      }));
    await env.DB.prepare(
      'INSERT INTO news_cache(symbol,payload,expires_at) VALUES(?,?,?) ON CONFLICT(symbol) DO UPDATE SET payload=excluded.payload,expires_at=excluded.expires_at',
    )
      .bind(symbol, JSON.stringify(normalized), Date.now() + 900000)
      .run();
    articles.push(...normalized);
  }
  const merged = new Map<string, Article>();
  for (const a of articles) {
    const old = merged.get(a.id);
    merged.set(a.id, old ? { ...old, symbols: [...new Set([...old.symbols, ...a.symbols])] } : a);
  }
  return [...merged.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  if (path === '/api/health')
    return json({
      ok: true,
      snaptrade: !!(env.SNAPTRADE_CLIENT_ID && env.SNAPTRADE_CONSUMER_KEY && env.ENCRYPTION_KEY),
      news: !!env.FINNHUB_API_KEY,
    });
  if ((path === '/api/auth/register' || path === '/api/auth/login') && method === 'POST') {
    await limit(env, `auth:${request.headers.get('CF-Connecting-IP') || 'local'}`, 10, 300);
    const data = await body(request);
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const password = typeof data.password === 'string' ? data.password : '';
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 ||
      password.length < 12 ||
      password.length > 128
    )
      throw new HttpError(400, 'Use a valid email and a password between 12 and 128 characters.');
    let user: { id: string; email: string; name: string } | null;
    if (path.endsWith('/register')) {
      if (env.ALLOW_SIGNUP !== 'true')
        throw new HttpError(403, 'New account registration is currently closed.');
      const name = typeof data.name === 'string' ? data.name.trim().slice(0, 80) : '';
      if (!name) throw new HttpError(400, 'Enter your name.');
      const salt = random();
      const id = crypto.randomUUID();
      const password_hash = await passwordHash(password, salt);
      try {
        await env.DB.batch([
          env.DB.prepare(
            'INSERT INTO users(id,email,name,password_hash,salt) VALUES(?,?,?,?,?)',
          ).bind(id, email, name, password_hash, salt),
          env.DB.prepare('INSERT INTO preferences(user_id) VALUES(?)').bind(id),
        ]);
      } catch {
        throw new HttpError(409, 'Unable to create an account with these details. Try signing in.');
      }
      user = { id, email, name };
    } else {
      const found = await env.DB.prepare('SELECT * FROM users WHERE email=?')
        .bind(email)
        .first<{ id: string; email: string; name: string; salt: string; password_hash: string }>();
      const computed = await passwordHash(
        password,
        found?.salt || '00000000000000000000000000000000',
      );
      if (!found || !equal(computed, found.password_hash))
        throw new HttpError(401, 'Email or password is incorrect.');
      user = { id: found.id, email: found.email, name: found.name };
    }
    const token = random();
    await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)')
      .bind(await hash(token), user.id, Date.now() + 7 * 86400000)
      .run();
    const response = json({ user, token });
    response.headers.set(
      'Set-Cookie',
      `growth_session=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=604800${url.protocol === 'https:' ? '; Secure' : ''}`,
    );
    return response;
  }
  const user = await session(request, env);
  if (path === '/api/auth/me' && method === 'GET') {
    const pref = await env.DB.prepare('SELECT theme FROM preferences WHERE user_id=?')
      .bind(user.id)
      .first<{ theme: string }>();
    return json({
      user: { id: user.id, name: user.name, email: user.email },
      theme: pref?.theme || 'system',
    });
  }
  if (path === '/api/auth/logout' && method === 'POST') {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(user.token_hash).run();
    const response = json({ ok: true });
    response.headers.set(
      'Set-Cookie',
      'growth_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0',
    );
    return response;
  }
  if (path === '/api/portfolio' && method === 'GET')
    return json(await readPortfolio(env.DB, user.id));
  if (path === '/api/preferences' && method === 'PATCH') {
    const d = await body(request);
    if (!['dark', 'light', 'system'].includes(d.theme)) throw new HttpError(400, 'Invalid theme');
    await env.DB.prepare('UPDATE preferences SET theme=? WHERE user_id=?')
      .bind(d.theme, user.id)
      .run();
    return json({ ok: true });
  }
  if (path === '/api/favorites' && method === 'PUT') {
    const d = await body(request);
    if (typeof d.id !== 'string' || d.id.length > 200 || typeof d.active !== 'boolean')
      throw new HttpError(400, 'Invalid favorite');
    await env.DB.prepare(
      d.active
        ? 'INSERT OR IGNORE INTO favorites(user_id,instrument_id) VALUES(?,?)'
        : 'DELETE FROM favorites WHERE user_id=? AND instrument_id=?',
    )
      .bind(user.id, d.id)
      .run();
    return json({ ok: true });
  }
  if (path === '/api/connections/portal' && method === 'POST') {
    await limit(env, `portal:${user.id}`, 1, 15);
    if (!env.ENCRYPTION_KEY || !env.SNAPTRADE_CLIENT_ID || !env.SNAPTRADE_CONSUMER_KEY)
      throw new HttpError(
        503,
        'SnapTrade setup is pending. Add the server credentials, then try again.',
      );
    let creds = await credentials(env, user.id);
    if (!creds) {
      const registered = await snap<{ userId: string; userSecret: string }>(
        env,
        '/snapTrade/registerUser',
        {},
        { userId: user.id },
      );
      if (!registered.userSecret)
        throw new Error('Brokerage registration did not return credentials');
      await env.DB.prepare(
        'INSERT INTO snaptrade_users(user_id,provider_user_id,encrypted_secret) VALUES(?,?,?)',
      )
        .bind(
          user.id,
          registered.userId,
          await encrypt(registered.userSecret, env.ENCRYPTION_KEY, user.id),
        )
        .run();
      creds = { userId: registered.userId, userSecret: registered.userSecret };
    }
    const portal = await snap<{ redirectURI: string }>(env, '/snapTrade/login', creds, {
      connectionType: 'read',
      customRedirect: `${env.APP_ORIGIN}/account`,
      immediateRedirect: true,
    });
    return json({ url: portal.redirectURI });
  }
  if (path === '/api/sync' && method === 'POST') {
    await limit(env, `sync:${user.id}`, 1, 60);
    return json(await sync(env, user.id));
  }
  if (path === '/api/news' && method === 'GET') {
    await limit(env, `news:${user.id}`, 10, 60);
    return json({ articles: await news(env, user.id) });
  }
  if (path === '/api/journal' && method === 'GET') {
    return json(
      (
        await env.DB.prepare(
          'SELECT id,body,created_at FROM journal_entries WHERE user_id=? AND instrument_id=? ORDER BY created_at DESC LIMIT 100',
        )
          .bind(user.id, url.searchParams.get('instrument') || '')
          .all()
      ).results,
    );
  }
  if (path === '/api/journal' && method === 'POST') {
    const d = await body(request);
    if (
      typeof d.body !== 'string' ||
      !d.body.trim() ||
      d.body.length > 5000 ||
      typeof d.instrumentId !== 'string' ||
      d.instrumentId.length > 200
    )
      throw new HttpError(400, 'Notes must contain 1–5,000 characters.');
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO journal_entries(id,user_id,instrument_id,body,created_at) VALUES(?,?,?,?,?)',
    )
      .bind(id, user.id, d.instrumentId, d.body.trim(), created_at)
      .run();
    return json({ id, body: d.body.trim(), created_at });
  }
  throw new HttpError(404, 'Endpoint not found');
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    const origin = request.headers.get('Origin');
    const approved = origin === env.APP_ORIGIN || origin === url.origin;
    if (origin && !approved) return json({ error: 'Origin is not allowed' }, 403);
    let response: Response;
    if (request.method === 'OPTIONS') response = new Response(null, { status: 204 });
    else
      try {
        response = await handle(request, env);
      } catch (error) {
        const status = error instanceof HttpError ? error.status : 502;
        response = json(
          {
            error:
              error instanceof HttpError
                ? error.message
                : 'The service is temporarily unavailable. Please check your configuration and try again.',
          },
          status,
        );
      }
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'no-referrer');
    if (origin && approved) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Vary', 'Origin');
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  },
};
