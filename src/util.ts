import { createHash } from 'node:crypto';
import path from 'node:path';

const EXT_BY_MIME: Record<string, string> = {
  'text/html': '.html',
  'text/css': '.css',
  'application/javascript': '.js',
  'text/javascript': '.js',
  'application/x-javascript': '.js',
  'application/json': '.json',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'font/woff2': '.woff2',
  'font/woff': '.woff',
  'font/ttf': '.ttf',
  'font/otf': '.otf',
  'application/font-woff': '.woff',
  'application/font-woff2': '.woff2',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
};

export function extensionForContentType(contentType: string): string {
  const mime = contentType.split(';')[0].trim().toLowerCase();
  return EXT_BY_MIME[mime] ?? '';
}

function shortHash(input: string): string {
  return createHash('sha1').update(input).digest('hex').slice(0, 8);
}

function sanitizeSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Map an absolute resource URL to a relative local path under assets/.
 * Same URL always maps to the same path; URLs that differ only by query
 * string get distinct hash-suffixed names.
 */
export function localPathForUrl(url: string, contentType = ''): string {
  const parsed = new URL(url);
  const host = sanitizeSegment(parsed.hostname);
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname.endsWith('/') || pathname === '') pathname += 'index';

  const segments = pathname.split('/').filter(Boolean).map(sanitizeSegment);
  let filename = segments.pop() ?? 'index';

  let ext = path.extname(filename);
  if (!ext) {
    ext = extensionForContentType(contentType) || '.bin';
    filename += ext;
  }
  if (parsed.search) {
    const base = filename.slice(0, filename.length - ext.length);
    filename = `${base}.${shortHash(parsed.search)}${ext}`;
  }
  return ['assets', host, ...segments, filename].join('/');
}

/** Variants of a URL as it may appear in HTML: absolute and protocol-relative. */
export function urlVariants(url: string): string[] {
  const variants = [url];
  const stripped = url.replace(/^https?:/, '');
  if (stripped !== url) variants.push(stripped);
  return variants;
}
