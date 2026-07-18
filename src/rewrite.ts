import type { CapturedAsset } from './assets.js';
import { urlVariants } from './util.js';

/**
 * Compute the relative path from one local asset to another.
 * fromPath '' means the root index.html.
 */
function relativeFrom(fromPath: string, toPath: string): string {
  const fromDir = fromPath.split('/').slice(0, -1);
  const to = toPath.split('/');
  let common = 0;
  while (common < fromDir.length && common < to.length - 1 && fromDir[common] === to[common]) common++;
  const ups = fromDir.length - common;
  return [...Array(ups).fill('..'), ...to.slice(common)].join('/');
}

/** Longest URLs first so that prefixes never clobber longer matches. */
function sortedAssets(assets: Map<string, CapturedAsset>): CapturedAsset[] {
  return [...assets.values()].sort((a, b) => b.url.length - a.url.length);
}

function replaceAll(content: string, from: string, to: string): string {
  return content.split(from).join(to);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Rewrite captured asset URLs in the page HTML to relative local paths. */
export function rewriteHtml(html: string, assets: Map<string, CapturedAsset>, pageUrl?: string): string {
  // <base> would break our relative asset paths.
  let out = html.replace(/<base\b[^>]*>/gi, '');
  const pageOrigin = pageUrl ? new URL(pageUrl).origin : undefined;
  for (const asset of sortedAssets(assets)) {
    for (const variant of urlVariants(asset.url)) {
      out = replaceAll(out, variant, asset.localPath);
    }
    if (pageOrigin) {
      const parsed = new URL(asset.url);
      const rootRelative = parsed.pathname + parsed.search;
      if (parsed.origin === pageOrigin && rootRelative.length > 1) {
        // Root-relative refs only count when delimited (attribute quote,
        // css url(, srcset separator) so short paths can't clobber text.
        out = out.replace(
          new RegExp(`(["'(=,\\s])${escapeRegExp(rootRelative)}`, 'g'),
          `$1${asset.localPath}`
        );
      }
    }
  }
  return out;
}

/**
 * Rewrite url(...) / @import references inside a captured CSS file to
 * relative paths, resolving relative refs against the CSS file's own URL.
 */
export function rewriteCss(css: CapturedAsset, assets: Map<string, CapturedAsset>): string {
  let content = css.body.toString('utf8');
  content = content.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (match, _q, ref: string) => {
    if (ref.startsWith('data:') || ref.startsWith('#')) return match;
    let absolute: string;
    try {
      absolute = new URL(ref, css.url).toString();
    } catch {
      return match;
    }
    const target = assets.get(absolute);
    if (!target) return match;
    return `url(${relativeFrom(css.localPath, target.localPath)})`;
  });
  return content;
}
