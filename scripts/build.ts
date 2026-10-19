import path from 'node:path';

const builds = [
  { entry: 'src/panel/main.ts', outdir: 'panel', naming: 'main.js', target: 'browser' as const },
  { entry: 'src/status/main.ts', outdir: 'status', naming: 'main.js', target: 'browser' as const },
  { entry: 'src/service/main.ts', outdir: 'service', naming: 'main.js', target: 'node' as const },
];

for (const build of builds) {
  const result = await Bun.build({
    entrypoints: [path.resolve(build.entry)],
    outdir: path.resolve(build.outdir),
    naming: build.naming,
    target: build.target,
    format: build.target === 'browser' ? 'iife' : 'esm',
    minify: false,
    sourcemap: 'none',
  });

  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
}

console.log('Lens built: panel, status, service.');
