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
