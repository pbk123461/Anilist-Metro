# Class: NotificationManager

The `NotificationManager` module oversees user alerts, inbox feeds, unread count telemetry, live tile badge updates, and notification filtering in AniList Metro.

---

## 1. Description & Purpose

AniList triggers notifications whenever a user's activity is liked, a reply is posted, a thread is commented on, a user is followed, or a tracked anime announces an episode or sequel. `NotificationManager` handles:
- Querying and rendering polymorphic notification types (activity likes, replies, mentions, follows, thread comments, airing updates).
- Real-time unread notification count badge rendering on both the Start screen Live Tile (`#start-tile-notif`) and the Inbox section title (`#notif-page-title`).
- Category filtering: **All**, **Activity & Likes**, **Mentions & Replies**, **Forum Discussions**, and **Media Updates**.
- Marking all notifications as read to reset unread counters.

---

## 2. Properties & State Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `inboxMode` | `'unread' \| 'all'` | `'unread'` | Filter state for notification lists. |
| `notifPage` | `number` | `1` | Pagination page index. |

---

## 3. Function & Method Specifications

### `loadNotifications(mode?: 'unread' | 'all'): Promise<void>`
Queries the AniList notification collection and populates `#notif-list`.

- **Parameters**:
  - `mode` (`string`, optional): `'unread'` or `'all'`.
- **Returns**: `Promise<void>`
- **GraphQL Query**:
  ```graphql
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      notifications(resetNotificationCount: false) {
        ... on ActivityLikeNotification {
          id type createdAt user { id name avatar { large } } activityId
        }
        ... on ActivityReplyNotification {
          id type createdAt user { id name avatar { large } } activityId
        }
        ... on ActivityMentionNotification {
          id type createdAt user { id name avatar { large } } activityId
        }
        ... on FollowingNotification {
          id type createdAt user { id name avatar { large } }
        }
        ... on AiringNotification {
          id type episode contexts media { id title { english romaji } coverImage { large } }
        }
      }
    }
  }
  ```
- **Behavior**:
  - Validates authentication (displays login prompt in Guest Mode).
  - Normalizes polymorphic notification objects into unified list items.
  - Generates relative timestamps via `timeAgo()`.
  - Attaches direct click handlers to navigate to the relevant media detail, user profile, or thread.

---

### `switchInboxCategory(category: string, element: HTMLElement): void`
Filters rendered notifications by category.

- **Parameters**:
  - `category` (`string`): `'all'`, `'activity'`, `'mentions'`, `'forums'`, or `'system'`.
  - `element` (`HTMLElement`): The clicked tab button.
- **Returns**: `void`
- **Behavior**: Toggles `.active` class on tab headers and filters the DOM display of notification items.

```javascript
switchInboxCategory('activity', tabElement);
```

---

### `markAllNotificationsRead(): void`
Resets the viewer's unread notification counter on AniList.

- **Returns**: `void`
- **Behavior**:
  - Dispatches query setting `resetNotificationCount: true`.
  - Sets `#start-tile-notif` text to `'0'`.
  - Resets `#notif-page-title` to remove the badge counter.
  - Displays confirmation toast (`showToast('inbox marked as read')`).

```javascript
markAllNotificationsRead();
```

---

## 4. Architectural & Design Choices

1. **Polymorphic Notification Parser**:
   AniList represents different notification events with distinct GraphQL union types (`ActivityLikeNotification`, `AiringNotification`, etc.). `NotificationManager` maps each type to a tailored icon, description, and target action without code duplication.
2. **Live Tile Badge Integration**:
   Emulating Windows Phone 7 live tiles, unread notification counts are synchronized with the square Inbox tile on the Start screen, providing instant glanceable status without opening the section.
