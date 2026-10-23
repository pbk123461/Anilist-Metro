# Class: AuthManager

The `AuthManager` module oversees user authentication, OAuth 2.0 Implicit Grant token lifecycle management, guest mode isolation, session persistence, and login screen presentation for AniList Metro.

---

## 1. Description & Purpose

AniList Metro provides two operational modes:
1. **Authenticated Mode**: Grants full read/write access to personal anime and manga libraries, custom lists, score updates, social following feeds, activity creation, forum replies, and notification alerts using an OAuth2 Bearer token.
2. **Guest Mode**: Allows instant, frictionless discovery of seasonal schedules, airing countdowns, global media trends, public community posts, and full-text searches without requiring an AniList account or login.

`AuthManager` handles:
- AniList OAuth 2.0 implicit grant flow redirection.
- Parsing and sanitization of URL hash fragment tokens (`#access_token=...`).
- Session restoration and validation on page load.
- Seamless fallback to Guest Mode when requested by the user.
- Automated token invalidation and logout procedures.
- The interactive SFW trending slideshow on the login overlay.

---

## 2. Configuration & State Variables

| Variable | Type | Value / Default | Description |
| :--- | :--- | :--- | :--- |
| `CLIENT_ID` | `number` | `40698` | Registered AniList OAuth2 Client ID. |
| `accessToken` | `string \| null` | `localStorage.getItem('anilist_token')` | Active OAuth Bearer token. |
| `currentUserId` | `number \| null` | `null` | AniList numerical user ID of the authenticated viewer. |
| `currentViewerName` | `string` | `'guest'` | Username of the active user. |
| `isGuest` | `boolean` | `false` | Boolean flag indicating whether the app is running in guest mode. |

---

## 3. Function & Method Specifications

### `checkAuth(): void`
Evaluates the URL hash and local storage upon page load to determine authentication status and initialize the appropriate application state.

- **Returns**: `void`
- **Workflow**:
  1. Inspects `window.location.hash` using `URLSearchParams(window.location.hash.substring(1))`.
  2. If an `access_token` parameter is detected:
     - Persists the token to `localStorage.setItem('anilist_token', token)`.
     - Assigns `accessToken = token`.
     - Sanitizes the browser address bar via `window.history.replaceState()` to strip the token hash fragment.
  3. Checks `localStorage.getItem('anilist_token')` for existing sessions.
  4. If an authenticated session is confirmed:
     - Hides `#login-overlay`.
     - Displays `#app-container`, `#main-nav`, `#top-right-nav`, and `#main-arrows`.
     - Aligns top navigation to section 0 (`start`).
     - Triggers asynchronous user data loading via `loadUserData()`.

```javascript
// Automatically executed on application boot
checkAuth();
```

---

### `login(): void`
Redirects the user to the official AniList OAuth 2.0 authorization endpoint.

- **Returns**: `void`
- **Redirect URL**:
  `https://anilist.co/api/v2/oauth/authorize?client_id=40698&response_type=token`
- **Behavior**: Directs the browser away to AniList where the user grants permissions. AniList redirects back to the app with the access token appended as a hash fragment.

```javascript
document.getElementById('login-sign-in-btn').addEventListener('click', login);
```

---

### `guestMode(): void`
Transitions the user immediately into the application without an account.

- **Returns**: `void`
- **Behavior**:
  - Sets `isGuest = true`.
  - Hides `#login-overlay` and displays all application shell components.
  - Configures the User section UI to display `'guest'` placeholders with subtitle `'browse the metro shell without syncing'`.
  - Configures empty state notices for personal Library and Inbox sections.
  - Loads public data modules: `loadPublicCommunityFeed()`, `loadTrending()`, `initAiringCalendar()`, and `loadAiringSchedule('today')`.

```javascript
document.getElementById('login-guest-btn').addEventListener('click', guestMode);
```

---

### `logout(): void`
Terminates the active user session and reloads the application.

- **Returns**: `void`
- **Behavior**:
  - Removes `'anilist_token'` from `window.localStorage`.
  - Re-executes `location.reload()`, which returns the application to the unauthenticated login overlay.

```javascript
logout();
```

---

### `initLoginSlideshow(): void`
Fetches a curated set of current SFW releasing anime and displays an auto-scrolling preview reel on the login screen.

- **Returns**: `void`
- **Query**:
  ```graphql
  query {
    Page(page: 1, perPage: 10) {
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false, status: RELEASING) {
        id
        title { english romaji }
        coverImage { large }
      }
    }
  }
  ```
- **Behavior**:
  - Populates `#slideshow-content` with interactive Metro tiles.
  - Clicking any tile automatically enters guest mode and opens the corresponding detail charm panel via `openDetailById(id, 'ANIME')`.
  - Initiates a 3-second `setInterval` loop that translates the slideshow horizontally.

---

### `bindLoginButtons(): void`
Attaches robust click event listeners to the Sign In and Guest Mode buttons after Metro UI initialization.

- **Purpose**: Some vendored Metro UI v4 widgets intercept standard click events. `bindLoginButtons()` provides an explicit delegation fallback ensuring button clicks always trigger navigation.

---

## 4. Architectural & Design Choices

1. **OAuth 2.0 Implicit Grant vs. Authorization Code**:
   Because AniList Metro is a pure client-side application with no backend server, the Implicit Grant flow is the official, secure mechanism for obtaining API access without exposing client secrets.
2. **URL Hash Sanitization**:
   Tokens passed in the URL hash can leak into browser history or analytics scripts. `checkAuth()` immediately calls `history.replaceState()` to erase `#access_token` from the address bar as soon as it is stored in `localStorage`.
3. **First-Class Guest Experience**:
   Users should never be forced to log in just to check when their favorite show airs. `guestMode()` provides an immediate, fully functional experience across Discover, Airing, Search, and Community without writing to personal AniList data.
