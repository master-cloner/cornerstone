import { describe, expect, it } from 'vitest';
import { extensionForContentType, localPathForUrl, urlVariants } from '../src/util.js';

describe('localPathForUrl', () => {
  it('maps a plain URL to host + path under assets/', () => {
    expect(localPathForUrl('https://cdn.example.com/js/app.js')).toBe('assets/cdn.example.com/js/app.js');
  });

  it('is deterministic for the same URL', () => {
    const url = 'https://a.com/x/y.png?v=1';
    expect(localPathForUrl(url)).toBe(localPathForUrl(url));
  });

  it('distinguishes URLs differing only by query', () => {
    const a = localPathForUrl('https://a.com/app.css?v=1');
    const b = localPathForUrl('https://a.com/app.css?v=2');
    expect(a).not.toBe(b);
    expect(a).toMatch(/\.css$/);
  });

  it('infers extension from content type when path has none', () => {
    expect(localPathForUrl('https://a.com/img/logo', 'image/png')).toBe('assets/a.com/img/logo.png');
  });

  it('falls back to .bin for unknown types', () => {
    expect(localPathForUrl('https://a.com/blob', 'application/octet-stream')).toMatch(/\.bin$/);
  });

  it('handles root and trailing-slash paths', () => {
    expect(localPathForUrl('https://a.com/', 'text/css')).toBe('assets/a.com/index.css');
  });

  it('sanitizes unsafe characters', () => {
    expect(localPathForUrl('https://a.com/f%20o@o.js')).toBe('assets/a.com/f_o_o.js');
  });
});

describe('extensionForContentType', () => {
  it('ignores charset suffix', () => {
    expect(extensionForContentType('text/css; charset=utf-8')).toBe('.css');
  });
});

describe('urlVariants', () => {
  it('includes the protocol-relative form', () => {
    expect(urlVariants('https://a.com/x.js')).toEqual(['https://a.com/x.js', '//a.com/x.js']);
  });
});
