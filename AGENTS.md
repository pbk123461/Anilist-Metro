# Repository Guidelines

## Project Structure

AniList Metro is a static, browser-based application built with vanilla HTML, CSS, and JavaScript. The current application lives in `index.html`; `index_v2.html` and the other root-level HTML files are historical or reference versions. Module design notes are in `docs/`, while `vendor/metro-ui/` contains the Metro UI assets. Sound effects are in `xbox360 metro soundeffects/`. `Indexhtmlextract/` is an extracted/reference copy, not the primary app. See `README.md` for user-facing setup and `CLAUDE.md` for detailed architecture and design constraints.

## Development Commands

There is no build system, package manager, or automated test suite. Run the site from the repository root with:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`. A static server is useful because browser features and API calls may not work correctly from a `file://` URL. Validate changes manually in a modern browser, including relevant signed-in or guest flows when practical.

## Coding Style

Keep the app dependency-free and compatible with its existing vanilla JavaScript approach. Most application code is embedded in `index.html`; make focused edits in the corresponding HTML, CSS, or script section rather than introducing a new framework or build pipeline. Match surrounding indentation and naming patterns (camelCase for JavaScript functions and variables; descriptive kebab-case for CSS classes). Preserve the Metro visual system: flat surfaces, square corners, no shadows, and lowercase interface typography. For API work, follow the AniList GraphQL patterns and error handling documented in `CLAUDE.md` and `docs/`.

## Testing Guidelines

No test framework or coverage threshold is configured. For UI changes, load the page locally and inspect the affected view at desktop and mobile widths. For data or API changes, exercise guest and authenticated paths as relevant, check browser console/network errors, and verify pagination and rate-limit behavior where touched. Do not treat reference HTML files as test fixtures without confirming their role.

## Commits and Pull Requests

Recent history uses short, imperative subjects, often with conventional prefixes such as `feat:`, `refactor:`, and `docs:`. Follow that pattern (for example, `fix: preserve airing date selection`). Keep commits scoped. A pull request should describe the user-visible change, note manual verification steps, link related issues when available, and include screenshots for visual changes. Call out API or configuration changes explicitly.

## Configuration and Sensitive Data

The app calls AniList's public GraphQL endpoint directly from the browser and uses client-side OAuth. Never commit access tokens, personal account data, or secrets. Avoid adding dependencies or changing authentication/storage behavior without updating the relevant documentation.
