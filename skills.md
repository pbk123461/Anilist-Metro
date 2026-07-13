# Skills: AniList Metro UI Development

This guide provides the necessary technical and design patterns for building and extending the UI of the AniList Metro Web App. Follow these rules strictly to maintain the Windows Phone 7 / Zune HD aesthetic.

## 1. The Prime Directive (Design Bible)

### Core Geometry & Visuals
- **Zero Rounded Corners**: Use `border-radius: 0 !important` everywhere.
- **Zero Shadows**: Use `box-shadow: none !important` everywhere.
- **Flat Design**: Use solid color contrast for depth. No gradients or borders unless they are transparent and transition to solid on focus/hover.
- **AMOLED Palette**:
    - Background: `#000000` (Pure Black)
    - Surface: `#111111` (Dark Grey for cards/inputs)
    - Surface Hover: `#1a1a1a`
    - Text Main: `#ffffff` (Pure White)
    - Text Dim: `rgba(255,255,255,0.4)`
    - Accent: `--accent` (High-saturation solid color)

### Typography
- **Font**: `'Segoe UI Light', 'Segoe UI Variable Display', 'Segoe UI', Tahoma, sans-serif`
- **Case**: **ALL UI text must be lowercase** (`text-transform: lowercase`).
- **Weights**:
    - Giant Hero Text: `font-weight: 100`
    - Page Titles (h1): `font-weight: 100`
    - Section Headers / Body: `font-weight: 300`
    - Labels: `font-weight: 400`

---

## 2. Layout Architecture

### Panorama System
The app is a horizontally scrolling panorama.
- **Container**: `width: 100vw; height: 100vh; overflow-x: auto; scroll-snap-type: x mandatory;`
- **Sections**: Each `.header-section` must be exactly `85vw` wide on desktop.
- **Navigation**: Sections are zero-indexed. Update `scrollToSection(N)` calls when adding/removing sections.

### Subviews (Modals)
No centered dialogs. Use full-screen panels sliding from the right:
```css
.metro-subview { 
    position: fixed; 
    inset: 0; 
    left: 100vw; 
    transition: left 0.4s cubic-bezier(0.1, 0.9, 0.2, 1); 
}
.metro-subview.open { left: 0; }
```

---

## 3. Component Implementation

### Metro UI v4 Components
The project uses a vendored Metro UI v4 library. Always use the correct `data-role` attributes:

| Component | Attribute | Key Elements / Notes |
| :--- | :--- | :--- |
| **Tiles** | `data-role="tile"` | Use `data-size` (small, medium, wide, large). Use `.icon` and `.branding-bar`. |
| **NavView** | `data-role="navview"` | Structure: `.navview-pane` $\rightarrow$ `.pull-button`, `.suggest-box`, `.navview-menu`. |
| **Streamer** | `data-role="streamer"` | Used for timelines. Requires `id` and `data-source`/`data-data`. |
| **Tabs** | `data-role="materialtabs"` | Use for mobile tab navigation. |
| **Dialogs** | `data-role="dialog"` | For alerts and confirmations. |

### Custom UI Elements
- **Buttons**: Solid flat `--surface` or `--accent`. Hover = `scale(0.95)` + brightness change.
- **Inputs**: `background: #111111; border: 2px solid transparent;` $\rightarrow$ focus: `border-color: var(--accent)`.
- **List Items**: Thumbnail (left, 50-70px) + info (right). Hover = `background: var(--surface-hover)`.

---

## 4. Motion & Animation

- **Standard Easing**: `cubic-bezier(0.1, 0.9, 0.2, 1)` (Fast start, smooth deceleration).
- **Durations**:
    - Micro-interactions (clicks): `0.2s`
    - Panel/Page transitions: `0.4s`
- **Tactile Feedback**: Every clickable element should use `transform: scale(0.95)` on click/active state.

## 5. Development Workflow

1. **Style Overrides**: If using a Metro UI component, ensure you apply the `metro-override.css` logic (AMOLED black backgrounds, zero radius) to prevent the framework's default grey/rounded styles from leaking.
2. **Single File**: All changes must be made within `index.html`.
3. **Vanilla Only**: No frameworks, no build steps. Use vanilla ES6+ and CSS3.
