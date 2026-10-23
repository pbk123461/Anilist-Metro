# Class: MediaEditor

The `MediaEditor` module manages the full CRUD (Create, Read, Update, Delete) modal charm panel for personal anime and manga tracking entries. Styled as a right-sliding full-screen Metro subview, it allows users to adjust list status, numeric ratings, episode/chapter progress, repeat counts, start and completion dates, personal notes, and privacy flags.

---

## 1. Description & Purpose

Managing media entries on AniList involves updating several interdependent data fields (e.g., changing status to "Completed" should populate completion dates and match total episode counts). `MediaEditor` provides:
- A right-sliding Metro charm panel (`#media-editor-overlay`) that isolates the editor view without disorienting the user.
- Pre-population of existing user list data via GraphQL query `Media(id: $id) { mediaListEntry { ... } }`.
- Integrated input fields strictly styled to Metro UI v4 standards (zero border-radius, pure white background on focus, solid accent borders).
- Automatic date calculation (`getAutoDatesForStatus()`) to automatically stamp start dates when moving to "Watching/Reading" and completion dates when moving to "Completed".
- Automated status progression: moving progress to total episodes automatically converts status to `COMPLETED`.
- Synchronous UI synchronization: updating or deleting an entry refreshes both the local library grid and any active Media Detail charm view.

---

## 2. Function & Method Specifications

### `openMediaEditor(mediaId: number, type: 'ANIME' | 'MANGA'): Promise<void>`
Opens the right-sliding editor charm, temporarily hides the top navigation chrome, and queries AniList for current entry state.

- **Parameters**:
  - `mediaId` (`number`): The target anime/manga ID.
  - `type` (`'ANIME' | 'MANGA'`): The media format type.
- **Returns**: `Promise<void>`
- **Workflow**:
  1. Hides `#main-nav` and `#top-right-nav` via CSS class `.ui-hidden`.
  2. Displays loading spinner inside `#media-editor-overlay`.
  3. Queries AniList:
     ```graphql
     query ($id: Int) {
       Media(id: $id) {
         id
         title { english romaji }
         coverImage { large }
         episodes
         chapters
         mediaListEntry {
           id
           status
           score
           progress
           startedAt { year month day }
           completedAt { year month day }
           notes
           repeat
           private
         }
       }
     }
     ```
  4. Generates form markup with pre-filled inputs:
     - Status `<select>` (`CURRENT`, `PLANNING`, `COMPLETED`, `PAUSED`, `DROPPED`, `REPEATING`).
     - Numeric score input (0.0 to 10.0 scale, step 0.5).
     - Progress counter (capped at total episodes/chapters).
     - Repeat count.
     - Start and completion dates (formatted as `YYYY-MM-DD`).
     - Personal notes `<textarea>`.
     - Private checkbox.
     - Delete entry button (rendered only if existing entry ID is present).

```javascript
// Open editor for media ID 16498
openMediaEditor(16498, 'ANIME');
```

---

### `closeMediaEditor(): void`
Dismisses the editor overlay and restores the top navigation chrome.

- **Returns**: `void`
- **Behavior**:
  - Removes `.open` from `#media-editor-overlay`.
  - Removes `.ui-hidden` from `#main-nav` and `#top-right-nav`.
  - Dispatches `Sfx.play('back')`.

```javascript
closeMediaEditor();
```

---

### `saveMediaEntry(event: Event, mediaId: number, type: 'ANIME' | 'MANGA'): Promise<void>`
Extracts form values, validates inputs, formats fuzzy dates, evaluates automatic completions, and dispatches the GraphQL mutation.

- **Parameters**:
  - `event` (`Event`): Form submission event.
  - `mediaId` (`number`): Target media identifier.
  - `type` (`'ANIME' | 'MANGA'`): Media type.
- **Returns**: `Promise<void>`
- **Data Normalization & Logic**:
  - Parses date strings (`YYYY-MM-DD`) into AniList `FuzzyDateInput` format `{ year, month, day }`.
  - Automatically converts status to `COMPLETED` if `progress >= totalEpisodes`.
  - Merges auto-generated dates via `getAutoDatesForStatus(status, entry)`.
  - Dispatches mutation:
    ```graphql
    mutation ($mediaId: Int, $status: MediaListStatus, $score: Float, $progress: Int, $repeat: Int, $notes: String, $private: Boolean, $startedAt: FuzzyDateInput, $completedAt: FuzzyDateInput) {
      SaveMediaListEntry(mediaId: $mediaId, status: $status, score: $score, progress: $progress, repeat: $repeat, notes: $notes, private: $private, startedAt: $startedAt, completedAt: $completedAt) {
        id
        status
        score
        progress
        repeat
        notes
        private
      }
    }
    ```
  - Displays confirmation toast (`showToast('entry updated')`).
  - Calls `closeMediaEditor()`.
  - Re-executes `loadLibrary(type)` to refresh the list grid.
  - Re-renders active media detail charm view (`openDetailById(mediaId, type)`) to maintain synchronized data.

---

### `deleteMediaEntry(entryId: number, mediaId: number, type: 'ANIME' | 'MANGA'): Promise<void>`
Prompts for user confirmation and permanently removes the media item from the user's AniList collection.

- **Parameters**:
  - `entryId` (`number`): The unique list entry ID.
  - `mediaId` (`number`): The AniList media ID.
  - `type` (`'ANIME' | 'MANGA'`): Media type.
- **Returns**: `Promise<void>`
- **Mutation**:
  ```graphql
  mutation ($id: Int) {
    DeleteMediaListEntry(id: $id) {
      deleted
    }
  }
  ```
- **Behavior**:
  - Displays browser confirmation dialog: `"delete this list entry?"`.
  - Executes mutation, closes editor, displays confirmation toast, and refreshes both library and media detail views.

```javascript
await deleteMediaEntry(1234567, 16498, 'ANIME');
```

---

## 3. Usage Examples

### Triggering the Editor from a Media Detail Charm
```javascript
// Detail panel edit button
const editBtn = document.createElement('button');
editBtn.className = 'button primary';
editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> edit list entry';
editBtn.onclick = () => openMediaEditor(activeMedia.id, activeMedia.type);
```

### Auto-Completion Date Helper
```javascript
function getAutoDatesForStatus(status, existingEntry) {
    const today = getTodayFuzzyDate();
    const dates = {};
    if (status === 'CURRENT' && (!existingEntry || !existingEntry.startedAt)) {
        dates.startedAt = today;
    }
    if (status === 'COMPLETED' && (!existingEntry || !existingEntry.completedAt)) {
        dates.completedAt = today;
    }
    return dates;
}
```

---

## 4. Architectural & Design Choices

1. **Slide-Out Charm vs. Centered Modal**:
   In strict accordance with the Metro Design Bible, centered modal popups with blurred backdrop dimming are strictly forbidden. `MediaEditor` slides out from the right viewport edge (`left: 100vw` to `left: 0`) as a flat, full-height Charm panel.
2. **Dual-View State Synchronization**:
   Saving an entry must update all places where that media appears. `MediaEditor` automatically triggers updates on both the main library collection view and any open media detail panel without requiring a browser page refresh.
3. **Fuzzy Date Formatting**:
   AniList represents dates as `{ year: Int, month: Int, day: Int }` rather than Unix timestamps. `MediaEditor` cleanly translates standard ISO HTML5 date inputs into GraphQL fuzzy date structures.
