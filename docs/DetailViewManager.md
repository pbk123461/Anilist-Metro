# Class: DetailViewManager (CharmManager)

The `DetailViewManager` module coordinates all right-sliding Charm panels and specialized subviews in AniList Metro. It provides rich, deep-dive detail presentations for Anime, Manga, Characters, Staff, Studios, Reviews, and Video Trailers without ever navigating away from the current panoramic position.

---

## 1. Description & Purpose

In traditional web applications, clicking on an item navigates to a new page URL, breaking the user's scroll position and navigation context. AniList Metro adheres strictly to the **Metro Charm Panel pattern**:
- All detail views slide smoothly from the right viewport edge (`left: 100vw` to `left: 0`) over an unblurred dark overlay (`rgba(0,0,0,0.6)`).
- Pressing `Escape` or clicking the top-left back button slides the charm away (`left: 100vw`), instantly restoring the user to the exact panorama tile they clicked.
- Provides deep multi-dimensional data:
  - **Media Detail Charm**: Banner imagery, multilingual titles, synopsis with spoiler reveal, relations tree, characters and voice actors, staff, score distributions, streaming links, and list editor buttons.
  - **Character Detail Charm**: High-resolution portraits, bios, media appearances, and voice actor associations.
  - **Staff Detail Charm**: Full career filmography, voice acting roles, and biography.
  - **Studio Detail Charm**: Company catalog, anime productions sorted by popularity, and favorite counters.
  - **Review Charm**: Full community critiques with user scores.
  - **Video Subview Charm**: In-app YouTube trailer player with zero-latency audio playback.

---

## 2. Properties & State Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `currentMediaCache` | `any \| null` | `null` | In-memory cache of the active media item rendered inside the primary detail charm. |

---

## 3. Function & Method Specifications

### `openDetailById(id: number, type?: 'ANIME' | 'MANGA'): Promise<void>`
Queries AniList for detailed media metadata and animates the primary right-sliding charm into view.

- **Parameters**:
  - `id` (`number`): The AniList media ID.
  - `type` (`string`, optional): `'ANIME'` or `'MANGA'` (defaults to `'ANIME'`).
- **Returns**: `Promise<void>`
- **Workflow**:
  1. Hides top navigation chrome (`.ui-hidden`).
  2. Displays `#detail-panel` with `.active` class (`left: 0`).
  3. Dispatches audio feedback (`Sfx.play('select')`).
  4. Queries comprehensive media details via GraphQL:
     - Titles (English, Romaji, Native).
     - Banner and ExtraLarge cover image.
     - Formats, episodes/chapters, durations, broadcast season.
     - Interactive synopsis with spoiler filtering.
     - Score distribution breakdown.
     - Relations (sequels, prequels, spin-offs).
     - Characters and primary voice actors.
     - Streaming episodes and external platform links.
     - Current viewer list status and quick edit trigger.
  5. Caches payload in `currentMediaCache = data.Media`.

```javascript
// Open detailed view for Cowboy Bebop
await openDetailById(1, 'ANIME');
```

---

### `closeDetail(): void`
Dismisses the active detail charm panel and restores the navigation chrome.

- **Returns**: `void`
- **Behavior**:
  - Removes `.active` from `#detail-panel`.
  - Removes `.ui-hidden` from `#main-nav` and `#top-right-nav`.
  - Dispatches `Sfx.play('back')`.

```javascript
closeDetail();
```

---

### `openCharacterDetail(id: number, name: string, desc: string, vaName?: string, vaId?: number): void`
Opens a dedicated charm panel presenting character portrait, biography, and voice actor credits.

- **Parameters**:
  - `id` (`number`): Character ID.
  - `name` (`string`): Character name.
  - `desc` (`string`): Character bio.
  - `vaName` (`string`, optional): Voice actor name.
  - `vaId` (`number`, optional): Voice actor ID.

---

### `openStaffDetail(staffId: number): Promise<void>`
Queries and displays a voice actor or production staff member's profile, including voiced roles and staff positions.

- **Parameters**:
  - `staffId` (`number`): The AniList staff ID.

---

### `openStudioDetail(studioId: number, studioName?: string): Promise<void>`
Opens a studio charm listing all anime produced by the studio sorted by popularity.

- **Parameters**:
  - `studioId` (`number`): Studio identifier.
  - `studioName` (`string`, optional): Studio name.

---

### `openGenreOverview(genre: string): void`
Opens a genre charm showing the highest-rated and most popular anime/manga within that category.

- **Parameters**:
  - `genre` (`string`): Genre name (e.g., `'Cyberpunk'`, `'Psychological'`).

---

### `openVideoSubview(url: string): void` & `closeVideoSubview(): void`
Manages the in-app embedded video player subview for official anime trailers.

- **Parameters**:
  - `url` (`string`): Embedded YouTube trailer URL.
- **Behavior**:
  - Injects `url` into `#video-iframe`.
  - Adds `.active` to `#video-subview`.
  - Plays audio cue (`Sfx.play('select')`).
  - Closing the subview blanks `iframe.src` to immediately halt video and audio playback.

```javascript
openVideoSubview('https://www.youtube.com/embed/qig4KMGWwSg');
```

---

### `showSubview(type: 'characters' | 'staff' | 'reviews' | 'info'): void`
Renders extended detail subviews for the active media item in `currentMediaCache`.

- **Parameters**:
  - `type` (`string`): Target subview identifier.
- **Subviews**:
  - `'characters'`: Full character gallery with voice actor pairings.
  - `'staff'`: Production crew and key animation staff.
  - `'reviews'`: Long-form community critiques with numeric ratings.
  - `'info'`: Technical specifications, score distributions, and streaming links.

---

## 4. Architectural & Design Choices

1. **Hardware-Accelerated Slide Transitions**:
   Panels translate along the X-axis using `transition: left 0.4s cubic-bezier(0.1, 0.9, 0.2, 1)`. This specific easing curve matches Windows Phone 7's fluid deceleration curve, giving panels a swift entrance and gradual stop.
2. **Context Preservation**:
   Because the main panorama is merely obscured rather than unloaded, closing a detail panel immediately reveals the user's previous horizontal scroll position without re-rendering or recalculating image layouts.
3. **Audio-Halting Video Dismissal**:
   Standard iframe modals often leave background audio playing after closure. `closeVideoSubview()` explicitly sets `iframe.src = ''`, guaranteeing immediate audio and video termination.
