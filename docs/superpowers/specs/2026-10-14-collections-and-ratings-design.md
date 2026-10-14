# Collections & Rating System Design Document

**Date:** 2026-10-14  
**Status:** Approved  
**Topic:** Collections, Unified Reviews/Ratings Schema, Blended Score Calculation, and Comments Merging  

---

## 1. Overview & Goals

This project implements the collection management and unified review/rating features for Orgi:
1. **"Add to collection" Toggle**: Changes the detail page action from "Add to list" to "Add to collection" with instant toggle persistence in Supabase.
2. **Dedicated Collection Page**: Provides full user collection management with status tabs (**Plan**, **Progress**, **Completed**).
3. **Unified Reviews Schema**: Merges legacy `ratings` and `comments` into a single `reviews` table in `schema.sql`, supporting both a rating score (1–10) and text content in one submission, plus threaded replies.
4. **Interactive 1–10 Snapping Slider**: Replaces the 5-star selector in the detail page composer with an accessible, stepped slider snapping from 1 to 10.
5. **Blended Rating Calculation**: Combines external provider ratings (e.g. TMDB 7.2) with Orgi community database ratings into an aggregated score displayed on the hero score rings.
6. **Merged Comments Stream & Filtering**: Unifies external provider reviews and Orgi community reviews on the detail page with filter chips (**All**, **Community / Ours**, **Provider**).

---

## 2. Architecture & Data Flow

```
[ Frontend: React / Vite ]
  │
  ├── Detail Page (MovieDetailsPage / BreakingBadPage)
  │     ├── "Add to collection" toggle button
  │     ├── Hero Score Rings: Blended Combined Score & Community Breakdown
  │     └── Reviews Tab:
  │           ├── Snapping Rating Slider (1 to 10) + Composer Textarea
  │           ├── Filter Bar ([All], [Community / Ours], [Provider])
  │           └── Merged Reviews Stream (Community first, Provider next)
  │
  └── Collection Page (/collection)
        ├── Status Tabs: All | Plan | Progress | Completed
        └── Media Grid with status switcher & remove action
  │
  ▼ API Calls (JWT via api.js)
[ Backend: Express (Render) ]
  ├── /api/collections/* (toggle, check, update status, list)
  ├── /api/reviews/* (fetch community reviews, post review/reply, delete)
  └── Supabase PostgreSQL (items, user_collections, reviews, users)
```

---

## 3. Database Schema Updates (`server/schema.sql`)

### 3.1 `items` Table
Ensures any external item (TMDB, MangaDex, OpenLibrary) referenced by collections or reviews has a canonical record:
```sql
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    provider TEXT NOT NULL, -- tmdb, mangadex, open_library, etc.
    type TEXT NOT NULL, -- movie, series, manga, manhwa, book, etc.
    title TEXT NOT NULL,
    cover_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_items_external UNIQUE (type, provider, external_id)
);
```

### 3.2 `user_collections` Table
Updated to enforce the 3 user-specified statuses:
```sql
CREATE TABLE IF NOT EXISTS user_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'plan' CHECK (status IN ('plan', 'progress', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_collections_item UNIQUE (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id);
```

### 3.3 Unified `reviews` Table
Replaces legacy separate `ratings` and `comments` tables:
```sql
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 1 AND score <= 10),
    content TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure a user can only have one top-level rated review per item
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_item_top_review 
ON reviews (user_id, item_id) 
WHERE parent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_parent_id ON reviews(parent_id);
```

### 3.4 Row Level Security (RLS)
- `items`: Public read (`true`), authenticated insert.
- `user_collections`: Authenticated user read, insert, update, delete where `auth.uid() = user_id`.
- `reviews`: Public read where `NOT is_deleted`; authenticated insert, update, delete where `auth.uid() = user_id`.

---

## 4. Backend API Specifications

### 4.1 Collection Endpoints (`server/src/routes/collectionRoutes.js`)
- **`GET /api/collections`**
  - **Auth**: Required (`requireAuth`).
  - **Query Params**: `status` (optional: `'plan'`, `'progress'`, `'completed'`).
  - **Response**: Array of collection records joined with item metadata (`items.title`, `items.cover_url`, `items.type`, `items.provider`, `items.external_id`, `user_collections.status`, `user_collections.created_at`).
- **`GET /api/collections/check/:provider/:externalId`**
  - **Auth**: Optional / Authenticated.
  - **Response**: `{ inCollection: boolean, status: string | null }`.
- **`POST /api/collections/toggle`**
  - **Auth**: Required (`requireAuth`).
  - **Body**: `{ external_id, provider, type, title, cover_url }`.
  - **Behavior**:
    1. Upsert into `items` table on conflict `(type, provider, external_id)`.
    2. Check if row exists in `user_collections` for `(user.id, item.id)`.
    3. If exists: delete record -> return `{ inCollection: false }`.
    4. If not exists: insert record with `status: 'plan'` -> return `{ inCollection: true, status: 'plan' }`.
