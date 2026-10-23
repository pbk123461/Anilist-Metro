# Class: CacheManager

The `cacheManager` class (implemented as a singleton cache utility object) provides an in-browser local storage persistence layer for AniList GraphQL API responses. It implements a **stale-while-revalidate / cache-first strategy** with deterministic hashing, configurable TTL (time-to-live) expiration, and resilient fallback during AniList API rate-limiting incidents.

---

## 1. Description & Purpose

The AniList GraphQL API enforces a strict rate limit of **90 requests per minute**. When browsing extensive media libraries, seasonal schedules, and community discussions, naive direct requests will rapidly exhaust this quota and trigger HTTP 429 errors.

`cacheManager` mitigates this by:
- Generating deterministic, collision-resistant hash keys from GraphQL query strings and variable dictionaries.
- Caching payload responses directly in `window.localStorage`.
- Tracking explicit millisecond expiration timestamps (`expiry = Date.now() + ttl`).
- Providing instant render access for cached queries, reducing API latency from ~300ms down to <1ms.
- Serving as a graceful fallback when network errors or HTTP 429 rate limit events occur.

---

## 2. Properties & Constants

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PREFIX` | `string` | `'anilist_cache_'` | Namespace prefix applied to all cache keys in `localStorage` to prevent collisions with user settings. |
| `DEFAULT_TTL` | `number` | `3600000` | Default cache validity window in milliseconds (1 hour). |

---

## 3. Method Specifications

### `hash(str: string): string`
Computes an efficient 32-bit polynomial rolling hash from an arbitrary input string and serializes it to an alphanumeric base-36 string.

- **Parameters**:
  - `str` (`string`): Serialized query and variables string.
- **Returns**: `string` — Base-36 hash representation (e.g., `'1a8f9z'`).
- **Algorithm**:
  $$\text{hash} = ((\text{hash} \ll 5) - \text{hash}) + \text{char}$$
  Uses 32-bit bitwise OR coercion (`hash |= 0`) to enforce integer boundaries.

```javascript
const keyHash = cacheManager.hash('query { Viewer { id } }');
// Returns e.g. "2q9d3e"
```

---

### `generateKey(query: string, variables: Record<string, any>): string`
Generates a unique, standardized cache key by serializing the query and variable payload and passing it to `hash()`.

- **Parameters**:
  - `query` (`string`): The GraphQL query string.
  - `variables` (`Record<string, any>`): Variable parameters associated with the query.
- **Returns**: `string` — Prefixed cache key (e.g., `'anilist_cache_2q9d3e'`).

```javascript
const query = `query($id: Int) { Media(id: $id) { title { romaji } } }`;
const vars = { id: 16498 };
const cacheKey = cacheManager.generateKey(query, vars);
```

---

### `get(key: string): { data: any, isExpired: boolean } | null`
Retrieves an entry from `localStorage` by key, parses its metadata, and evaluates expiration.

- **Parameters**:
  - `key` (`string`): The generated cache key.
- **Returns**: `{ data: any, isExpired: boolean } | null`
  - Returns `null` if the key does not exist or JSON parsing fails.
  - Returns the parsed data object along with a boolean indicating whether the current timestamp exceeds `expiry`.

```javascript
const cached = cacheManager.get('anilist_cache_2q9d3e');
if (cached && !cached.isExpired) {
    console.log('Valid cache hit:', cached.data);
} else if (cached && cached.isExpired) {
    console.log('Stale cache hit (can be used as fallback on 429)');
}
```

---

### `set(key: string, data: any, ttl?: number): void`
Stores an arbitrary data payload alongside an absolute expiration timestamp in `localStorage`.

- **Parameters**:
  - `key` (`string`): The cache key.
  - `data` (`any`): The JSON-serializable API payload.
  - `ttl` (`number`, optional): Validity window in milliseconds. Defaults to `cacheManager.DEFAULT_TTL` (3,600,000 ms).
- **Returns**: `void`
- **Behavior**: Calculates `expiry = Date.now() + ttl` and calls `localStorage.setItem(key, JSON.stringify({ data, expiry }))`.

```javascript
const payload = { media: [{ id: 1, title: 'Cowboy Bebop' }] };
// Store with 2-hour TTL
cacheManager.set(cacheKey, payload, 7200000);
```

---

### `delete(key: string): void`
Removes a specific cached entry from `localStorage`.

- **Parameters**:
  - `key` (`string`): The cache key to invalidate.
- **Returns**: `void`

```javascript
cacheManager.delete(cacheKey);
```

---

## 4. Integration with Network Layer

`cacheManager` is integrated directly into the core `fetchAPI()` network pipeline:

```javascript
async function fetchAPI(query, variables = {}) {
    const key = cacheManager.generateKey(query, variables);
    const cached = cacheManager.get(key);

    // 1. Cache-First: return instantly if valid
    if (cached && !cached.isExpired) {
        return cached.data;
    }

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ query, variables })
        });

        // 2. Fallback on Rate Limit: return stale cache if available
        if (response.status === 429) {
            if (cached) {
                showToast('rate limited. using cached data.');
                return cached.data;
            }
            throw new Error('Rate limited');
        }

        const json = await response.json();
        
        // 3. Populate Cache
        if (json.data) {
            cacheManager.set(key, json.data);
        }
        return json.data;
    } catch (err) {
        // Fallback to stale data on network drop
        if (cached) return cached.data;
        throw err;
    }
}
```

---

## 5. Architectural & Design Choices

1. **Lightweight Bitwise Hashing**:
   Rather than loading heavy external crypto libraries (like CryptoJS or SubtleCrypto), `cacheManager` uses a bitwise polynomial hash that runs in sub-millisecond time on any JS engine.
2. **Deterministic Query Normalization**:
   Stringifying `{ query, variables }` ensures identical GraphQL queries with identical parameters produce identical keys, while variations in filter arguments maintain distinct cache entries.
3. **Resilience During AniList 429 Outages**:
   AniList API limits can be easily triggered when scrolling fast through discover feeds. Instead of presenting blank error screens, `cacheManager` silently serves stale cached data with an unobtrusive Metro toast notification.
