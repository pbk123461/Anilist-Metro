# Class: ThemeEngine

The `ThemeEngine` module governs the visual aesthetics, AMOLED contrast system, dynamic color wheel, custom wallpaper overlay calibration, and theme persistence for AniList Metro. It adheres strictly to the **Windows Phone 7 / Zune HD design language**: pure black backgrounds, zero corner radii, zero drop-shadows, and high-saturation flat accent tones.

---

## 1. Description & Purpose

Standard theme systems often apply generic color inversions that wash out dark mode contrast or introduce blurry drop-shadows. `ThemeEngine` enforces strict hardware-level AMOLED optimization:
- Background surfaces utilize pure `#000000` to maximize OLED pixel shutoff and battery efficiency.
- Dynamic accent colors are propagated instantly across all tiles, badges, progress bars, active tabs, and focus outlines using CSS custom properties (`--accent`, `--accent-rgb`).
- Custom wallpapers feature automated contrast overlays (65% black in dark mode, 85% white in light mode) guaranteeing WCAG AAA text legibility against any user-uploaded image.
- Includes an interactive HTML5 Canvas HSV Color Wheel for arbitrary accent selection alongside 16 authentic Metro v4 swatches.
- Provides a Zune HD frosted glass top navigation blur layer (`.top-blur-layer`) with user toggles.

---

## 2. LocalStorage Keys & CSS Tokens

### LocalStorage Schema
| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `theme_mode` | `string` | `'system'` | `'system'`, `'dark'`, or `'light'`. |
| `metro_theme` | `string` | `'#1ba1e2'` | Active hex accent color (default: Metro Cobalt `#1ba1e2`). |
| `metro_theme_name` | `string` | `'cobalt'` | Human-readable accent name. |
| `ui_style` | `string` | `'metro'` | Visual style: `'metro'` (zero-radius) or `'fluent'`. |
| `metro_wallpaper` | `string` | `''` | Base64 data URL of user-uploaded wallpaper. |
| `metro_wallpaper_name` | `string` | `'default'` | Display filename for wallpaper. |
| `metro_blur` | `string` | `'true'` | Flag for the Zune top navigation blur layer. |

### Core CSS Variable Architecture
```css
:root {
    --bg:               #000000;   /* Pure AMOLED black */
    --surface:          #111111;   /* Primary card and tile fill */
    --surface-hover:    #1a1a1a;   /* Subtle hover state */
    --text-main:        #ffffff;   /* Primary high-contrast text */
    --text-dim:         rgba(255, 255, 255, 0.4); /* Subtitles & unselected tabs */
    --hero-bg-text:     rgba(255, 255, 255, 0.04); /* Faint watermark text */
    --accent:           #1ba1e2;   /* Active accent color */
    --accent-rgb:       27, 161, 226; /* RGB components for alpha blending */
}

[data-theme="light"] {
    --bg:               #f2f2f2;
    --surface:          #ffffff;
    --surface-hover:    #e5e5e5;
    --text-main:        #000000;
    --text-dim:         rgba(0, 0, 0, 0.5);
    --hero-bg-text:     rgba(0, 0, 0, 0.04);
}
```

---

## 3. Function & Method Specifications

### `applyThemeMode(mode: 'system' | 'dark' | 'light'): void`
Applies the theme mode by setting the `data-theme` attribute on `document.documentElement` and recalculating wallpaper overlay blending.

- **Parameters**:
  - `mode` (`string`): The target mode.
- **Returns**: `void`
- **Behavior**:
  - If `'system'`, checks `window.matchMedia('(prefers-color-scheme: light)').matches` and sets `data-theme` to `'light'` or `'dark'`.
  - Removes ad-hoc inline styles.
  - Calls `applyWallpaper()` to synchronize contrast filters.
  - Updates the select dropdown `#theme-select`.

```javascript
applyThemeMode('dark');
```

---

### `setThemeMode(mode: 'system' | 'dark' | 'light'): void`
Persists the theme mode choice and applies it immediately.

- **Parameters**:
  - `mode` (`string`): Target mode.
- **Returns**: `void`
- **Behavior**: Writes to `localStorage.setItem('theme_mode', mode)`, calls `applyThemeMode(mode)`, and updates settings subheaders.

