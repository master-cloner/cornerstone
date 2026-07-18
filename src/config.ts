import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AssetType } from './assets.js';

export interface CornerstoneConfig {
  /** name → URL of pages to snapshot */
  pages: Record<string, string>;
  /** output root directory, default "output" */
  outputDir?: string;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  /** extra wait after load to let lazy content settle, ms */
  extraWaitMs?: number;
  /** random 0–2s delay between pages */
  randomDelay?: boolean;
  /** scroll to the bottom to trigger lazy loading, default true */
  scrollToBottom?: boolean;
  /** which resource types to mirror, default all */
  assetTypes?: AssetType[];
  headless?: boolean;
}

export type ResolvedConfig = Required<CornerstoneConfig>;

export function resolveConfig(config: CornerstoneConfig): ResolvedConfig {
  return {
    pages: config.pages,
    outputDir: config.outputDir ?? 'output',
    waitUntil: config.waitUntil ?? 'networkidle',
    extraWaitMs: config.extraWaitMs ?? 1000,
    randomDelay: config.randomDelay ?? false,
    scrollToBottom: config.scrollToBottom ?? true,
    assetTypes: config.assetTypes ?? ['image', 'script', 'stylesheet', 'font', 'media'],
    headless: config.headless ?? true,
  };
}

export async function loadConfig(cwd = process.cwd()): Promise<ResolvedConfig> {
  const file = path.join(cwd, 'cornerstone.config.ts');
  if (!fs.existsSync(file)) {
    throw new Error(`Config file not found: ${file}. Create one or pass a URL: cornerstone <url>`);
  }
  const mod = await import(pathToFileURL(file).toString());
  return resolveConfig(mod.default as CornerstoneConfig);
}
