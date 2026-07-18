import fs from 'node:fs/promises';
import path from 'node:path';
import type { Page } from 'playwright';
import { localPathForUrl } from './util.js';

export type AssetType = 'image' | 'script' | 'stylesheet' | 'font' | 'media';

export interface CapturedAsset {
  url: string;
  contentType: string;
  body: Buffer;
  localPath: string; // relative path under the page's output dir
  resourceType: AssetType;
}

const CAPTURABLE: Set<string> = new Set(['image', 'script', 'stylesheet', 'font', 'media']);

/**
 * Attach a response listener that captures asset bodies as the page loads.
 * Returns the live map of captured assets keyed by URL.
 */
export function collectAssets(page: Page, types: AssetType[]): Map<string, CapturedAsset> {
  const wanted = new Set<string>(types);
  const assets = new Map<string, CapturedAsset>();

  page.on('response', async (response) => {
    try {
      const request = response.request();
      const resourceType = request.resourceType();
      if (!CAPTURABLE.has(resourceType) || !wanted.has(resourceType)) return;
      const url = response.url();
      if (!url.startsWith('http') || assets.has(url)) return;
      if (response.status() !== 200) return;
      const body = await response.body();
      const contentType = response.headers()['content-type'] ?? '';
      assets.set(url, {
        url,
        contentType,
        body,
        localPath: localPathForUrl(url, contentType),
        resourceType: resourceType as AssetType,
      });
    } catch {
      // Redirects and aborted requests have no retrievable body; skip them.
    }
  });

  return assets;
}

export async function writeAssets(assets: Map<string, CapturedAsset>, outputDir: string): Promise<void> {
  for (const asset of assets.values()) {
    const target = path.join(outputDir, asset.localPath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, asset.body);
  }
}
