# Handoff: AniList Metro (AMOLED Zune Edition)

This document provides an overview of the current state of the project, technical architecture, and recent critical updates.

## Legacy-first rebuild (October 2026)

- `index.html` is now the primary legacy-first entry and is based on the
  complete working implementation preserved in `index-legacy.html`.
- `index_v2.html` remains the stable comparison/reference entry. The split
  section files remain available for migration/reference work, but the primary
  entry no longer depends on the fragile synchronous fragment loader.
- The primary entry preserves the original panorama, authentication, guest
  mode, settings, library, discover, community, airing, inbox, and detail
  runtime. The approved tile editor, independent icon-color setting, fuzzy
  search/activity compatibility hooks, and responsive overrides are layered
  after the legacy runtime.
- Loose historical notes were organized under `docs/notes/` without deleting
  Markdown or text materials. See `info.txt` for the current stack, file
  structure, runtime flow, and validation commands.
- Restored geometry-based panorama targets so desktop and mobile navigation use
  actual section offsets instead of assuming every section is viewport width.
  Added mobile active-nav synchronization and restored a compact horizontal top
  flow bar on mobile. Start-tile layout keeps row flow explicit and was not
  vertically resized or reordered by this fix.
- Restored the legacy sound-pack selector and its classic Xbox 360 mappings.
  Navigation icon styling now keeps active icons accent-colored and inactive
  icons visible gray, including when the dark icon preference is selected.
- Live start tiles now share one cached anime item across discover and optional
  anime tiles, and rotate up to three available anime tiles together every
  2.8 seconds instead of moving only one tile every 7.2 seconds.
- Start-screen grid packing now uses dense responsive tracks so mixed tile spans
  fill available space instead of leaving sparse rows and large empty gaps.
  The tile editor follows the full grid width while retaining flat Metro
  surfaces and the existing tile size choices.
- Live anime content is now assigned to one available anime tile at a time.
  Discover, airing, watching, and random tiles no longer all display and flip
  the same anime card simultaneously; inactive tiles retain distinct labels.
- Mobile panorama swipes now use an explicit horizontal gesture guard and snap
  back to the nearest full section after scrolling settles. Nested content
  scrollers and controls are excluded, and mobile navigation state is updated
  from the same section target so clipped half-panel states do not persist.
- Inbox section loading now handles guest mode, missing API responses, and
  request failures with visible sign-in, empty, or retry states. Failed loads
  return `false` so section initialization can retry on a later visit.
- Start-screen layout now uses compact Metro span tracks instead of expanding
  auto-fill rows, with a content-sized start scroller and tighter grid padding
  to reduce unused blank space while preserving small, medium, wide, and large
  tile spans. Scrollbars now use thin accent/surface tracks and themed thumbs
  across WebKit and Firefox-compatible paths.

## Project Overview
AniList Metro is a single-file web application that provides a high-performance, Xbox 360 and Zune-inspired interface for the AniList platform. It adheres strictly to the Metro Design Language (zero rounded corners, zero shadows, lowercase typography, and AMOLED-optimized colors).

## Recent Major Refactors (May 2026)

### 1. Audio Engine (Sfx Object)
- **Refactor**: Switched from `new Audio()` to the **Web Audio API (`AudioContext`)**.
- **Impact**: Eliminated audio crackling and performance stutters during rapid navigation.
- **Volume**: Calibrated to "Soft" levels (4% to 12% gain) to avoid headphone fatigue.
- **Features**: Legacy WAV assets use conservative per-cue volume, ±1.5% variation
  for short navigation cues, and original pitch for welcome/login/achievement cues.
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

## Planned Feature and Architecture Work (October 2026)

The following requirements were selected for the next implementation pass:

### User-selected settings and start-screen behavior
- Theme settings provide dark mode, light mode, and automatic system detection.
- Icon color is independently configurable; users can choose white or dark icons regardless of the active theme.
- Start-screen tiles support small, medium, wide, and large presets.
- Start-screen tiles remain reorderable with mouse drag-and-drop.
- A tile picker lets users enable or disable optional AniList-related tiles, including:
  - airing today
  - currently watching
  - quick search
  - random anime
  - unread notifications
- Search keeps exact matches first and ranks approximate title matches afterward.

### Bug-fix scope
- Correct mobile scaling and prevent overlapping content in dense sections.
- Keep the navigation bar synchronized when users swipe or scroll between panorama sections.
- Make mouse-drag panorama navigation settle reliably and update the active navigation item.
- Show useful date/activity information when hovering activity-list entries.

### Approved and implemented multi-file migration
The current monolithic application will be split into an organized shared-shell structure:

```text
index.html                 # new shared panorama shell and application entry point
index-legacy.html          # preserved monolithic fallback during migration
start.html                 # start-screen section markup
user.html                  # user section markup
library.html               # library section markup
community.html             # community section markup
discover.html              # discover/search section markup
airing.html                # airing section markup
inbox.html                 # inbox/notifications section markup
system.html                # settings/system section markup
css/
  metro.css                # shared Metro layout, theme, responsive, and component styles
js/
  app.js                   # bootstrap and shared application state
  api.js                   # AniList GraphQL and API/cache helpers
  navigation.js             # panorama, swipe, mouse-drag, and nav synchronization
  settings.js               # theme, icon color, tile-picker, and user settings
  tiles.js                  # start-screen tiles, sizes, ordering, and live tile behavior
```

