import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Browser } from 'playwright';
import { collectAssets, writeAssets } from './assets.js';
import type { ResolvedConfig } from './config.js';
import { rewriteCss, rewriteHtml } from './rewrite.js';

export interface SnapshotResult {
  name: string;
  url: string;
  outputDir: string;
  assetCount: number;
  elapsedMs: number;
}

async function autoScroll(page: import('playwright').Page): Promise<void> {
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    window.scrollTo(0, 0);
  });
}

export async function snapshotPage(
  browser: Browser,
  name: string,
  url: string,
  config: ResolvedConfig
): Promise<SnapshotResult> {
  const started = Date.now();
  const context = await browser.newContext();
  const page = await context.newPage();
  const assets = collectAssets(page, config.assetTypes);

  try {
    await page.goto(url, { waitUntil: config.waitUntil, timeout: 60_000 });
    if (config.scrollToBottom) await autoScroll(page);
    if (config.extraWaitMs > 0) await page.waitForTimeout(config.extraWaitMs);

    const html = await page.content();
    const pageDir = path.join(config.outputDir, name);
    await fs.rm(pageDir, { recursive: true, force: true });
    await fs.mkdir(pageDir, { recursive: true });

    for (const asset of assets.values()) {
      if (asset.resourceType === 'stylesheet') {
        asset.body = Buffer.from(rewriteCss(asset, assets), 'utf8');
      }
    }
    await writeAssets(assets, pageDir);
    await fs.writeFile(path.join(pageDir, 'index.html'), rewriteHtml(html, assets, url));

    return { name, url, outputDir: pageDir, assetCount: assets.size, elapsedMs: Date.now() - started };
  } finally {
    await context.close();
  }
}

export async function snapshotAll(config: ResolvedConfig): Promise<SnapshotResult[]> {
  const browser = await chromium.launch({ headless: config.headless });
  const results: SnapshotResult[] = [];
  try {
    for (const [name, url] of Object.entries(config.pages)) {
      results.push(await snapshotPage(browser, name, url, config));
      if (config.randomDelay) {
        await new Promise((r) => setTimeout(r, Math.random() * 2000));
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}
