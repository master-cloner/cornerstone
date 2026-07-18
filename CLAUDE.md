# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cornerstone is a dynamic website snapshot & offline mirror generator built on TypeScript + Playwright. It renders pages in headless Chromium, captures assets via network interception (`page.on('response')`), and rewrites HTML/CSS URLs to relative local paths so `output/<name>/index.html` opens fully offline.

Requires Node >= 20 and Playwright Chromium (`npx playwright install chromium`; on Linux also `sudo npx playwright install-deps chromium`).

## Commands

- Install: `npm install`
- Run with config: `npm start` (reads `cornerstone.config.ts`)
- Run one URL: `npx tsx src/index.ts <url>`
- Tests: `npm test` (vitest — unit tests plus an integration test that spins up a local HTTP fixture and drives real Chromium)
- Typecheck: `npm run typecheck`

## Architecture

Pipeline per page, driven from `src/index.ts` → `snapshotAll` (`src/snapshot.ts`):

1. `src/config.ts` — `CornerstoneConfig` type, defaults via `resolveConfig`, loads `cornerstone.config.ts` by dynamic import.
2. `src/assets.ts` — `collectAssets` attaches the response listener before navigation and buffers bodies of image/script/stylesheet/font/media responses (status 200 only); `writeAssets` flushes them to `output/<name>/assets/<host>/<path>`.
3. `src/snapshot.ts` — launches Chromium, navigates with `waitUntil`, optional auto-scroll for lazy loading, takes `page.content()`, rewrites captured stylesheets in place (so CSS-referenced fonts/images resolve), writes everything.
4. `src/rewrite.ts` — `rewriteHtml` replaces captured URLs (absolute + protocol-relative variants, longest-first to avoid prefix clobbering) with relative paths and strips `<base>`; `rewriteCss` resolves `url(...)` refs against the stylesheet's own URL.
5. `src/util.ts` — `localPathForUrl` maps a URL to a safe deterministic local path (content-type-based extension inference, query strings disambiguated by hash suffix).

No build step: `tsx` runs TypeScript directly. `output/` is gitignored and wiped per page on each run.

## Notes

- URL rewriting is plain string replacement over the serialized HTML, not DOM-based — this is deliberate (handles srcset, inline styles, etc. uniformly). Preserve the longest-URL-first ordering in `rewriteHtml` when changing it.
- Uncaptured URLs are intentionally left as-is (graceful degradation when offline).
