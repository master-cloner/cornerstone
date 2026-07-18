# Cornerstone

Dynamic website snapshot & offline mirror generator, built on **TypeScript + Playwright**.

It renders pages in headless Chromium, captures every asset the page actually loads (images, JS, CSS, fonts, media — including lazy-loaded and JS-injected resources) via network interception, then rewrites the HTML/CSS so the result opens directly from disk, fully offline.

## Requirements

- Node.js >= 20
- Chromium via Playwright: `npx playwright install chromium`
  (on Linux also `sudo npx playwright install-deps chromium`)

## Usage

```bash
npm install

# Snapshot a single URL, no config needed
npx tsx src/index.ts https://example.com

# Or configure multiple pages in cornerstone.config.ts, then:
npm start
```

Output goes to `output/<name>/index.html` with assets under `output/<name>/assets/<host>/...`.

## Viewing a snapshot

All captured URLs are rewritten to relative paths, so `index.html` opens directly from disk (`file://`) fully offline. For an environment closer to a real deployment, serve it instead:

```bash
npx serve output/<name>
# or
python3 -m http.server 8080 --directory output/<name>
```

URLs that were never captured (e.g. API calls made after the snapshot) are left untouched and will simply fail to load offline — graceful degradation is intentional. Heavily JS-driven sites will only show what was rendered at capture time.

## Configuration (`cornerstone.config.ts`)

```ts
import type { CornerstoneConfig } from './src/config.js';

const config: CornerstoneConfig = {
  pages: {
    index: 'https://www.bilibili.com',
    list: 'https://www.bilibili.com/v/dance/',
  },
};

export default config;
```

| Option | Default | Description |
|---|---|---|
| `pages` | — | map of name → URL to snapshot |
| `outputDir` | `output` | output root |
| `waitUntil` | `networkidle` | Playwright navigation wait condition |
| `extraWaitMs` | `1000` | extra settle time after load |
| `scrollToBottom` | `true` | auto-scroll to trigger lazy loading |
| `randomDelay` | `false` | random 0–2s pause between pages |
| `assetTypes` | all | subset of `image` / `script` / `stylesheet` / `font` / `media` |
| `headless` | `true` | run Chromium headless |

## How it works

1. Attaches a network response listener before navigation and buffers every image/script/stylesheet/font/media body (`src/assets.ts`).
2. Renders the page in headless Chromium, optionally auto-scrolling to trigger lazy loading (`src/snapshot.ts`).
3. Rewrites captured URLs in the serialized HTML to relative local paths (longest-first plain string replacement — handles srcset, inline styles, etc.) and resolves `url(...)` refs inside captured CSS (`src/rewrite.ts`).
4. Writes everything to `output/<name>/`, mapping each URL to a safe deterministic local path (`src/util.ts`).

## Development

```bash
npm test          # vitest: unit + local-fixture integration test
npm run typecheck
```

## License

MIT
