# Class: AiringScheduleManager

The `AiringScheduleManager` module controls the Airing section of AniList Metro. It provides an interactive broadcast schedule calendar, daily and weekly timetable views, timezone-adjusted countdowns, and a vertical timeline streamer component showing exact episode numbers and release times.

---

## 1. Description & Purpose

Tracking upcoming anime broadcast dates across global timezones is notoriously difficult due to Japan Standard Time (JST) differences. `AiringScheduleManager` solves this by:
- Querying AniList's `AiringSchedule` GraphQL endpoint with precise Unix timestamp boundaries calculated in the client's local timezone.
- Providing a rapid calendar day picker strip allowing users to inspect what aired yesterday, what airs today, and what broadcasts later this week.
- Providing a **Week View** that compiles all releasing series across the next 7 days.
- Rendering a vertical timeline streamer (`data-role="streamer"`) featuring countdown timers (e.g., `airing in 2h 15m`), episode badges, and direct links to Media Detail charms.

---

## 2. Properties & State Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `airingView` | `'today' \| 'week'` | `'today'` | Active schedule view state. |
| `airingSelectedDate` | `Date` | `new Date()` | Currently selected calendar date object. |
| `navigationHistoryAiringSelectedDate` | `string` | Current date string | Formatted date key for caching calendar selections. |

---

## 3. Function & Method Specifications

### `initAiringCalendar(): void`
Initializes the calendar header labels, renders the current month grid, and selects the current day.

- **Returns**: `void`
- **Behavior**:
  - Calculates today's local date.
  - Formats date strings for display (e.g., `'thursday, may 28'`).
  - Calls `buildAiringCalendar()` to render the calendar day selector.
  - Invokes `loadAiringSchedule('today')`.

```javascript
initAiringCalendar();
```

---

### `buildAiringCalendar(year: number, month: number): void`
Constructs the interactive Metro calendar grid for a given year and month.

- **Parameters**:
  - `year` (`number`): Full year (e.g., 2026).
  - `month` (`number`): Zero-based month (0 to 11).
- **DOM Rendering**:
  - Computes the first day of the month and total days.
  - Generates flat square day cells (`.airing-cal-day`).
  - Highlights today's date and the currently selected date.
  - Attaches click listeners invoking `selectAiringDate(dateStr)`.

---

### `selectAiringDate(dateStr: string): void`
Updates the selected calendar date and re-queries the broadcast schedule for that 24-hour window.

- **Parameters**:
  - `dateStr` (`string`): Selected date in `'YYYY-MM-DD'` format.
- **Returns**: `void`
- **Behavior**:
  - Parses the date and updates `airingSelectedDate`.
  - Updates date labels `#airing-date-label` and `#airing-selected-day-title`.
  - Re-triggers `loadAiringSchedule('today')`.
  - Plays tactile audio feedback (`Sfx.play('select')`).

```javascript
selectAiringDate('2026-05-28');
```

---

### `shiftAiringDate(deltaDays: number): void`
Navigates forward or backward by a specific number of days.

- **Parameters**:
  - `deltaDays` (`number`): Number of days to add (e.g., `+1` for tomorrow, `-1` for yesterday).
- **Returns**: `void`

```javascript
// Next day button click
shiftAiringDate(1);
```

---

### `switchAiringView(view: 'today' | 'week'): void`
Toggles between single-day timeline and full 7-day schedule view.

- **Parameters**:
  - `view` (`'today' \| 'week'`): The target view mode.
- **Returns**: `void`
- **Behavior**:
  - Updates `airingView`.
  - Updates pivot tab styling.
  - Triggers `loadAiringSchedule(view)`.

```javascript
switchAiringView('week');
```

---

### `loadAiringSchedule(view?: 'today' | 'week'): Promise<void>`
Queries the AniList API for airing schedules within the target timestamp window.

- **Parameters**:
  - `view` (`string`, optional): `'today'` or `'week'`.
- **Timestamp Calculation**:
  - **`today`**:
    $$\text{start} = \text{startOfDay}(\text{airingSelectedDate}) / 1000$$
    $$\text{end} = \text{endOfDay}(\text{airingSelectedDate}) / 1000$$
  - **`week`**:
    $$\text{start} = \text{startOfDay}(\text{today}) / 1000$$
    $$\text{end} = \text{start} + (7 \times 86400)$$
- **GraphQL Query**:
  ```graphql
  query ($start: Int, $end: Int) {
    Page(page: 1, perPage: 100) {
      airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
        id
        airingAt
        episode
        timeUntilAiring
        media {
          id
          title { english romaji }
          coverImage { large }
          format
          episodes
          genres
          isAdult
        }
      }
    }
  }
  ```
- **Behavior**:
  - Filters out adult content if `!showAdultContent`.
  - Renders horizontal cards and the vertical timeline streamer with countdown timers.

---

## 4. Architectural & Design Choices

1. **Client-Side Timezone Normalization**:
   AniList stores `airingAt` as UTC Unix timestamps. By converting these using the user's browser runtime (`new Date(airingAt * 1000)`), broadcast hours correctly reflect local television or simulcast release times anywhere in the world.
2. **Dual-Pane Airing Layout**:
   On desktop viewports, the Airing section places the calendar selector on the left and the vertical chronological timeline streamer on the right. This lets users browse days while keeping the current day's countdowns immediately visible.
3. **Live Countdown Timestamps**:
   Episodes scheduled within the next 24 hours compute remaining hours and minutes dynamically (`timeUntilAiring`), giving users immediate feedback on when new content will be available.
