import { build } from 'esbuild';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
// Resolve only relative source modules within this project. No parent-directory discovery.
export async function buildWorker() {
  const result = await build({
    entryPoints: ['worker/index.ts'],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    tsconfigRaw: { compilerOptions: { target: 'ES2022' } },
    plugins: [
      {
        name: 'project-only',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, (args) => {
            const resolved = path.resolve(
              args.importer ? path.dirname(args.importer) : root,
              args.path,
            );
            if (!resolved.startsWith(root))
              throw new Error('Worker imports must stay within Growth Finance');
            return { path: resolved, namespace: 'growth-source' };
          });
          builder.onLoad({ filter: /.*/, namespace: 'growth-source' }, async (args) => ({
            contents: await readFile(
              args.path.endsWith('.ts') ? args.path : args.path + '.ts',
              'utf8',
            ),
            loader: 'ts',
          }));
        },
      },
    ],
  });
  return result.outputFiles[0].text;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(path.join(root, '.worker-build'), { recursive: true });
  await writeFile(path.join(root, '.worker-build/index.mjs'), await buildWorker());
  console.log('Project-scoped Worker bundle built.');
}
