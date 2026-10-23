# Class: SearchEngine (DiscoveryManager)

The `SearchEngine` module powers media discovery and catalog exploration for AniList Metro. It provides full-text multi-facet search, debounced querying, seasonal release browsing, studio and genre directories, trending/popular/upcoming feeds, recent search history persistence, and adult content filtering.

---

## 1. Description & Purpose

AniList features hundreds of thousands of anime, manga, light novels, and one-shots. `SearchEngine` delivers a comprehensive discovery hub that translates complex multi-dimensional criteria into optimized GraphQL requests:
- Full-text search with 300ms debounce to prevent input lag.
- Multi-facet filtering by format, status, season, genre, source material, country of origin, year range, and adult content.
- Dedicated exploration pivots: **Trending**, **Popular This Season**, **Upcoming Next Season**, **Top 100**, **Seasonal Archive**, **Genre Directory**, and **Studio Catalog**.
- Storing recent search queries in `localStorage` with click-to-recall chips.
- Seamless integration with Metro UI flip tiles and right-sliding detail charms.

---

## 2. Properties & Configuration

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `searchType` | `'ANIME' \| 'MANGA'` | `'ANIME'` | Active discovery media type. |
| `searchSort` | `string` | `'SEARCH_MATCH'` | GraphQL sort key (`'SEARCH_MATCH'`, `'POPULARITY_DESC'`, `'SCORE_DESC'`, etc.). |
| `searchYearRange` | `{ minYear: number, maxYear: number }` | `{ minYear: 2000, maxYear: currentYear }` | Year span boundaries. |
| `showAdultContent` | `boolean` | `false` | Gatekeeper for 18+ Hentai/Adult listings (`localStorage.getItem('show_adult')`). |
| `showSpoilers` | `boolean` | `false` | Spoiler visibility toggle (`localStorage.getItem('show_spoilers')`). |

### Metadata Dictionaries
- `ALL_GENRES`: 45 AniList genres (`Action`, `Comedy`, `Drama`, `Mecha`, `Romance`, `Sci-Fi`, etc.).
- `ALL_SOURCES`: `ORIGINAL`, `MANGA`, `LIGHT_NOVEL`, `VISUAL_NOVEL`, `VIDEO_GAME`, `OTHER`, `NOVEL`, `DOUJINSHI`, `ANIME`, `WEB_NOVEL`, `LIVE_ACTION`, `GAME`, `COMIC`, `MULTIMEDIA_PROJECT`.
- `ALL_COUNTRIES`: Japan (`JP`), South Korea (`KR`), China (`CN`), Taiwan (`TW`).
- `ALL_FORMATS`: `TV`, `TV_SHORT`, `MOVIE`, `OVA`, `ONA`, `SPECIAL`, `MUSIC`, `MANGA`, `NOVEL`, `ONE_SHOT`.

---

## 3. Function & Method Specifications

### `doSearch(page?: number): Promise<void>`
Executes an AniList GraphQL full-text query incorporating all active filter parameters.

- **Parameters**:
  - `page` (`number`, optional): Pagination page index (defaults to `1`).
- **Returns**: `Promise<void>`
- **GraphQL Query**:
  ```graphql
  query ($page: Int, $perPage: Int, $search: String, $type: MediaType, $sort: [MediaSort], $genre_in: [String], $format_in: [MediaFormat], $status: MediaStatus, $season: MediaSeason, $seasonYear: Int, $countryOfOrigin: CountryCode, $source: MediaSource, $startDate_greater: FuzzyDateInt, $startDate_lesser: FuzzyDateInt, $isAdult: Boolean) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage currentPage }
      media(search: $search, type: $type, sort: $sort, genre_in: $genre_in, format_in: $format_in, status: $status, season: $season, seasonYear: $seasonYear, countryOfOrigin: $countryOfOrigin, source: $source, startDate_greater: $startDate_greater, startDate_lesser: $startDate_lesser, isAdult: $isAdult) {
        id
        title { english romaji native }
        coverImage { large extraLarge }
        averageScore
        status
        format
        episodes
        chapters
        isAdult
      }
    }
  }
  ```
- **Behavior**:
  - Collects text from `#search-input`.
  - Appends query parameters to `variables`.
  - If text search is active, records query to recent history via `saveRecentSearch(term)`.
  - Executes `fetchAPI(query, variables)`.
  - Calls `renderSearchResults()` to populate the discovery grid with Metro flip-tiles.

```javascript
// Search anime with active filters
await doSearch(1);
```

---

### `applySearchFilters(): void`
Gathers input values from all search filter dropdowns and initiates a fresh query at page 1.

- **DOM Elements Scanned**:
  - `#filter-format`
  - `#filter-status`
  - `#filter-genre`
  - `#filter-country`
  - `#filter-source`
  - `#filter-year-min` / `#filter-year-max`
  - `#filter-sort`

---

### `loadTrending(page?: number): Promise<void>`
Loads the currently trending anime or manga list.

- **Parameters**:
  - `page` (`number`, optional): Page number.
- **Query Sort**: `sort: [TRENDING_DESC, POPULARITY_DESC]`
- **Rendering**: Populates the Discover section's default spotlight grid.

```javascript
loadTrending();
```

---

### `loadSeasonalGrid(page: number, season: string, year: number): Promise<void>`
Queries and displays all anime broadcasting during a specific anime season (Winter, Spring, Summer, Fall) and year.

- **Parameters**:
  - `page` (`number`): Page number.
  - `season` (`string`): `'WINTER'`, `'SPRING'`, `'SUMMER'`, or `'FALL'`.
  - `year` (`number`): The calendar year.

---

### `initGenreBrowse(): void` & `loadGenreBrowseGrid(genre: string): Promise<void>`
Renders an interactive catalog of all 45 AniList genre chips. Clicking any chip opens a specialized overview charm listing top-rated and popular titles belonging to that genre.

---

### `initStudioBrowse(): void` & `searchStudios(query: string): Promise<void>`
Provides a dedicated search interface for anime animation studios (e.g., Kyoto Animation, ufotable, MAPPA, Bones). Queries the `Studio` endpoint and displays the studio's full media catalog sorted by popularity.

---

### `saveRecentSearch(term: string): void` & `renderRecentSearches(): void`
Persists the 10 most recent search terms in `localStorage.getItem('metro_recent_searches')` and displays them as clickable chips under the search bar for fast one-tap queries.

---

## 4. Architectural & Design Choices

1. **Debounced Search Dispatch**:
   Typing rapidly in the search bar triggers `searchTimeout = setTimeout(doSearch, 300)`. This avoids firing redundant GraphQL requests on every keystroke, keeping request rates well within AniList's 90 req/min limit.
2. **Adult Content Gating**:
   Adult (18+) entries are filtered by default at the GraphQL API level (`isAdult: false`). The toggle in Settings requires explicit user activation and persists in `localStorage`, protecting viewers in shared spaces.
3. **Multi-Faceted Modular Queries**:
   All search filters compose dynamically into a single clean GraphQL query object. Undefined filter criteria are omitted from `variables`, ensuring AniList's query planner optimizes execution times.
