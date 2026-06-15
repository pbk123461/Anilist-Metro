# CLAUDE.md — AniList Metro Web App

> **For Claude (and all AI sessions):** Read this file first before making any changes. It is the single source of truth for this project.

---

## 1. Project Summary

**AniList Metro** is a single-file (`index.html`) Vanilla HTML/CSS/JS web application that provides a Windows Phone 7 / Zune HD–style interface for the AniList anime/manga tracking platform. It is AMOLED-optimized, strictly Metro-designed, and authentication-aware.

- **Main file:** `/Users/BrijeshKrishnan/BRIJESH KRISHNAN/projectgobrr/index.html`
- **Stack:** Vanilla HTML5 + CSS3 + ES6+ JavaScript — **no build tools, no Node, no framework**
- **API:** AniList GraphQL v2 — `https://graphql.anilist.co`
- **External CDN:** FontAwesome 6.4.0, Metro UI CSS v4 (reference only)
- **Sounds:** `xbox360 metro soundeffects/` directory (`.wav` files via Web Audio API)

---

## 2. The Prime Directive — Metro UI Design Bible

You are an expert Frontend Engineer specializing in the **Windows Phone 7 / Zune HD Metro design language**. You MUST strictly follow these rules in every edit.

### 2.1 Core Geometry
- `border-radius: 0 !important` — **zero rounded corners, everywhere, always**
- `box-shadow: none !important` — **zero shadows, ever**
- Depth through color contrast only. Surfaces are solid flat colors.
- No borders unless it is a transparent border that turns solid on focus/hover.

### 2.2 Color Palette (AMOLED)
```css
--bg:               #000000;   /* pure black background */
--surface:          #111111;   /* dark grey for cards, inputs, buttons */
--surface-hover:    #1a1a1a;   /* slightly lighter for active states */
--text-main:        #ffffff;   /* pure white */
--text-dim:         rgba(255,255,255,0.4); /* inactive tabs, subtitles */
--hero-bg-text:     rgba(255,255,255,0.04); /* faint watermark text */
--accent:           #1ba1e2;   /* high-saturation solid accent */
```
Optional Metro colors: `#60a917` green, `#f39c12` amber, `#e81123` red, `#d80073` magenta, `#76608a` purple, `#fa6800` orange

### 2.3 Typography
- `font-family: 'Segoe UI Light', 'Segoe UI Variable Display', 'Segoe UI', Tahoma, sans-serif`
- **ALL UI text is LOWERCASE** (`text-transform: lowercase`) — headers, buttons, tabs, nav items
- `font-weight: 300` for most text; `font-weight: 100` for giant hero text
- Never use bold for UI chrome — only for highlighted data points
- Font size hierarchy:
  - Hero background text: 140–180px, weight 100
  - Page titles (h1): 6.5rem, weight 100
  - Section headers: 2.2–3rem, weight 300
  - Body text: 1rem, weight 300
  - Labels: 0.75–0.9rem, weight 400

### 2.4 Layout — Panorama & Pivot
- Main app: horizontally scrolling flex container (`width: 100vw; height: 100vh; overflow-x: auto; scroll-snap-type: x mandatory`)
- Each section is `.header-section`, exactly `85vw` wide on desktop
- `html, body` must have `overflow: hidden; max-width: 100vw` (prevents vertical wobble)
- Fixed background hero text at `position: fixed; top: 10px; left: 60px; z-index: 0`
- Top nav: fixed `.xbox-nav`, active item at `font-size: 48px; font-weight: 200`

### 2.5 Components

**Tiles:** Square (1:1) or rectangular (2:1 / 4:2), solid `--accent` or Metro color, hover shifts color, click = `transform: scale(0.95)`

**Inputs:** `background: #111111; border: 2px solid transparent;` → on focus: `border-color: var(--accent)`

**Buttons:** Solid flat `var(--surface)` or `var(--accent)`, hover = `scale(0.95)` + brightness change, lowercase, no border

**Subviews (modals):** Full-screen panels sliding from the right:
```css
.metro-subview { position: fixed; inset: 0; left: 100vw; transition: left 0.4s cubic-bezier(0.1, 0.9, 0.2, 1); }
.metro-subview.open { left: 0; }
```
No centered modal dialogs — ever.

**Pivot tabs:** `font-size: 24px; font-weight: 300; color: var(--text-dim)` → active: `color: var(--text-main); font-weight: 400`

**Progress bars:** `height: 4px; background: var(--accent);` — thin, solid, no border

**List items:** Thumbnail (left, 50–70px) + info right. Hover = `background: var(--surface-hover)`. No border unless focused.

### 2.6 Motion & Animation
- Easing: always `cubic-bezier(0.1, 0.9, 0.2, 1)` (fast start, long smooth decel)
- Duration: 0.2s for micro-interactions, 0.4s for panels/navigation
- Click = `scale(0.95)` tactile feedback
- Panorama: `scroll-behavior: smooth`

### 2.7 Responsive
- Desktop: section `85vw`, padding `60px`, nav `60px`
- Tablet (768–1024px): `95vw`, `40px`
- Mobile (<768px): `100vw`, `20px`, hide arrows

