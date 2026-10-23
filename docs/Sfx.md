# Class: Sfx (AudioEngine)

The `Sfx` class (implemented as a singleton audio controller) manages the procedural sound effects engine for AniList Metro. Designed around the Windows Phone 7, Xbox 360 Metro dashboard, and Zune HD tactile feedback experience, it utilizes the native **Web Audio API (`AudioContext`)** to deliver zero-latency, pitch-randomized, non-fatiguing auditory cues for all user interface interactions.

---

## 1. Description & Purpose

In standard web applications, UI audio is often implemented using HTML5 `<audio>` elements (`new Audio()`). In rapid-navigation environments like horizontal panoramas and grid browsing, this causes severe browser thread blocking, audible crackling, overlapping playback cutoffs, and memory leaks.

`Sfx` solves these limitations by:
- Creating a shared, persistent `AudioContext` hardware pipeline.
- Pre-fetching and decoding `.wav` audio files into uncompressed, in-memory `AudioBuffer` objects.
- Spawning lightweight, garbage-collected `AudioBufferSourceNode` instances on-demand with linear `GainNode` volume attenuation.
- Applying real-time subtle pitch modulation to prevent acoustic fatigue.
- Enforcing hardware-level event throttling to eliminate stutter during rapid hover and mouse drag operations.

---

## 2. Properties & State

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | `true` | Audio state flag synchronized with `localStorage.getItem('metro_sfx')`. |
| `currentPack` | `string` | `'classic'` | Active sound pack identifier (`'classic'`, `'soft'`, or `'minimal'`). |
| `ctx` | `AudioContext \| null` | `null` | Primary hardware audio rendering context. |
| `buffers` | `Record<string, AudioBuffer>` | `{}` | Key-value store of decoded, ready-to-play audio buffers. |
| `lastPlay` | `Record<string, number>` | `{}` | High-resolution timestamps used for debouncing rapid triggers. |
| `lastHoverTarget` | `Element \| null` | `null` | Tracks the currently hovered DOM element to avoid duplicate sound triggers. |
| `sounds` | `Record<string, string>` (getter) | `SFX_PACKS.classic` | Dynamic getter resolving file paths for the active sound pack. |

### Sound Packs (`SFX_PACKS`)
The audio engine includes three curated acoustic profiles stored in `xbox360 metro soundeffects/`:
- **`classic`**: Authentic Xbox 360 Dashboard acoustics (`Select.wav`, `Back.wav`, `SelectB.wav`, `PageRight.wav`).
- **`soft`**: Subdued, low-frequency clicks ideal for prolonged evening sessions.
- **`minimal`**: Crisp, subtle blips for distraction-free navigation.

---

## 3. Method Specifications

### `init(): Promise<void>`
Initializes the `AudioContext` and triggers asynchronous decoding of all sound files in the active sound pack.

- **Returns**: `Promise<void>`
- **Behavior**:
  - Checks if `this.ctx` exists. If suspended due to browser autoplay policies, resumes it upon user gesture.
  - Instantiates `window.AudioContext || window.webkitAudioContext`.
  - Invokes internal buffer loader `_loadBuffers()`.

```javascript
await Sfx.init();
```

---

### `_loadBuffers(): Promise<void>`
Fetches binary `.wav` files via `fetch()` and decodes them via `AudioContext.decodeAudioData()`.

- **Returns**: `Promise<void>`
- **Behavior**:
  - Resets `this.buffers = {}`.
  - Iterates over the key-value pairs of `this.sounds` (`select`, `back`, `hover`, `pan`).
  - Downloads the array buffer and transforms it into an uncompressed `AudioBuffer`.
  - Silently logs warnings if individual assets fail to load, preserving app functionality.

---

### `switchPack(packName: string): Promise<void>`
Switches the active sound profile dynamically, persists the choice, and updates in-memory audio buffers.

- **Parameters**:
  - `packName` (`string`): The sound pack name (`'classic'`, `'soft'`, or `'minimal'`).
- **Returns**: `Promise<void>`
- **Behavior**:
  - Validates `packName` against `SFX_PACKS`.
  - Updates `this.currentPack` and writes to `localStorage.setItem('metro_sfx_pack', packName)`.
  - Re-decodes audio buffers for the new pack if context is active.
  - Displays a Metro toast confirmation and plays a sample `'select'` tone.

