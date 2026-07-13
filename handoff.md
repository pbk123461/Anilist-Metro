# Handoff: AniList Metro (AMOLED Zune Edition)

This document provides an overview of the current state of the project, technical architecture, and recent critical updates.

## Project Overview
AniList Metro is a single-file web application that provides a high-performance, Xbox 360 and Zune-inspired interface for the AniList platform. It adheres strictly to the Metro Design Language (zero rounded corners, zero shadows, lowercase typography, and AMOLED-optimized colors).

## Recent Major Refactors (May 2026)

### 1. Audio Engine (Sfx Object)
- **Refactor**: Switched from `new Audio()` to the **Web Audio API (`AudioContext`)**.
- **Impact**: Eliminated audio crackling and performance stutters during rapid navigation.
- **Volume**: Calibrated to "Soft" levels (4% to 12% gain) to avoid headphone fatigue.
- **Features**: Real-time pitch randomization on navigation triggers (pan, select, hover) for a more organic feel.
- **Sound Packs**: Added a selector in Settings to switch between 'classic' (Xbox 360), 'soft', and 'minimal' sound packs.
- **Source**: SFX assets are located in `xbox360 metro soundeffects/`.

### 2. Theme & Wallpaper Engine
- **Wallpaper Overlay**: Implemented a dynamic `--wallpaper-overlay` variable. 
    - **Dark Mode**: Soft black overlay (`65%`).
    - **Light Mode**: Soft white overlay (`85%`), ensuring text readability against any user-uploaded image.
- **Theme Variables**: All UI components (tiles, buttons, panels) now strictly follow CSS variables (`--bg`, `--surface`, `--text-main`) to ensure perfect compatibility between Dark and Light modes. CSS specificity was corrected (variables split between `:root` and `[data-theme="light/dark"]`).
- **Zune Top Blur Layer**: Added a frosted glass gradient blur layer (`.top-blur-layer`) behind the top navigation, mimicking the Zune HD interface, complete with a settings toggle.

### 3. UI Refinements
- **Settings**: The back button in settings subviews is now `position: sticky`, ensuring it remains visible while scrolling through long color wheel or info panels.
- **Accent Selection**: Cleaned up the color selection UI. Removed redundant swatches and browser pickers in favor of the custom Color Wheel and Preview Square.
- **Library Tab**: Fixed a critical GraphQL query bug where list groups were missing `name` and `status` fields, crashing the library renderer.
- **Library Progress**: Fixed completed anime showing '0' episodes by automatically substituting the total episodes count when progress is missing.
- **Hero Background**: Restored the missing 'airing' label in the parallax background text.
## Technical Architecture
- **Language**: Vanilla HTML5, CSS3, and ES6+ JavaScript.
- **Styling**: Vanilla CSS with a global variable system for accent colors and themes.
- **API**: AniList GraphQL API (v2) with robust rate-limit handling and token expiry detection.
- **State Management**: LocalStorage for auth tokens, theme preferences, and wallpaper data.

## Key Files
- `index.html`: Main application (contains all logic and styles).
- `xbox360 metro soundeffects/`: Directory containing `.wav` SFX files.
- `todo.txt`: Historical record of completed tasks.

## Maintenance Notes
- **AudioContext**: Remember that the `AudioContext` must be resumed via a user gesture (handled in the `DOMContentLoaded` event and `Sfx.play()` calls).
- **Metro UI**: Maintain the "Zero Radius" rule. All borders and corners must be sharp (90 degrees).
- **Lowercase**: All labels and dynamic text (except titles) should be converted to lowercase using CSS `text-transform: lowercase` or JS `.toLowerCase()`.

---
*Last updated: May 2026*


## Metro UI v4 Rebuild (June 2026)

Switched `index.html` from a vanilla CSS-only recreation to actually loading Metro UI v4 from a vendored copy, then layering an AMOLED/zero-radius override on top.

### Vendored files (extracted from `metro-ui-jekyll-master.zip`)
```
vendor/metro-ui/dist/css/metro-bootstrap.css    # ~244KB, Metro UI 4 v2.0.32
vendor/metro-ui/dist/css/iconFont.css           # MetroSysIcons font face
vendor/metro-ui/dist/css/metro-override.css     # AMOLED / zero-radius override (NEW)
vendor/metro-ui/dist/js/metro.js                # ~193KB, jQuery widget library
vendor/metro-ui/dist/js/jquery/jquery.min.js
vendor/metro-ui/dist/js/jquery/jquery.widget.min.js
```
No CDN dependencies remain (`cdn.metroui.org.ua` URLs removed). External resources still loaded: FontAwesome 6.4.0 from cdnjs, `date-fns` 2.32.2 from jsdelivr.