### 2.8 Scrollbars
- Main panorama: `::-webkit-scrollbar { display: none; }`
- Content areas: `scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent;`

---

## 3. Critical Preservation Rules

### 3.1 LocalStorage Keys — DO NOT RENAME OR REMOVE
| Key | Purpose |
|-----|---------|
| `anilist_token` | OAuth access token |
| `metro_theme` | Accent color hex |
| `metro_theme_name` | Accent color name |
| `theme_mode` | `dark` or `light` |
| `metro_wallpaper` | Wallpaper data URL |
| `metro_wallpaper_name` | Wallpaper filename |
| `show_adult` | Adult content toggle |
| `title_language` | Title language preference |

### 3.2 Global JS Variables — DO NOT REMOVE
```js
accessToken          // AniList OAuth token
currentUserId        // logged-in user's AniList ID
isGuest              // boolean — guest mode flag
feedMode             // UI state for community feed
inboxMode            // UI state for inbox
airingView           // airing section view state
showAdultContent     // boolean content filter
wallpaperDataUrl     // current wallpaper
wallpaperName        // wallpaper filename
allListsData         // cached library data (anime/manga)
currentMediaCache    // active detail panel media
navigationHistoryAiringSelectedDate // airing calendar date
communityPage        // pagination state
notifPage            // notification pagination state
```

### 3.3 Section Indexing
Sections are **zero-indexed**. If you add or remove sections, update:
- `.header-section` scroll targets
- `nav-item onclick="scrollToSection(N)"` handlers
- Ensure no gaps or duplicates

### 3.4 No Hallucination
Do **not** invent new features, APIs, or CSS frameworks. Only modify existing sections or extend with explicit user approval.

---

## 4. Code Structure (Approximate Line Ranges)

| Lines | Content |
|-------|---------|
| 1–450 | CSS variables, core layout, panorama engine, animations |
| 450–900 | Component styles (tiles, buttons, inputs, toggles, calendar, etc.) |
| 900–1100 | DOMContentLoaded, theme setup, wallpaper loader |
| 1100–1300 | Auth, settings, logout, API fetch wrapper |
| 1200–1400 | User data loader, community feed, social interactions |
| 1300–1500 | Notifications, detail panel |
| 1400–1600 | Airing calendar and schedule |
| 1600–1800 | Library, media editor |
| 1800–2100 | Search, detail rendering, video player |
| 2100+ | Utility functions |

---

## 5. Architecture Notes (May 2026 Refactors)

### Audio Engine (`Sfx` object)
- Uses **Web Audio API (`AudioContext`)** — NOT `new Audio()`
- Volume calibrated to 4–12% gain ("Soft" levels)
- Pitch randomization on navigation events for organic feel
- Sound packs: `classic` (Xbox 360), `soft`, `minimal` — switchable in Settings
- SFX source files: `xbox360 metro soundeffects/`
- `AudioContext` must be resumed via a user gesture (handled in `DOMContentLoaded` and `Sfx.play()`)

### Theme & Wallpaper Engine
- `--wallpaper-overlay`: `65%` black (dark mode) / `85%` white (light mode)
- All UI components use CSS variables — never hard-coded colors
- Zune top-blur layer (`.top-blur-layer`) behind top nav, toggleable in Settings

### UI Refinements Applied
- Settings back button: `position: sticky` for long subview scrolling
- Library GraphQL fix: list groups include `name` and `status` fields
- Library progress: completed anime substitutes total episodes when progress = 0
- Hero background: 'airing' label restored in parallax text

---

## 6. AniList GraphQL API Rules

- Always use `window.fetch()` with GraphQL structure
- Validate all query syntax before inserting
- Variables must be correctly structured
- Always include error handling **with token expiry detection**
- Pagination: use `Page` with `pageInfo` for all list queries
- Rate limit: 90 req/min. Handle `X-RateLimit-*` headers. Retry with backoff on 429.

---

## 7. Completed Tasks (as of May 2026)

1. ✅ Auth: `login()` and `guestMode()` correctly hide overlay and show `app-container`
2. ✅ Airing: Selected day panel placed on right side of calendar
3. ✅ Airing: Vertical timeline view on right side of airing list
4. ✅ Discover: Trending set as default tab
5. ✅ Discover: 'More' buttons with zoom-out animation
6. ✅ Discover: 'Episode Discussions' and 'Manga Reader Corner' functional
7. ✅ Layout: Metro UI zoom-out animations for all list/grid transitions
8. ✅ Layout: Fixed User and Media Overviews (no truncations — `white-space: normal`)
9. ✅ Layout: Fixed 'SFW Trending' slideshow on login overlay
10. ✅ Settings: No white boxes in subviews (`background: var(--bg)`)
11. ✅ Settings: Color wheel with fixed-size custom color picker (40×40px)
12. ✅ System: Wallpaper import size validation before FileReader
13. ✅ System: Arrow key navigation throttled (300ms)
14. ✅ System: Rate limit handling with token expiry detection

---

## 8. Feature Backlog (todo.txt — all uncompleted)

