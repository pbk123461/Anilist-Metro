# Class: LibraryManager

The `LibraryManager` module handles the user's personal anime and manga collection tracking in AniList Metro. It provides structured in-memory collection caching, multi-criteria filtering, real-time live search, quick +1 progress incrementation with automatic completion detection, inline rating adjustments, multi-select bulk operations, and full JSON library backup exports.

---

## 1. Description & Purpose

Tracking personal viewing and reading progress is the core functionality of AniList. `LibraryManager` delivers:
- Efficient single-query retrieval of the user's entire library across standard and custom lists via `MediaListCollection`.
- Immediate client-side filtering by status (`CURRENT`, `PLANNING`, `COMPLETED`, `DROPPED`, `PAUSED`, `REPEATING`) without triggering redundant network requests.
- Instant, debounced live text search across titles, synonyms, and genres within the user's collection.
- Quick +1 episode/chapter increments directly from list items, automatically setting status to `COMPLETED` and stamping completion dates when the final episode/chapter is watched.
- A bulk management mode allowing batch status adjustments and deletions.
- One-click JSON data export for offline backups and migration.

---

## 2. Properties & State Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `allListsData` | `Record<string, any>` | `{ ANIME: {}, MANGA: {} }` | In-memory cache holding structured lists returned by AniList. |
| `currentMediaType` | `'ANIME' \| 'MANGA'` | `'ANIME'` | Active library medium. |
| `currentLibStatus` | `string` | `'CURRENT'` | Active list filter (`'CURRENT'`, `'PLANNING'`, `'COMPLETED'`, etc.). |
| `currentLibraryPage` | `number` | `1` | Pagination page index for rendered library views. |
| `libraryItemsPerPage` | `number` | `50` | Maximum items displayed per page. |
| `libraryLoaded` | `Record<string, boolean>` | `{ ANIME: false, MANGA: false }` | Flags indicating whether collection queries have resolved. |

---

## 3. Function & Method Specifications

### `loadLibrary(mediaType: 'ANIME' | 'MANGA'): Promise<void>`
Queries AniList for the user's full anime or manga collection and populates the in-memory cache.

- **Parameters**:
  - `mediaType` (`'ANIME' | 'MANGA'`): The media collection to load.
- **Returns**: `Promise<void>`
- **GraphQL Query**:
  ```graphql
  query ($userId: Int, $type: MediaType) {
    MediaListCollection(userId: $userId, type: $type) {
      lists {
        name
        isCustomList
        status
        entries {
          id
          mediaId
          status
          score
          progress
          progressVolumes
          repeat
          private
          notes
          startedAt { year month day }
          completedAt { year month day }
          media {
            id
            type
            episodes
            chapters
            volumes
            format
            averageScore
            title { english romaji native }
            coverImage { large extraLarge }
            genres
          }
        }
      }
    }
  }
  ```
- **Behavior**:
  - Validates authentication (returns early in Guest Mode).
  - Stores collection in `allListsData[mediaType]`.
  - Sets `libraryLoaded[mediaType] = true`.
  - Triggers `renderLibrary(1)`.

```javascript
await loadLibrary('ANIME');
```

---

### `renderLibrary(page?: number): void`
Renders the filtered and sorted list of media entries into `#library-grid` as interactive Metro flip-tiles.

- **Parameters**:
  - `page` (`number`, optional): The page number to render (defaults to `1`).
- **DOM Rendering**:
  - Filters entries matching `currentLibStatus`.
  - Generates HTML for each entry via `createFlipTile()`.
  - Attaches quick action controls:
    - Quick increment button (`+1`).
    - Direct click to open Media Editor (`openMediaEditor()`).
    - Detail charm trigger (`openDetailById()`).
  - Renders pagination controls if total entries exceed `libraryItemsPerPage`.

---

### `switchMediaType(type: 'ANIME' | 'MANGA'): void`
Toggles between the Anime and Manga collections.

- **Parameters**:
  - `type` (`'ANIME' | 'MANGA'`): Target media type.
- **Returns**: `void`
- **Behavior**:
  - Sets `currentMediaType = type`.
  - Toggles active class on pivot headers `#lib-tab-anime` and `#lib-tab-manga`.
  - Triggers `loadLibrary(type)` if not yet loaded, otherwise calls `renderLibrary(1)`.
  - Dispatches `Sfx.play('select')`.

---

### `setLibraryView(status: string): void`
Filters the library by entry status.

- **Parameters**:
  - `status` (`string`): Target status (`'CURRENT'`, `'PLANNING'`, `'COMPLETED'`, `'DROPPED'`, `'PAUSED'`, or `'REPEATING'`).
- **Returns**: `void`
- **Behavior**: Updates `currentLibStatus`, updates tab styles, and re-renders the grid at page 1.

---

### `filterLibrarySearch(query: string): void`
Filters entries in the active list in real-time as the user types into the library search box.

- **Parameters**:
  - `query` (`string`): Search term.
- **Behavior**: Matches case-insensitively against `title.romaji`, `title.english`, and `title.native`.

---

### `incrementLibraryProgress(mediaId: number, type: string, currentProgress: number, maxEpisodes: number | null): Promise<void>`
Quickly increments the watched episodes or read chapters by 1 directly from the UI tile.

- **Parameters**:
  - `mediaId` (`number`): The AniList media ID.
  - `type` (`string`): `'ANIME'` or `'MANGA'`.
  - `currentProgress` (`number`): Active progress count.
  - `maxEpisodes` (`number | null`): Total episodes/chapters if known.
- **Auto-Completion Logic**:
  - New progress: `newProgress = currentProgress + 1`.
  - If `maxEpisodes` is defined and `newProgress >= maxEpisodes`:
    - Auto-sets `status = 'COMPLETED'`.
    - Auto-sets `completedAt` to today's date (`getTodayFuzzyDate()`).
    - Displays celebration toast: `"completed! congratulations."`
  - Dispatches GraphQL mutation `SaveMediaListEntry`.
  - Optimistically updates local `allListsData` and re-renders the tile without a full reload.

```javascript
await incrementLibraryProgress(16498, 'ANIME', 11, 12);
```

---

### `exportLibrary(): void`
Exports the user's complete anime and manga collection to a clean, timestamped JSON backup file.

- **Returns**: `void`
- **Behavior**:
  - Serializes `allListsData` with metadata (username, export date).
  - Creates a temporary `Blob` of type `application/json`.
  - Triggers a browser file download named `anilist_metro_backup_<date>.json`.

```javascript
exportLibrary();
```

---

### `toggleBulkMode(): void` & `applyBulkAction(action: string, value: any): Promise<void>`
Enables multi-selection mode across library tiles. Users can check multiple series and apply batch status updates (e.g., move 10 series to Completed) or batch removals with a single confirmation.

---

## 4. Architectural & Design Choices

1. **Client-Side Collection Caching**:
   Rather than querying the API whenever the user switches between "Watching", "Planning", and "Completed", `LibraryManager` loads the user's entire collection once upon login. All status switching and live searching operate entirely in-memory at 60 FPS.
2. **Optimistic UI Updates for Quick Increment**:
   When the user taps `+1`, the UI counter increments instantly while the GraphQL mutation executes in the background. If the request fails, the tile safely rolls back with a toast alert.
3. **Smart Date Stamping**:
   Users frequently forget to manually set finish dates when completing an anime. Automatically stamping `completedAt` when progress reaches total episodes saves repetitive manual data entry.
