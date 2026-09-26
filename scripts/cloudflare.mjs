import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
let content;
try {
  content = await readFile('.cloudflare.env', 'utf8');
} catch {
  console.error('Run npm run setup to configure this project’s separate Cloudflare account first.');
  process.exit(1);
}
const values = Object.fromEntries(
  content
    .trim()
    .split('\n')
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i), JSON.parse(l.slice(i + 1))];
    }),
);
if (!values.CLOUDFLARE_API_TOKEN || !values.CLOUDFLARE_ACCOUNT_ID)
  throw new Error('Project Cloudflare credentials are missing');
const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
if (config.account_id !== values.CLOUDFLARE_ACCOUNT_ID)
  throw new Error('Cloudflare account mismatch. Run setup again.');
const env = { ...process.env, ...values };
delete env.CLOUDFLARE_API_KEY;
delete env.CLOUDFLARE_EMAIL;
const child = spawn(
  process.execPath,
  ['node_modules/wrangler/bin/wrangler.js', ...process.argv.slice(2)],
  { cwd: root, env, stdio: 'inherit' },
);
child.on('exit', (code) => process.exit(code ?? 1));