- **`PATCH /api/collections/:itemId/status`**
  - **Auth**: Required (`requireAuth`).
  - **Body**: `{ status }` (validated against `'plan'`, `'progress'`, `'completed'`).
  - **Behavior**: Updates status and `updated_at`.

### 4.2 Review & Rating Endpoints (`server/src/routes/reviewRoutes.js`)
- **`GET /api/reviews/:provider/:externalId`**
  - **Auth**: Public.
  - **Response**:
    ```json
    {
      "success": true,
      "data": {
        "communityAverage": 8.4,
        "communityVotes": 32,
        "reviews": [
          {
            "id": "uuid",
            "userId": "uuid",
            "author": "Username",
            "avatar": "url",
            "score": 9,
            "content": "Review text...",
            "time": "ISO date string",
            "source": "community",
            "replies": []
          }
        ]
      }
    }
    ```
- **`POST /api/reviews`**
  - **Auth**: Required (`requireAuth`).
  - **Body**: `{ external_id, provider, type, title, cover_url, score, content, parent_id }`.
  - **Behavior**:
    1. Upsert `items` row if needed.
    2. If `parent_id` is null: Upsert top-level review `(user_id, item_id)` with `score` (1–10) and `content`.
    3. If `parent_id` is provided: Insert discussion reply.
- **`DELETE /api/reviews/:id`**
  - **Auth**: Required (`requireAuth`).
  - **Behavior**: Soft deletes (`is_deleted = true`) or removes own review.

---

## 5. Rating Blending & Review Merging Logic

### 5.1 Blended Rating Formula
Let:
- $R_p$ = Provider rating (0.0 to 10.0 scale)
- $V_p$ = Provider vote count (e.g. TMDB `vote_count`, or baseline `100` if provider does not expose vote count)
- $R_c$ = Community average rating from Supabase `reviews` (1.0 to 10.0 scale)
- $V_c$ = Community vote count (count of top-level reviews with scores)

When $V_c = 0$:
$$\text{Combined Score} = R_p$$
$$\text{Total Votes} = V_p$$

When $V_c > 0$:
$$\text{Combined Score} = \frac{(R_p \times V_p) + (R_c \times V_c)}{V_p + V_c}$$
$$\text{Total Votes} = V_p + V_c$$

### 5.2 Merged Reviews Stream & Filtering
On the frontend Detail Page:
- Fetches provider reviews (e.g., TMDB `reviews.results`) and Orgi community reviews from `/api/reviews/:provider/:externalId`.
- Community reviews are mapped with `source: 'community'`.
- Provider reviews are mapped with `source: 'provider'`.
- Filter selection state:
  - **All**: Displays all reviews, prioritizing community reviews at the top.
  - **Community (Ours)**: Displays only reviews where `source === 'community'`.
  - **Provider**: Displays only reviews where `source === 'provider'`.

---

## 6. Frontend UI Components & Pages

### 6.1 Detail Page Action ("Add to collection")
- Location: [MovieDetailsPage.jsx](file:///d:/ZenzenLife/Projects/Orgi(Forked)/client/src/pages/MovieDetailsPage.jsx) and [BreakingBadPage.jsx](file:///d:/ZenzenLife/Projects/Orgi(Forked)/client/src/pages/BreakingBadPage.jsx).
- Renamed from "Add to list" to "Add to collection".
- Fetches current collection status on load.
- Shows active state (`In collection` with checkmark icon) when item is saved, clicking toggles and updates UI immediately.

### 6.2 Snapping Stepped Slider (1 to 10)
- New component: `client/src/components/ui/ReviewSlider.jsx` replacing `StarRating.jsx` in the composer.
- Step size = 1, range = 1 to 10.
- Interactive range input styled with custom CSS track, mint `#61F1AC` fill, snapping indicators, and current numerical score badge (`★ 8 / 10`).

### 6.3 Collection Page (`client/src/pages/CollectionPage.jsx`)
- Complete replacement of placeholder.
- Status navigation tabs: `All`, `Plan`, `Progress`, `Completed`.
- Media item card grid with:
  - 2:3 aspect poster with fallback image.
  - Media type badge (`MOVIE`, `SERIES`, `MANHWA`, etc.).
  - Title and year/category.
  - Status switcher dropdown (Plan <-> Progress <-> Completed) and "Remove from collection" button.
- Empty states with call-to-action to browse movies or manhwa.

---

## 7. Edge Cases & Error Handling

1. **Unauthenticated User clicks "Add to collection" or "Post Review"**:
   - Displays clear prompt / notification directing the user to sign in.
2. **Provider without reviews or ratings**:
   - Gracefully displays community reviews and calculates score purely from community ratings.
3. **Item not yet in database**:
   - `/api/collections/toggle` and `/api/reviews` automatically upsert the item record with metadata into `items` first, guaranteeing referential integrity.
4. **Duplicate top-level review**:
   - Upsert logic replaces or updates existing score and content rather than throwing a duplicate key constraint error.
5. **Score bounds validation**:
   - Backend validates integer score is between 1 and 10.
