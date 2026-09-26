import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildWorker } from './build-worker.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
let secrets = {};
try {
  const text = await readFile(path.join(root, '.dev.vars'), 'utf8');
  secrets = Object.fromEntries(
    text
      .split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        try {
          return [l.slice(0, i), JSON.parse(l.slice(i + 1))];
        } catch {
          return [l.slice(0, i), l.slice(i + 1)];
        }
      }),
  );
} catch {}
const runtime = new Miniflare({
  ...convertV4MiniflareOptions({
    modules: true,
    script: await buildWorker(),
    compatibilityDate: '2026-09-25',
    host: process.env.DEV_API_HOST || '127.0.0.1',
    port: 8787,
    d1Databases: { DB: '00000000-0000-0000-0000-000000000000' },
    d1Persist: path.join(root, '.wrangler/state/v3/d1'),
    bindings: { APP_ORIGIN: 'http://localhost:8081', ALLOW_SIGNUP: 'true', ...secrets },
    serviceBindings: {
      ASSETS: () => new Response('Open the Expo app at http://localhost:8081', { status: 404 }),
    },
  }),
  telemetry: { enabled: false },
});
await runtime.ready;
const db = await runtime.getD1Database('DB');
const exists = await db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
  .first();
if (!exists) {
  const schema = await readFile(path.join(root, 'worker/migrations/0001_initial.sql'), 'utf8');
  await db.batch(
    schema
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => db.prepare(s)),
  );
}
console.log(
  'Growth Finance API ready at http://localhost:8787 · project-local database\nRestart this terminal after backend changes. Expo UI reloads automatically.',
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    await runtime.dispose();
    process.exit(0);
  });