### Media Browsing & Discovery
- Search (full-text across anime/manga/characters/staff/studios/users)
- Search filters: type, format, status, season+year, genre, tag, source, country, year range, episodes/chapters range, score range, adult toggle, on-list toggle
- Search sort: trending, popularity, score, newest, oldest, title, dates, episodes, etc.
- Fuzzy search, recent search history
- Browse: trending, popular this season, upcoming next season, all-time popular, top 100
- Browse: by genre/tag/studio, AniChart-style seasonal calendar, airing schedule with countdowns

### Media Detail Page
- Full title display (romaji/english/native + synonyms)
- Cover image (standard + XL), banner image
- Type, format, status, source, episodes/chapters/volumes, duration
- Start/end dates, season+year, country
- Description (HTML render), adult/licensed flags
- Score (mean/avg), popularity, favourites, trending rank
- Score distribution chart, status distribution chart
- Rankings, genres (tappable), tags with rank % and spoiler toggle
- External links, trailer embed, streaming links
- Relations, characters list (with VA), staff list, studios
- Recommendations (vote up/down), reviews (paginated), forum threads
- Airing schedule + trends graph
- Auth: inline list status, quick-add, favourite toggle, own review/recommendations, `mediaListEntry`

### List Management (auth)
- All standard AniList list fields (status, score, progress, repeat, priority, private, notes, custom lists, advanced scores, dates)
- Bulk edit and delete
- Auto-set Completed on max progress; auto-set dates on status change
- List views: compact, detailed, grid
- Sort and filter within list; search within list; split completed by format
- Episode +1 button and score input from list row

### User Profile
- Avatar + banner, username, about section, profile colour
- Follower/following counts and lists
- Favourites (all types, paged)
- Anime/manga stats with breakdowns (format, status, score, genre, tag, country, VA, staff, studio)
- Graphs: score distribution, timeline, activity

### Social & Activity
- Global + following feed toggle
- Activity types: list, text, message
- Like, reply, edit, delete; pin to profile
- Post new text/message to user
- Follow/unfollow, follower/following lists
- Forums: browse, thread detail, nested replies, like/reply/create/edit/delete, subscribe, categories
- Reviews: browse, detail, rate, write/edit/delete own
- Recommendations: vote, global feed

### Notifications (auth)
- All notification types (airing, follow, activity, thread, media change)
- Unread count badge, mark all as read, filter by type
- Local push notifications for airing

### Characters & Staff
- Character detail: name, image, description, gender/DOB/age/blood type, favourites, media appearances, voice actors
- Staff detail: name, image, description, language, occupations, roles
- Studio detail: name, media produced, main works toggle, favourite toggle

### User Settings (auth)
- Display name, bio (HTML editor)
- Scoring format (100/10-decimal/10/5/3), advanced scoring
- Title/character name language, activity merge time, adult toggle, message restrictions
- Default list order, split completed toggle
- Custom anime/manga lists (add/rename/delete, drag-to-reorder)
- Notification preferences per type

### App-Level Local Settings
- Theme (system/light/dark), accent colour (sync from profile or override)
- Default home tab, preferred media type, image quality, NSFW thumbnail override
- Spoiler tag reveal default, list display default, swipe gesture shortcuts
- Calendar view, countdown format, notification polling interval, haptic feedback
- Clear image cache, export list to CSV/JSON
- About (version, licenses), rate limit indicator
- Logout / switch account

### Auth & Onboarding
- OAuth2 implicit flow (redirect + capture token)
- Secure token storage, expiry detection (1 year), prompt re-auth
- Guest mode, onboarding flow, deep-link support

### Pagination & API Hygiene
- All list queries use `Page` with `pageInfo`
- Infinite scroll / load-more everywhere
- Rate limit handling (90 req/min, X-RateLimit headers)
- Retry with exponential backoff on 429
- Error boundary for GraphQL errors
- Optimistic UI updates for list mutations
- Offline cache (serve stale data)

---

## 9. Reference Files

| File | Purpose |
|------|---------|
| `index.html` | Main application — all logic, styles, and markup |
| `index_v2.html` | Extended version (may lag behind `index.html`) |
| `CLAUDEREF3.html` | Layout structure reference |
| `gemini-code-*.html` | Additional layout references |
| `anilist_app_features_spec.html` | Full feature specification |
| `rules.txt` | Full Metro UI design bible (canonical) |
| `handoff.md` | May 2026 session state and architecture notes |
| `todo.txt` | Task history and full feature backlog |
| `restoresesh.txt` | Session state snapshot |
| `xbox360 metro soundeffects/` | `.wav` SFX files |

---

## 10. Handoff Checklist (when ending a session)

1. All `localStorage` keys still intact and functional
2. All global JS variables still declared and used correctly
3. Section indexing unchanged (or updated if sections added/removed)
4. All API calls use correct AniList GraphQL syntax with error handling
5. Metro UI rules respected: zero radius, zero shadow, lowercase, flat
6. No new external dependencies introduced without approval
7. Update `handoff.md` with any major architecture changes

---

*Generated: June 2026 — consolidates `rules.txt`, `handoff.md`, and `todo.txt`*