The split app will preserve the current horizontal panorama and load section markup
into the shared shell without full-page reloads. The new `index.html` becomes the
default entry point, while `index-legacy.html` remains available as a backward-
compatible fallback until the split version is verified.

The migration must preserve all existing localStorage keys, global JavaScript
variables, eight zero-indexed sections, AniList authentication behavior, API
error/rate-limit handling, and Metro visual invariants. No existing data or
authentication state may be reset as part of the split.

The initial split is now present in the repository. The legacy file remains
available while the new shell and section files are verified. Shared modules
also provide the icon-color preference, tile preference helpers, panorama drag
and navigation synchronization, approximate title ranking, random-anime tile
behavior, and activity hover labels.

### Browser verification follow-up (October 2026)
- Reset authenticated and guest startup to section 0 so the top navigation
  does not open with `system` selected while the start screen is visible.
- Changed panorama target calculations to use actual section offsets, fixing
  navigation for the full-width library section and the mobile layout.
- Added an explicit `edit tiles` / `done editing` control on the start screen;
  drag-and-drop is enabled only while editing.
- Added start-screen tile size and optional-tile controls to system settings.
- Added mobile overflow bounds for user stats, activity, settings, and tile
  grids to prevent scaling overlap.

### Compatibility repair (October 2026)
- Restored the original five start tiles as the default visible layout. Optional
  AniList shortcuts are no longer rendered into the start grid on first load.
- Added a discreet `edit tiles` pane with add/remove controls for airing today,
  currently watching, quick search, random anime, and unread notifications.
- Tile dragging is disabled unless the `edit tiles` mode is active. Dynamic
  optional tiles reuse the same guarded reorder initialization and preserve
  `metro_start_tile_order`.
- Hardened settings subview open/close handling so missing or not-yet-loaded
  views fail explicitly instead of throwing a null-reference error.
- Changed start-grid rows and gaps to bounded viewport-relative values, with
  mobile-safe fractional columns and clamped row sizes to prevent overlap.
- Validation completed: JavaScript syntax checks, `git diff --check`, HTTP
  serving checks for all split section/module assets, and static verification
  that optional tiles are absent from the default start markup.

### Metro live tiles and complete tile removal (October 2026)
- Updated start tiles to use Metro UI v4's documented `data-role="live-tile"`
  structure with `data-effect`, `data-period`, `tile-content`, and
  `event-content` frames.
- Preserved AniList-driven tile content and custom wallpaper/live updates while
  allowing Metro UI to initialize the documented live-tile widget.
- All default tiles can now be removed from the editor, not only optional
  shortcuts. Visibility is persisted under the new `metro_tile_visibility`
  preference key; existing storage keys remain unchanged.
- Added `restore defaults` to recreate profile, library, discover, inbox, and
  community tiles.
- Dynamic tiles reinitialize both the shared reorder behavior and Metro's tile
  initialization without duplicating live-tile wrappers or rotation timers.

### Mobile layout contract (October 2026)
- Added a final mobile-first override block to prevent earlier desktop/tablet
  breakpoints from reintroducing fixed widths or multi-column layouts.
- Mobile panorama sections are exactly viewport width, use dynamic viewport
  height, and reserve space for the bottom navigation safe area.
- User, library, discover, airing, settings, editor, and detail content now
  collapse to contained layouts with bounded controls and internal vertical
  scrolling.
- Mobile library shelves use two-column poster grids or one-column list mode;
  user statistics, activity heatmaps, favorites, and quick links are sized to
  avoid horizontal overflow.
- Mobile navigation labels are clipped safely and the bottom bar accounts for
  device safe-area insets.
- Validation completed with JavaScript syntax checks, `git diff --check`, HTTP
  asset serving checks, and browser loading verification at the local server.

### Legacy-backed split rebuild (October 2026)
- Rebuilt the active [index.html](./index.html) entry around the complete
  legacy runtime instead of the earlier reduced shell. This restores the
  legacy user, library, community, discover, airing, inbox, settings, detail,
  authentication, and interaction surfaces while keeping section markup in
  separate files.
- Regenerated [start.html](./start.html), [user.html](./user.html),
  [library.html](./library.html), [community.html](./community.html),
  [discover.html](./discover.html), [airing.html](./airing.html),
  [inbox.html](./inbox.html), and [system.html](./system.html) from the
  complete legacy sections. [index-legacy.html](./index-legacy.html) remains
  as the untouched monolithic fallback/source of truth.
- The start editor now preserves the original default tiles, keeps all tile
  dragging locked until edit mode is enabled, supports removing both default
  and optional tiles, restores defaults, persists tile order/visibility/size,
  and uses Metro UI v4 live-tile markup (`data-role="live-tile"`,
  `tile-content`, and `event-content`).
- Restored compatibility modules are loaded after the legacy runtime:
  [js/api.js](./js/api.js), [js/settings.js](./js/settings.js),
  [js/tiles.js](./js/tiles.js), and [js/app.js](./js/app.js). This preserves
  the fuzzy title ranking, random-anime action, activity hover labels, icon
  preference, and tile editor behavior without replacing legacy functions.
- Removed the obsolete reduced-shell prototype. The synchronous fragment
  loader remains transitional and should be replaced only after the legacy
  initialization order is covered by browser regression checks.
- Validation completed for JavaScript syntax, `git diff --check`, local HTTP
  serving, section/module asset availability, and initial browser rendering.
  Full guest/authenticated interaction coverage and narrow-viewport checks
  remain the next validation pass.


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
