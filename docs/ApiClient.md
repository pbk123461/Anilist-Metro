# Class: ApiClient

The `ApiClient` module coordinates all HTTP network communication between AniList Metro and the **AniList GraphQL v2 API** (`https://graphql.anilist.co`). It handles GraphQL serialization, Bearer token injection, rate limit telemetry tracking, exponential backoff retries, automatic token invalidation handling, and integration with `cacheManager`.

---

## 1. Description & Purpose

AniList uses a single POST GraphQL endpoint to serve all queries and mutations. Building a performant client requires managing complex network states:
- Authenticated requests require an `Authorization: Bearer <token>` header, while guest browsing operates anonymously.
- AniList enforces a 90 requests/minute rate limit, exposing remaining allowances via HTTP response headers (`X-RateLimit-Remaining` and `X-RateLimit-Limit`).
- Tokens can expire or get revoked, which requires immediate session cleanup and re-authentication prompts.
- Intermittent network drops or rate limit surges require retry loops with exponential backoff.

`ApiClient` centralizes these concerns so UI components can execute data queries reliably with clean `Promise`-based syntax.

---

## 2. Global State Dependencies

| Variable | Type | Description |
| :--- | :--- | :--- |
| `accessToken` | `string \| null` | Active AniList OAuth2 bearer access token stored in `localStorage.getItem('anilist_token')`. |
| `isGuest` | `boolean` | Flag indicating whether the user is browsing in unauthenticated guest mode. |

---

## 3. Function & Method Specifications

### `fetchAPI(query: string, variables?: Record<string, any>): Promise<any>`
Executes a single POST request to the AniList GraphQL API with caching, rate limit header monitoring, and error handling.

- **Parameters**:
  - `query` (`string`): The GraphQL query or mutation document.
  - `variables` (`Record<string, any>`, optional): Query variables (defaults to `{}`).
- **Returns**: `Promise<any>` — Resolves with the contents of `json.data`.
- **Workflow**:
  1. **Cache Evaluation**: Computes key via `cacheManager.generateKey(query, variables)`. If fresh cache exists, resolves immediately without hitting the network.
  2. **Header Assembly**: Attaches `'Content-Type': 'application/json'` and `'Accept': 'application/json'`. If `accessToken` exists and `!isGuest`, appends `'Authorization': 'Bearer ' + accessToken`.
  3. **Network Dispatch**: Issues `fetch('https://graphql.anilist.co', { method: 'POST', ... })`.
  4. **Rate Limit Handling (429)**: If the server responds with HTTP 429, returns any existing stale cache entry and alerts user via `showToast('rate limited. using cached data.')`. If no cache exists, throws an error.
  5. **Header Telemetry**: Parses `X-RateLimit-Remaining` and `X-RateLimit-Limit`, forwarding values to `updateRateLimitIndicator()`.
  6. **Token Expiry Detection**: If the API response contains `"unauthorized"` or `"invalid token"`, notifies the user (`showToast('session expired. please sign in again.')`) and invokes `logout()`.
  7. **Cache Population**: Saves successful response to `cacheManager.set(key, json.data)`.

```javascript
const query = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title { english romaji }
      coverImage { large }
    }
  }
`;
const data = await fetchAPI(query, { id: 1 });
console.log(data.Media.title.romaji);
```

---

### `fetchAPIWithRetry(query: string, variables?: Record<string, any>, retries?: number, delay?: number): Promise<any>`
Wraps `fetchAPI()` in a retry loop with linear/exponential backoff specifically targeted at recovering from transient HTTP 429 rate limit events.

- **Parameters**:
  - `query` (`string`): The GraphQL document.
  - `variables` (`Record<string, any>`, optional): Query variables.
  - `retries` (`number`, optional): Maximum retry attempts (default: `3`).
  - `delay` (`number`, optional): Base delay multiplier in milliseconds (default: `2000`).
- **Returns**: `Promise<any>`
- **Behavior**:
  - Iterates up to `retries` times.
  - On a `'Rate limited'` error, calculates wait duration:
    $$\text{wait} = \text{delay} \times (i + 1)$$
  - Pauses execution via `setTimeout` promise and retries.
  - Re-throws the final error if all attempts fail.

```javascript
// Retries up to 4 times with 1.5s base backoff (1.5s, 3.0s, 4.5s)
const result = await fetchAPIWithRetry(heavyQuery, { page: 1 }, 4, 1500);
```

---

### `updateRateLimitIndicator(remaining: number, limit: number): void`
Updates the UI telemetry widget in the top navigation bar, visualizing the current AniList request budget.

- **Parameters**:
  - `remaining` (`number`): Number of allowed requests remaining in the current minute window.
  - `limit` (`number`): Total allowable requests per minute (typically 90).
- **Returns**: `void`
- **DOM Updates**:
  - Sets the width percentage of `#rate-limit-fill`:
    $$\text{pct} = \min\left(100, \max\left(0, \frac{\text{remaining}}{\text{limit}} \times 100\right)\right)$$
  - Sets `#rate-limit-label` text to `${remaining}/${limit} req`.
  - Dynamically changes the bar color to `#ff0033` (Metro crimson) when capacity drops below 20%, otherwise resets to `var(--accent)`.

```javascript
updateRateLimitIndicator(15, 90);
```

---

## 4. Usage Examples

### Fetching User Profile Information
```javascript
async function loadViewerProfile() {
    const query = `
      query {
        Viewer {
          id
          name
          avatar { large }
          statistics {
            anime { count episodesWatched }
          }
        }
      }
    `;
    try {
        const data = await fetchAPI(query);
        return data.Viewer;
    } catch (err) {
        showToast('could not load profile');
        console.error(err);
    }
}
```

### Performing Mutations (Media Entry Updates)
```javascript
async function updateMediaProgress(mediaId, progress) {
    const mutation = `
      mutation ($mediaId: Int, $progress: Int) {
        SaveMediaListEntry(mediaId: $mediaId, progress: $progress) {
          id
          status
          progress
        }
      }
    `;
    const res = await fetchAPI(mutation, { mediaId, progress });
    showToast('progress updated');
    return res.SaveMediaListEntry;
}
```

---

## 5. Architectural & Design Choices

1. **Automatic Header Ingestion & Rate Limit Visualization**:
   AniList API limits reset every 60 seconds. Rather than letting the user hit a sudden wall of HTTP 429 errors, the real-time visualizer informs the user of their usage rate directly in the UI.
2. **Seamless Session Invalidation**:
   OAuth2 access tokens can expire after prolonged periods. Instead of silently failing or leaving UI components in an undefined state, `ApiClient` intercepts token errors, issues user feedback, and clears local credentials.
3. **Cache-First Network Strategy**:
   Reading from `localStorage` before hitting the network gives AniList Metro near-instantaneous page transitions, mimicking the feel of a native Windows desktop executable.
