#!/usr/bin/env tsx
import { loadConfig, resolveConfig } from './config.js';
import { snapshotAll } from './snapshot.js';

async function main(): Promise<void> {
  const arg = process.argv[2];
  const config = arg
    ? resolveConfig({ pages: { [new URL(arg).hostname.replace(/\W/g, '_')]: arg } })
    : await loadConfig();

  const results = await snapshotAll(config);
  for (const r of results) {
    console.log(`✔ ${r.name}  ${r.url}`);
    console.log(`  → ${r.outputDir}/index.html  (${r.assetCount} assets, ${(r.elapsedMs / 1000).toFixed(1)}s)`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
