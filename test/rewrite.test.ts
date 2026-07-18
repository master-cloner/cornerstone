import { describe, expect, it } from 'vitest';
import type { CapturedAsset } from '../src/assets.js';
import { rewriteCss, rewriteHtml } from '../src/rewrite.js';

function asset(url: string, localPath: string, body = '', resourceType: CapturedAsset['resourceType'] = 'image'): CapturedAsset {
  return { url, localPath, body: Buffer.from(body), contentType: '', resourceType };
}

function assetMap(...items: CapturedAsset[]): Map<string, CapturedAsset> {
  return new Map(items.map((a) => [a.url, a]));
}

describe('rewriteHtml', () => {
  it('replaces absolute and protocol-relative URLs', () => {
    const assets = assetMap(asset('https://cdn.a.com/x.png', 'assets/cdn.a.com/x.png'));
    const html = '<img src="https://cdn.a.com/x.png"><img src="//cdn.a.com/x.png">';
    expect(rewriteHtml(html, assets)).toBe('<img src="assets/cdn.a.com/x.png"><img src="assets/cdn.a.com/x.png">');
  });

  it('replaces longer URLs before their prefixes', () => {
    const assets = assetMap(
      asset('https://a.com/x.png', 'assets/a.com/x.png'),
      asset('https://a.com/x.png?v=2', 'assets/a.com/x.deadbeef.png')
    );
    const out = rewriteHtml('<img src="https://a.com/x.png?v=2">', assets);
    expect(out).toContain('assets/a.com/x.deadbeef.png');
  });

  it('rewrites srcset candidates', () => {
    const assets = assetMap(
      asset('https://a.com/s.png', 'assets/a.com/s.png'),
      asset('https://a.com/l.png', 'assets/a.com/l.png')
    );
    const out = rewriteHtml('<img srcset="https://a.com/s.png 1x, https://a.com/l.png 2x">', assets);
    expect(out).toBe('<img srcset="assets/a.com/s.png 1x, assets/a.com/l.png 2x">');
  });

  it('rewrites root-relative refs for same-origin assets', () => {
    const assets = assetMap(asset('https://a.com/css/main.css', 'assets/a.com/css/main.css'));
    const html = '<link href="/css/main.css"><p>see /css/main.css docs</p>';
    const out = rewriteHtml(html, assets, 'https://a.com/');
    expect(out).toContain('href="assets/a.com/css/main.css"');
  });

  it('does not touch root-relative refs from other origins', () => {
    const assets = assetMap(asset('https://cdn.b.com/css/main.css', 'assets/cdn.b.com/css/main.css'));
    const out = rewriteHtml('<link href="/css/main.css">', assets, 'https://a.com/');
    expect(out).toContain('href="/css/main.css"');
  });

  it('removes <base> tags', () => {
    expect(rewriteHtml('<head><base href="https://a.com/"></head>', assetMap())).toBe('<head></head>');
  });
});

describe('rewriteCss', () => {
  it('rewrites relative and absolute url() refs to paths relative to the css file', () => {
    const font = asset('https://cdn.a.com/fonts/f.woff2', 'assets/cdn.a.com/fonts/f.woff2');
    const img = asset('https://other.com/bg.png', 'assets/other.com/bg.png');
    const css = asset(
      'https://cdn.a.com/css/main.css',
      'assets/cdn.a.com/css/main.css',
      "@font-face{src:url('../fonts/f.woff2')} body{background:url(https://other.com/bg.png)}",
      'stylesheet'
    );
    const out = rewriteCss(css, assetMap(font, img, css));
    expect(out).toContain('url(../fonts/f.woff2)');
    expect(out).toContain('url(../../other.com/bg.png)');
  });

  it('leaves data: URIs and unknown refs untouched', () => {
    const css = asset('https://a.com/m.css', 'assets/a.com/m.css', 'a{background:url(data:image/png;base64,xx)} b{background:url(/missing.png)}', 'stylesheet');
    const out = rewriteCss(css, assetMap(css));
    expect(out).toContain('url(data:image/png;base64,xx)');
    expect(out).toContain('url(/missing.png)');
  });
});
