import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const parse = (s) =>
  Object.fromEntries(
    s
      .trim()
      .split('\n')
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        try {
          return [l.slice(0, i), JSON.parse(l.slice(i + 1))];
        } catch {
          return [l.slice(0, i), l.slice(i + 1)];
        }
      }),
  );
const keys = parse(await readFile('.dev.vars', 'utf8'));
const cf = parse(await readFile('.cloudflare.env', 'utf8'));
const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
if (cf.CLOUDFLARE_ACCOUNT_ID !== config.account_id || !cf.CLOUDFLARE_API_TOKEN)
  throw new Error('Run setup with the separate Cloudflare account first.');
const secrets = Object.fromEntries(
  ['SNAPTRADE_CLIENT_ID', 'SNAPTRADE_CONSUMER_KEY', 'ENCRYPTION_KEY', 'FINNHUB_API_KEY']
    .filter((k) => keys[k])
    .map((k) => [k, keys[k]]),
);
const env = { ...process.env, ...cf };
delete env.CLOUDFLARE_API_KEY;
delete env.CLOUDFLARE_EMAIL;
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'secret', 'bulk'], {
  cwd: root,
  env,
  stdio: ['pipe', 'inherit', 'inherit'],
});
child.stdin.end(JSON.stringify(secrets));
child.on('exit', (code) => process.exit(code ?? 1));
