import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resolveConfig } from '../src/config.js';
import { snapshotPage } from '../src/snapshot.js';

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

const ROUTES: Record<string, { type: string; body: string | Buffer }> = {
  '/': {
    type: 'text/html',
    body: `<!doctype html><html><head>
      <link rel="stylesheet" href="/css/main.css">
      </head><body><img src="/img/logo.png"><div id="dyn"></div>
      <script src="/js/app.js"></script></body></html>`,
  },
  '/css/main.css': { type: 'text/css', body: 'body{background:url(../img/logo.png)}' },
  '/js/app.js': { type: 'application/javascript', body: 'document.getElementById("dyn").textContent="loaded";' },
  '/img/logo.png': { type: 'image/png', body: PNG_1PX },
};

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const route = ROUTES[req.url ?? '/'];
    if (!route) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': route.type }).end(route.body);
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const address = server.address() as { port: number };
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(() => new Promise<void>((r) => server.close(() => r())));

describe('snapshotPage integration', () => {
  it('produces an offline mirror with rewritten relative paths', async () => {
    const outputDir = path.join('output', '.test');
    fs.rmSync(outputDir, { recursive: true, force: true });
    const config = resolveConfig({ pages: {}, outputDir, extraWaitMs: 200, scrollToBottom: false });
    const browser = await chromium.launch();
    try {
      const result = await snapshotPage(browser, 'fixture', `${baseUrl}/`, config);
      expect(result.assetCount).toBe(3);
    } finally {
      await browser.close();
    }

    const pageDir = path.join(outputDir, 'fixture');
    const html = fs.readFileSync(path.join(pageDir, 'index.html'), 'utf8');
    expect(html).toContain('src="assets/127.0.0.1/img/logo.png"');
    expect(html).toContain('href="assets/127.0.0.1/css/main.css"');
    expect(html).toContain('loaded'); // JS executed before capture
    expect(html).not.toContain(baseUrl);

    expect(fs.existsSync(path.join(pageDir, 'assets/127.0.0.1/img/logo.png'))).toBe(true);
    const css = fs.readFileSync(path.join(pageDir, 'assets/127.0.0.1/css/main.css'), 'utf8');
    expect(css).toContain('url(../img/logo.png)');
  }, 60_000);
});
