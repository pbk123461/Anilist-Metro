# Repository Guidelines

## Project Structure

AniList Metro is a static, browser-based application built with vanilla HTML, CSS, and JavaScript. `index.html` is the primary legacy-first entry; `index_v2.html` is the stable comparison entry and `index-legacy.html` is the preserved legacy source. Module design notes are in `docs/`, while `vendor/metro-ui/` contains the Metro UI assets. Sound effects are in `xbox360 metro soundeffects/`. `Indexhtmlextract/` is an extracted/reference copy, not the primary app. See `README.md`, `info.txt`, and `CLAUDE.md` for setup and architecture.

## Development Commands

There is no build system, package manager, or automated test suite. Run the site from the repository root with:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. A static server is useful because browser features and API calls may not work correctly from a `file://` URL. Validate changes manually in a modern browser, including relevant signed-in or guest flows when practical.

## Coding Style

Keep the app dependency-free and compatible with its existing vanilla JavaScript approach. Most application code is embedded in `index.html`; make focused edits in the corresponding HTML, CSS, or script section rather than introducing a new framework or build pipeline. Match surrounding indentation and naming patterns (camelCase for JavaScript functions and variables; descriptive kebab-case for CSS classes). Preserve the Metro visual system: flat surfaces, square corners, no shadows, and lowercase interface typography. For API work, follow the AniList GraphQL patterns and error handling documented in `CLAUDE.md` and `docs/`.

## Critical Invariants

- **Persistence**: never rename or remove existing `localStorage` keys or delete declared global JS variables. See `CLAUDE.md` §3.1–3.2 — they are user-facing state and cross-section wiring; breaking them silently corrupts saved data and app logic.
- **Sections**: zero-indexed. Adding/removing a section requires updating `.header-section` scroll targets, `nav-item` onclick handlers, and avoiding gaps or duplicates. See `CLAUDE.md` §3.3.

## Key Quirks

- SFX use the **Web Audio API** (`AudioContext`), not `new Audio()`.
- AniList API: 90 req/min rate limit, `X-RateLimit-*` headers, retry with backoff on 429, token-expiry detection required in all error handling.

## Testing Guidelines

No test framework or coverage threshold is configured. For UI changes, load the page locally and inspect the affected view at desktop and mobile widths. For data or API changes, exercise guest and authenticated paths as relevant, check browser console/network errors, and verify pagination and rate-limit behavior where touched. Do not treat reference HTML files as test fixtures without confirming their role.

## Commits and Pull Requests

Recent history uses short, imperative subjects, often with conventional prefixes such as `feat:`, `refactor:`, and `docs:`. Follow that pattern (for example, `fix: preserve airing date selection`). Keep commits scoped. A pull request should describe the user-visible change, note manual verification steps, link related issues when available, and include screenshots for visual changes. Call out API or configuration changes explicitly.

## Configuration and Sensitive Data

The app calls AniList's public GraphQL endpoint directly from the browser and uses client-side OAuth. Never commit access tokens, personal account data, or secrets. Avoid adding dependencies or changing authentication/storage behavior without updating the relevant documentation.