```javascript
await Sfx.switchPack('soft');
```

---

### `play(type: 'select' | 'back' | 'hover' | 'pan'): Promise<void>`
Triggers zero-latency playback of a specific UI sound cue with pitch variation and gain attenuation.

- **Parameters**:
  - `type` (`string`): Interaction type (`'select'`, `'back'`, `'hover'`, or `'pan'`).
- **Returns**: `Promise<void>`
- **Behavior**:
  - Immediately exits if `this.enabled === false`.
  - Checks throttle timestamps: throttles `'hover'` calls within 80ms and other cues within 50ms.
  - Auto-initializes `AudioContext` if not yet constructed.
  - Creates an `AudioBufferSourceNode` linked to `this.buffers[type]`.
  - Connects a calibrated `GainNode`:
    - `hover`: `0.04` (4% gain)
    - `pan`: `0.08` (8% gain)
    - `select`: `0.12` (12% gain)
    - `back`: `0.12` (12% gain)
  - Applies random pitch shifting for natural sound:
    $$\text{playbackRate} = 0.96 + (\text{random}() \times 0.08) \quad [0.96 - 1.04]$$
  - Dispatches `source.start(0)`.

```javascript
// Play tactile select click
Sfx.play('select');

// Play back navigation tone
Sfx.play('back');
```

---

### `toggle(enabled: boolean): void`
Enables or disables sound playback system-wide and saves the state to `localStorage`.

- **Parameters**:
  - `enabled` (`boolean`): True to enable SFX, false to mute.
- **Returns**: `void`
- **Behavior**:
  - Sets `this.enabled = enabled`.
  - Persists preference in `localStorage.setItem('metro_sfx', enabled ? 'true' : 'false')`.
  - Displays a toast alert: `"ui sounds enabled"` or `"ui sounds disabled"`.
  - Plays a tactile confirmation tone if enabling.

```javascript
Sfx.toggle(false); // Mutes the audio engine
```

---

## 4. Usage Examples

### Manual Triggering in Component Event Handlers
```javascript
// Navigating between subviews or pivot tabs
function onPivotTabClick(tabIndex) {
    switchActiveTab(tabIndex);
    Sfx.play('select');
}

// Closing a right-sliding charm panel
function closeCharmPanel() {
    document.getElementById('detail-charm').classList.remove('open');
    Sfx.play('back');
}
```

### Global Capture-Phase Event Binding
The engine automatically attaches global event delegation listeners during `DOMContentLoaded` to handle clicks and hovers across all Metro buttons, tiles, switches, and chips:

```javascript
// Capture-phase click listener ensuring sound triggers even if children stop propagation
document.body.addEventListener('click', e => {
    const target = e.target.closest('button, .btn-back, .tile, .metro-btn, .nav-item');
    if (!target) return;

    if (target.matches('.btn-back, .btn-back-text, .detail-close')) {
        Sfx.play('back');
    } else {
        Sfx.play('select');
    }
}, true);
```

---

## 5. Architectural & Design Choices

1. **Web Audio API vs. Audio Element**:
   The native HTML `<audio>` tag introduces noticeable 50–150ms latency on user clicks. By using `AudioContext` and pre-decoded `AudioBuffer` objects, latency drops below 5ms, matching the native responsiveness of Xbox 360 and Windows Phone OS.
2. **Strict Gain Calibration (4%–12%)**:
   Many web apps play loud, intrusive 100% gain beeps. `Sfx` limits gain between 0.04 and 0.12, ensuring that rapid browsing through hundreds of anime tiles does not cause headphone fatigue.
3. **Organic Pitch Randomization**:
   Repeating the exact same audio frequency dozens of times per minute creates mechanical fatigue. Randomizing the `playbackRate` by $\pm 4\%$ gives each click an organic, physical feel.
4. **Resilience to Browser Autoplay Restrictions**:
   Modern browsers block audio contexts from playing until the user interacts with the document. `Sfx.init()` automatically detects suspended contexts and resumes them cleanly on the first user interaction.
