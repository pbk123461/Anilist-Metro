# Class: CommunityFeedManager

The `CommunityFeedManager` module oversees social interactions, user status feeds, and forum discussions in AniList Metro. It provides feeds for following and public activity, forum thread browsing, nested comments, real-time liking (`ToggleLikeV2`), and inline reply submissions.

---

## 1. Description & Purpose

AniList contains an active social ecosystem comprising status posts, list updates, reviews, and threaded community forum discussions. `CommunityFeedManager` integrates these community capabilities into the Metro interface:
- **Following Feed**: Status updates and list actions from people the authenticated viewer follows.
- **Global Public Feed**: Worldwide AniList community stream accessible to both signed-in users and guests.
- **Trending Feed**: Highly upvoted activities and active community discussions.
- **Forums**: Structured category browsing (General, Anime, Manga, Release Discussion, Site Feedback) and nested thread viewing.
- Social mutations: Liking activity posts, opening inline reply editors, and posting threaded comments.

---

## 2. Properties & State Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `communityMode` | `'feed' \| 'forums'` | `'feed'` | Active view: social stream or forum discussions. |
| `feedMode` | `'following' \| 'global' \| 'trending'` | `'following'` | Active activity feed filter. |
| `communityPage` | `number` | `1` | Pagination page index. |

---

## 3. Function & Method Specifications

### `loadFollowingFeed(page?: number): Promise<void>`
Queries the social feed of users the viewer follows.

- **Parameters**:
  - `page` (`number`, optional): Page number (defaults to `1`).
- **Returns**: `Promise<void>`
- **GraphQL Query**:
  ```graphql
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      activities(isFollowing: true, type_in: [TEXT, MEDIA_LIST], sort: ID_DESC) {
        ... on TextActivity {
          id
          userId
          type
          replyCount
          text
          likeCount
          isLiked
          createdAt
          user { id name avatar { large } }
        }
        ... on ListActivity {
          id
          userId
          type
          status
          progress
          replyCount
          likeCount
          isLiked
          createdAt
          user { id name avatar { large } }
          media { id type title { english romaji } coverImage { large } }
        }
      }
    }
  }
  ```
- **Behavior**: Renders activity cards into `#community-feed-list`, including avatar, username, time ago, activity description, like counter, and reply trigger.

---

### `loadPublicCommunityFeed(page?: number): Promise<void>`
Queries global public activities across all AniList users. Accessible to both authenticated users and guests.

- **Parameters**:
  - `page` (`number`, optional): Page index.

---

### `loadForumsFeed(categoryId?: number): Promise<void>`
Queries and displays threads from AniList's discussion forums.

- **Parameters**:
  - `categoryId` (`number`, optional): Specific forum category ID.
- **GraphQL Query**:
  ```graphql
  query ($page: Int, $categoryId: Int) {
    Page(page: $page, perPage: 25) {
      threads(categoryId: $categoryId, sort: REPLIED_AT_DESC) {
        id
        title
        replyCount
        viewCount
        repliedAt
        user { id name avatar { large } }
        categories { id name }
      }
    }
  }
  ```

---

### `toggleLike(activityId: number, btnEl: HTMLElement): Promise<void>`
Dispatches the `ToggleLikeV2` GraphQL mutation to like or unlike a status post or list activity.

- **Parameters**:
  - `activityId` (`number`): The target activity ID.
  - `btnEl` (`HTMLElement`): The clicked like button element.
- **Returns**: `Promise<void>`
- **Mutation**:
  ```graphql
  mutation ($id: Int, $type: LikeableType) {
    ToggleLikeV2(id: $id, type: ACTIVITY) {
      ... on TextActivity { id likeCount isLiked }
      ... on ListActivity { id likeCount isLiked }
    }
  }
  ```
- **Behavior**: Optimistically toggles heart icon styling and increments/decrements like count before the mutation completes.

---

### `toggleReplyBox(activityId: number): void`
Toggles the visibility of the inline reply composer textarea beneath a specific activity card.

- **Parameters**:
  - `activityId` (`number`): Target activity identifier.

---

### `submitCommunityReply(event: Event, activityId: number): Promise<void>`
Posts a comment to an activity thread via the `SaveActivityReply` mutation.

- **Parameters**:
  - `event` (`Event`): Form submission event.
  - `activityId` (`number`): Activity identifier.
- **Returns**: `Promise<void>`
- **Mutation**:
  ```graphql
  mutation ($activityId: Int, $text: String) {
    SaveActivityReply(activityId: $activityId, text: $text) {
      id
      text
      createdAt
      user { id name avatar { large } }
    }
  }
  ```
- **Behavior**: Appends the new comment directly to the DOM beneath the parent activity card and displays confirmation toast.

---

## 4. Architectural & Design Choices

1. **Inline Reply Expansion**:
   Rather than navigating to a separate discussion page, reply boxes expand directly within the activity stream card. This keeps the panorama context uninterrupted.
2. **Polymorphic Activity Handling**:
   AniList activities can be `TextActivity`, `ListActivity`, or `MessageActivity`. `CommunityFeedManager` cleanly identifies the GraphQL `__typename` or fields (`status` vs. `text`) and generates specialized card templates for each.
3. **Guest Read-Only Degradation**:
   When browsing as a guest, like and reply buttons display friendly tooltips prompting the user to sign in, rather than crashing or throwing silent errors.
