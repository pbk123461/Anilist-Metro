# Class: PanoramaEngine

The `PanoramaEngine` module drives the core horizontal panoramic interface of AniList Metro, recreating the iconic **Windows Phone 7 / Zune HD Panorama & Pivot** experience. It orchestrates mouse drag gestures, horizontal inertia, trackpad wheel normalization, throttled keyboard navigation, multi-layer parallax background text translation, and continuous navigation bar synchronization.

---

## 1. Description & Purpose

Traditional web applications rely on vertical scrolling pages with static sticky headers. Metro UI, in contrast, treats the viewport as an expansive, horizontally continuous canvas divided into thematic sections (`start`, `user`, `library`, `community`, `discover`, `airing`, `inbox`, `system`).

`PanoramaEngine` manages this paradigm by:
- Enforcing smooth, hardware-accelerated horizontal scrolling using CSS Scroll Snap (`scroll-snap-type: x mandatory`).
- Implementing desktop mouse drag-to-scroll physics that ignore clicks on interactive child elements (buttons, inputs, links, tiles).
- Normalizing vertical mousewheel scroll inputs to smooth horizontal panning.
- Applying a parallax transform to the giant background watermark typography (`dynamic-header`).
- Synchronizing the top navigation strip (`#main-nav`) and mobile bottom navigation with the active section index.
- Throttling keyboard navigation to prevent rapid scrolling desynchronization.

---

## 2. Properties & State Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `container` | `HTMLElement` | `#app-container` | Main horizontal flex container (`100vw`, `100vh`, `overflow-x: auto`). |
| `bgHero` | `HTMLElement` | `#dynamic-header` | Fixed background hero text element (`anilist metro`). |
| `topNav` | `HTMLElement` | `#main-nav` | Top horizontal navigation container. |
| `navItems` | `NodeListOf<Element>` | `.nav-item` | Section title buttons inside top navigation. |
| `activeNavIndex` | `number` | `-1` | Zero-based index of the currently visible section (0 to 7). |
| `isDown` | `boolean` | `false` | Internal state tracking mouse button press for drag interactions. |
| `startX` | `number` | `0` | Starting X-coordinate of a drag gesture. |
| `scrollLeft` | `number` | `0` | Initial container scroll offset at gesture initiation. |
| `lastArrowPress` | `number` | `0` | Timestamp of the most recent arrow key navigation event. |
| `ARROW_THROTTLE_MS` | `number` | `300` | Minimum interval (in ms) enforced between keyboard navigation triggers. |

---

## 3. Function & Method Specifications

### `getSectionWidth(): number`
Calculates the effective horizontal width of a panorama section.

- **Returns**: `number` — Container client width or window inner width.

```javascript
const sectionWidth = getSectionWidth();
```

---

### `scrollToSection(index: number): void`
Smoothly animates the panorama viewport to the specified zero-indexed section.

- **Parameters**:
  - `index` (`number`): Target section index (0: start, 1: user, 2: library, 3: community, 4: discover, 5: airing, 6: inbox, 7: system).
- **Returns**: `void`
- **Behavior**: Calls `container.scrollTo({ left: width * index, behavior: 'smooth' })`.

```javascript
// Navigate to the Discover section (index 4)
scrollToSection(4);
```

---

### `scrollToSectionMobile(index: number): void`
Executes section navigation specifically tailored for mobile viewports, updating bottom navigation button states.

- **Parameters**:
  - `index` (`number`): Target section index.
- **Returns**: `void`
- **Behavior**: Calls `scrollToSection(index)` and immediately updates `#mobile-bottom-nav` button active classes.

```javascript
scrollToSectionMobile(2); // Jump to library on mobile
```

---

### `scrollPanorama(dir: number): void`
Scrolls the panorama relatively by one full section width in either direction.

- **Parameters**:
  - `dir` (`number`): Direction vector (`1` for right, `-1` for left).
- **Returns**: `void`
- **Behavior**: Calls `container.scrollBy({ left: dir * w, behavior: 'smooth' })`.

```javascript
// Click handler for desktop right-arrow
scrollPanorama(1);
```

---

### `updateMobileBottomNav(index: number): void`
Synchronizes the active indicator on mobile bottom navigation tabs.

- **Parameters**:
  - `index` (`number`): Active section index.
- **Returns**: `void`

---

## 4. Event Binding Architecture

### 1. Mouse Drag Gestures
```javascript
const interactiveElements = 'button, a, i, input, select, .status-btn, .tile, .filter-chip, ...';

container.addEventListener('mousedown', (e) => {
    // Ignore drag initiation if clicking interactive widgets
    if (e.target.closest(interactiveElements)) return;
    isDown = true;
    container.style.cursor = 'grabbing';
    container.style.scrollSnapType = 'none'; // Disable snap during active drag
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
});

container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    // 1.5x amplification for snappy drag response
    container.scrollLeft = scrollLeft - (e.pageX - container.offsetLeft - startX) * 1.5;
});

container.addEventListener('mouseup', () => {
    isDown = false;
    container.style.cursor = '';
    container.style.scrollSnapType = 'x mandatory'; // Restore snap
});
```

### 2. Parallax and Navigation Sync on Scroll
```javascript
container.addEventListener('scroll', () => {
    const width = getSectionWidth();
    const scrollRatio = container.scrollLeft / width;

    // Background watermark text translates at 30% of scroll speed (Parallax effect)
    if (bgHero) bgHero.style.transform = `translateX(-${container.scrollLeft * 0.3}px)`;

    const idx = Math.round(scrollRatio);
    if (activeNavIndex !== idx) {
        if (activeNavIndex !== -1 && typeof Sfx !== 'undefined') Sfx.play('pan');
        activeNavIndex = idx;
        navItems.forEach((n, i) => n.classList.toggle('active', i === idx));
        updateMobileBottomNav(idx);

        // Slide the top navigation track so active title is prominently positioned
        if (navItems[idx]) {
            const offset = navItems[idx].offsetLeft;
            topNav.style.transform = `translateX(-${offset}px)`;
        }
    }
});
```

### 3. Throttled Keyboard Navigation
```javascript
document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
    if (e.key === 'Escape') { closeDetail(); return; }

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const now = Date.now();
        if (lastArrowPress && now - lastArrowPress < ARROW_THROTTLE_MS) return;
        lastArrowPress = now;

        const w = container ? container.clientWidth : window.innerWidth;
        if (e.key === 'ArrowRight') container.scrollBy({ left: w, behavior: 'smooth' });
        if (e.key === 'ArrowLeft') container.scrollBy({ left: -w, behavior: 'smooth' });
    }
});
```

---

## 5. Architectural & Design Choices

1. **Snap Suspension During Drag**:
   Native CSS scroll snapping (`scroll-snap-type: x mandatory`) resists continuous mouse drag motions. `PanoramaEngine` dynamically toggles snapping to `none` on `mousedown` and restores it on `mouseup`, providing smooth panning while ensuring crisp landing alignments.
2. **Exclusion of Interactive Targets**:
   If mousedown listeners attach naively to the container, clicking buttons, tiles, or inputs would trigger accidental drag captures. Using `e.target.closest(interactiveElements)` ensures clickable elements retain native responsiveness.
3. **Multi-Speed Parallax Depth**:
   By translating `#dynamic-header` at 30% velocity relative to the container scroll position, the interface achieves a genuine sense of physical depth without 3D perspective distortion or drop shadows.
4. **Keyboard Throttle Buffer**:
   Holding down arrow keys can cause rapid scroll trigger queues that destabilize the browser compositor. A strict 300ms throttle ensures smooth section-by-section transitions.