### Override layer
`metro-override.css` is loaded AFTER `metro-bootstrap.css` so it wins on equal specificity. It enforces:
- `border-radius: 0 !important; box-shadow: none !important; text-shadow: none !important` on all Metro components.
- A `box-shadow: 0 0 0 10px var(--bg)` rule for dialogs only, mirroring the harsh unblurred modal overlay we already had.
- Palette bridge: Metro's `.tile` defaults to `--surface`, `.input-control text` to `--input-bg/--input-color`, etc., so `[data-theme="dark|light"]` flows through.
- Custom flat-square switch thumb at `position: absolute; width: 14px; height: 14px; transition: left 200ms var(--metro-easing)` to keep the toggle feeling Metro-flavored without shipping Metro's rounded pill.
- Inline `style="background-color: ..."` on tiles wins over `.tile { background-color: var(--surface) }` so the start-screen colored tiles (green / amber / magenta / crimson) stay colored.
- Floats are removed on start-screen tiles so the panorama grid layout we already authored isn't broken by Metro's `float: left`.

### Components converted
- Login overlay sign-in / guest-mode buttons -> `<button class="button primary">` etc.
- All `.metro-btn` -> `.button` with `data-role="button"` (36 buttons).
- Start-screen `.metro-tile-start .wide/.medium/.small` -> Metro tile sizes (`double` / default 120px / `half`).
- All 4 settings toggles (sfx, blur, spoilers, adult) -> `<label class="input-control switch"><input data-role="switch"><span class="check"></span><span class="caption">...</span></label>`.
- Two settings selects (sfx pack, title language) wrapped in `<div class="input-control select"><select data-role="select">`.
- All `.pivot-headers` -> `data-role="tabs"` so Metro's tab strip can layer over our existing pivot visuals if needed.

### Preserved (untouched, per project rules)
- All 8 panorama sections, all 8 nav items, all 9 localStorage keys, all SFX files, OAuth login + guest mode, fetchAPI + fetchAPIWithRetry, panorama scroll/keyboard handlers, Sfx Web Audio engine, theme/wallpaper subsystem, login slideshow.

### Init order
`Metro.initAll()` is called from our `DOMContentLoaded` handler so jQuery and Metro JS are already parsed by then. `initMetroUI()` and `initMetroUIWithin(root)` helpers are available for subviews to opt into Metro component initialization after dynamic insertion.

### Known tradeoffs
- Metro UI 4 v2.0.32 is from 2015. Newer v4.5.x at the CDN uses totally different markup (no jQuery, different classes), so we use the last jQuery-based release that matches the existing zip we vendored.
- The `metro-overlay.css` is a single new file at ~9KB. It does NOT undo Metro's component shape (tiles, buttons, tabs, dialogs, switches) - it only flattens and recolors them. Future Metro-specific components can be added by appending selectors here.
- The vendored CSS still references Google Fonts (PT Serif Caption, Open Sans). They're not used because our `:root` font-family is Segoe UI Light, but the network requests will fire. Block at the firewall or remove the @font-face rules from `metro-bootstrap.css` if the 404s are noisy.


### Round 2 fixes (June 2026 — UI breakage fixes)

After the initial rebuild, a couple of cosmetic problems were visible because Metro UI 4 v2.0.32 doesn't match some Metro 4.5+ assumptions baked into its docs:

- **`m4-cloak` is not a v2 thing.** Metro v2's `metro.js` never removes `m4-cloak` from `<body>` after init, which would have left the page invisible. Removed the class from `<body>`. The override CSS no longer references it either.
- **Metro v2 sets `html { font-size: 62.5% }` and `body { font-size: 1.4rem }`.** That breaks rem-based sizing everywhere because 1rem now equals 10px instead of 16px. Override now sets `html { font-size: 100% !important; }` and `body { font-size: 16px !important; }`.
- **Metro v2's `.button` is a flex-utility with `margin: auto` and 4px padding.** We never used `.button` before, so all 38 of our converted buttons looked squashed. The override now restores a proper 12px×24px button with 16px Segoe UI at weight 400 (matches the old `.metro-btn` visual).
- **`pivot-headers` divs with `data-role="tabs"`** collided with Metro's tab-control widget, which expects `<ul><li><a>` markup. Removed `data-role="tabs"` from those divs — our `.pivot-item` styling already handles them.
- **`input-control.select` wraps** were set to `display: inline-block` by Metro. Changed to `display: block` so the select fills its container.
- **`.tile` from Metro had `float: left` and fixed 120×120 dimensions** which broke our grid layouts. Override now forces `float: none !important; width: auto !important; height: auto !important;` so the grid sizing from `.tile-grid` (which still uses `repeat(auto-fill, minmax(130px, 1fr))`) wins.
- **Mobile bottom nav `.button`** has bespoke layout (icon + label stacked). The override uses `body .button` (specificity 0,1,1) so the `.bottom-nav.mobile-bottom-nav .button` rule (specificity 0,2,1) inside our embedded CSS still wins where it should.
- **Hard reset for html/body/`.metro`** added at the top of the override so Metro's white background and box-sizing rules don't bleed into the AMOLED canvas.

If you spot more things, the safe places to add CSS are:
1. `vendor/metro-ui/dist/css/metro-override.css` — for global Metro component tweaks (loaded after `metro-bootstrap.css`).
2. Inside `<style>` in `index.html` — for app-specific components that don't overlap with Metro's selectors.
