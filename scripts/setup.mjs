import { input, password, confirm } from '@inquirer/prompts';
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const read = async (file) => {
  try {
    return await readFile(path.join(root, file), 'utf8');
  } catch {
    return '';
  }
};
const parse = (text) =>
  Object.fromEntries(
    text
      .split('\n')
      .filter((s) => s.includes('=') && !s.startsWith('#'))
      .map((s) => {
        const i = s.indexOf('=');
        try {
          return [s.slice(0, i), JSON.parse(s.slice(i + 1))];
        } catch {
          return [s.slice(0, i), s.slice(i + 1)];
        }
      }),
  );
const save = async (file, values) =>
  writeFile(
    path.join(root, file),
    Object.entries(values)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join('\n') + '\n',
    { mode: 0o600 },
  );
console.log(
  '\nGrowth Finance · private project setup\nLeave optional fields blank to keep existing values. Secrets are hidden and never printed.\n',
);
try {
  const previous = parse(await read('.dev.vars'));
  const client = await input({ message: 'SnapTrade commercial Client ID (optional):' });
  const consumer = await password({ message: 'SnapTrade Consumer Key (optional):', mask: '*' });
  const news = await password({ message: 'Finnhub news API key (optional):', mask: '*' });
  await save('.dev.vars', {
    ...previous,
    SNAPTRADE_CLIENT_ID: client || previous.SNAPTRADE_CLIENT_ID || '',
    SNAPTRADE_CONSUMER_KEY: consumer || previous.SNAPTRADE_CONSUMER_KEY || '',
    FINNHUB_API_KEY: news || previous.FINNHUB_API_KEY || '',
    ENCRYPTION_KEY: previous.ENCRYPTION_KEY || randomBytes(32).toString('hex'),
  });
  const api = await input({
    message: 'Public backend URL (local: http://localhost:8787):',
    default: 'http://localhost:8787',
    validate: (v) => {
      try {
        return ['http:', 'https:'].includes(new URL(v).protocol) || 'Use an HTTP(S) URL';
      } catch {
        return 'Use a valid URL';
      }
    },
  });
  await save('.env', { EXPO_PUBLIC_API_URL: api.replace(/\/$/, '') });
  if (
    await confirm({ message: 'Configure your separate Cloudflare account now?', default: false })
  ) {
    const config = JSON.parse(await read('wrangler.jsonc'));
    config.account_id = await input({
      message: 'New Cloudflare Account ID:',
      validate: (v) => /^[a-f0-9]{32}$/i.test(v) || 'Expected a 32-character account ID',
    });
    const token = await password({
      message: 'API token scoped to this account (Workers + D1):',
      mask: '*',
      validate: (v) => v.length > 15 || 'Enter an API token, not your account password',
    });
    const db = await input({
      message: 'Growth Finance D1 database ID (blank if not created yet):',
      validate: (v) => !v || /^[a-f0-9-]{36}$/i.test(v) || 'Expected a database UUID',
    });
    if (db) config.d1_databases[0].database_id = db;
    const origin = await input({
      message: 'App web origin / future domain (e.g. https://app.example.com):',
      validate: (v) => {
        try {
          const u = new URL(v);
          return (
            (u.protocol === 'https:' && u.origin === v) ||
            'Enter only the HTTPS origin, with no trailing slash'
          );
        } catch {
          return 'Enter an HTTPS origin';
        }
      },
    });
    config.vars.APP_ORIGIN = origin;
    if (
      await confirm({
        message: 'Is this a purchased domain already on this Cloudflare account?',
        default: false,
      })
    )
      config.routes = [{ pattern: new URL(origin).hostname, custom_domain: true }];
    await save('.cloudflare.env', {
      CLOUDFLARE_API_TOKEN: token,
      CLOUDFLARE_ACCOUNT_ID: config.account_id,
    });
    await writeFile('wrangler.jsonc', JSON.stringify(config, null, 2) + '\n');
  }
  console.log(
    '\nSaved locally. Nothing has been deployed.\n\nLocal: npm run build:web && npm run db:local && npm run api:dev\nApp:   npm start\n\nCloudflare (only when ready):\n  npm run cloudflare -- d1 create growth-finance\n  npm run setup  (enter the returned D1 database ID)\n  npm run cloudflare -- d1 migrations apply growth-finance --remote\n  npm run secrets:push\n  npm run deploy\n\nFor iPhone testing, set the backend URL to your Mac’s LAN address or your deployed HTTPS origin.\n',
  );
} catch (error) {
  console.error(error.name === 'ExitPromptError' ? 'Setup cancelled.' : error.message);
  process.exitCode = 1;
}