```javascript
setThemeMode('system');
```

---

### `setAccentColor(color: string, name?: string): void`
Updates the primary accent color across all UI components.

- **Parameters**:
  - `color` (`string`): Hex color code (e.g., `'#e81123'`).
  - `name` (`string`, optional): Name of the swatch (e.g., `'crimson'`).
- **Returns**: `void`
- **DOM Updates**:
  - Sets CSS variable: `document.documentElement.style.setProperty('--accent', color)`.
  - Sets RGB variable: `document.documentElement.style.setProperty('--accent-rgb', hexToRgb(color))`.
  - Saves to `localStorage.setItem('metro_theme', color)`.
  - Updates the settings preview swatch `#color-preview-box` and hex label `#color-hex-display`.
  - Dispatches `showToast('accent updated')`.

```javascript
setAccentColor('#60a917', 'green');
```

---

### `initColorWheel(): void`
Initializes an interactive HTML5 `<canvas>` HSV chromatic wheel with continuous angle-to-hue mapping.

- **Returns**: `void`
- **Algorithm**:
  - Renders a 2D radial gradient from center to perimeter:
    $$\theta = \text{atan2}(y - c_y, x - c_x), \quad r = \sqrt{(x - c_x)^2 + (y - c_y)^2}$$
  - Binds `mousedown`, `mousemove`, and `mouseup` (and touch equivalents) on the canvas.
  - Extracts pixel color via `canvasContext.getImageData(x, y, 1, 1).data`.
  - Formats into hex and delegates to `setAccentColor()`.

---

### `handleWallpaperUpload(e: Event): void`
Processes user image uploads via `<input type="file">` for custom backgrounds.

- **Parameters**:
  - `e` (`Event`): DOM file change event.
- **Returns**: `void`
- **Validation**:
  - Verifies file existence and validates `file.size <= 5 * 1024 * 1024` (5MB ceiling to prevent `localStorage` quota overflow).
  - Uses `FileReader.readAsDataURL()` to encode the image.
  - Stores data URL in `localStorage.setItem('metro_wallpaper', dataUrl)`.
  - Invokes `applyWallpaper()` and displays confirmation toast.

```javascript
document.getElementById('wallpaper-input').addEventListener('change', handleWallpaperUpload);
```

---

### `applyWallpaper(): void`
Binds the active wallpaper image to the body with dynamically calibrated contrast overlays.

- **Returns**: `void`
- **Contrast Logic**:
  - **Dark Mode**: Sets background overlay to `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url(...)`.
  - **Light Mode**: Sets background overlay to `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(...)`.
  - Ensures text remains sharp and readable regardless of background image brightness.

---

### `resetWallpaper(): void`
Clears the custom wallpaper and restores the pure AMOLED black background.

- **Returns**: `void`
- **Behavior**: Clears `localStorage` keys, removes background image styles, and resets settings preview.

---

### `setUIStyle(style: 'metro' | 'fluent'): void`
Toggles between the canonical zero-radius Metro UI v4 aesthetic and modern Fluent style.

- **Parameters**:
  - `style` (`string`): `'metro'` or `'fluent'`.
- **Behavior**:
  - Saves choice to `localStorage.setItem('ui_style', style)`.
  - In `'fluent'` mode, sets `data-ui="fluent"` on `<html>`, enabling soft rounded corners (`border-radius: 4px`) and subtle depth.
  - In `'metro'` mode, removes `data-ui`, activating strict zero-radius and zero-shadow overrides.

---

## 4. Architectural & Design Choices

1. **CSS Custom Property Cascade**:
   Every visual component references `--accent` and `--bg`. Modifying a single variable in JavaScript updates millions of rendered pixels without causing layout reflows or requiring DOM recreation.
2. **Safe LocalStorage Wallpaper Ceiling**:
   Browsers typically cap `localStorage` at 5MB–10MB per origin. `handleWallpaperUpload()` checks file size before invoking `FileReader`, preventing storage quota exceptions.
3. **Dual Contrast Overlay**:
   Unfiltered wallpapers frequently cause illegible text. Applying a semi-opaque 65% black overlay in dark mode and 85% white overlay in light mode guarantees that white/black typography maintains contrast compliance across all sections.
