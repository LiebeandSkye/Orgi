# Dashboard, Reviews, and Collections Redesign Specification

**Date:** 2026-10-14  
**Status:** Approved  
**Topic:** Collection Page Filters/Sorting, Detail Page Review Flow & Rating Slider, Avatar Fallback, and User Dashboard  

---

## 1. Overview & Goals

This specification outlines the architecture, database schema, API contracts, and user interface updates for:
1. **Collection Page Toolbar**: Replacing top status tabs with Books-style pill dropdowns: **Status** (`All`, `Plan`, `Progress`, `Completed`), **Media Type Filter** (`All`, `Movies`, `Series`, `Books`, `Manga`, `Manhwa`), and **Sort** (`Recently Added`, `Title (A–Z)`, `Title (Z–A)`), plus an active filter reset button.
2. **Detail Page Review & Rating Experience**:
   - Pinned user review card when an authenticated user has already reviewed the item, displaying an **Edit Review** button.
   - Inline edit mode with pre-filled content/score, saving via the existing review upsert endpoint.
   - Schema enhancement to track `is_edited BOOLEAN NOT NULL DEFAULT false`, displaying `(edited)` tag next to updated reviews.
   - Snapping 1–10 rating slider with smooth interaction and 10 evenly spaced, aligned numerical step labels.
   - Dynamic user avatar resolution with network/link fallback to default avatar in both Navbar and Review components.
   - Review text clamped to 2 rows (`line-clamp-2`) with an interactive "Read more" / "Show less" toggle.
   - Elimination of like, reply, and 3-dots actions on external provider reviews, keeping them exclusively for Orgi community reviews.
3. **User Dashboard (`/dashboard`)**:
   - Top metrics overview cards: Reviews Written, Liked Reviews, and Reports Filed.
   - Three dedicated management tabs:
     - **My Reviews**: View, edit, or delete personal reviews across media items.
     - **My Likes**: View and unlike saved reviews.
     - **Reports**: View filed reports and their status (`Pending`, `In Review`, `Resolved`, `Dismissed`).
     - **Moderation Queue** (role-gated for `admin` / `moderator`): Review community reports, update statuses, and log notes.

---

## 2. Database Schema Updates (`server/schema.sql`)

### 2.1 `reviews` Table Enhancement
Add `is_edited` column:
```sql
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false;
```
When updating an existing review in `reviewController.createReview`, `is_edited` is set to `true` and `updated_at` to `NOW()`.

### 2.2 `review_likes` Table
Persistent like tracking adhering to Supabase PostgreSQL as the single source of truth:
```sql
CREATE TABLE IF NOT EXISTS review_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_review_like UNIQUE (user_id, review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);

ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to review_likes"
ON review_likes FOR SELECT
USING (true);

CREATE POLICY "Allow users to insert own review_likes"
ON review_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own review_likes"
ON review_likes FOR DELETE
USING (auth.uid() = user_id);
```

### 2.3 `reports` Table Policies
Ensure moderators and admins can manage reports:
```sql
CREATE POLICY "Allow moderators to read all reports"
ON reports FOR SELECT
USING (
    auth.uid() = reporter_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

CREATE POLICY "Allow moderators to update reports"
ON reports FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);
```

---

## 3. Backend API Specifications

### 3.1 Review Routes (`server/src/routes/reviewRoutes.js`)
- `POST /api/reviews/:id/like` (Auth Required):
  - Toggles like for the authenticated user in `review_likes`.
  - Returns `{ success: true, data: { liked: boolean, likesCount: number } }`.
- `GET /api/reviews/user/my`:
  - Returns list of reviews authored by the authenticated user with joined item metadata (`title`, `cover_url`, `type`, `provider`, `external_id`).
- `GET /api/reviews/user/likes`:
  - Returns list of reviews liked by the authenticated user with joined item and review author details.

### 3.2 Report Routes (`server/src/routes/reportRoutes.js`)
- `POST /api/reports` (Auth Required):
  - Request body: `{ target_type: 'review'|'item'|'user', target_id: UUID, reason: string }`.
  - Creates record in `reports` table.
- `GET /api/reports/my` (Auth Required):
  - Returns user's filed reports.
- `GET /api/reports/all` (Moderator/Admin Required):
  - Returns all community reports with reporter details.
- `PATCH /api/reports/:id` (Moderator/Admin Required):
  - Request body: `{ status: 'in_review'|'resolved'|'dismissed', moderator_notes?: string }`.
  - Updates report status and timestamps.

### 3.3 Dashboard Summary Route (`server/src/routes/dashboardRoutes.js`)
- `GET /api/dashboard/summary` (Auth Required):
  - Returns aggregated stats:
    ```json
    {
      "success": true,
      "data": {
        "stats": {
          "reviewCount": 12,
          "likeCount": 35,
          "reportCount": 2
        },
        "userRole": "user",
        "recentReviews": [],
        "recentLikes": [],
        "recentReports": []
      }
    }
    ```

---

## 4. Frontend Specifications

### 4.1 Collection Page (`client/src/pages/CollectionPage.jsx`)
- **Filter Toolbar**:
  - `Status`: Dropdown pill with options: `All`, `Plan`, `Progress`, `Completed`.
  - `Filter`: Dropdown pill with options: `All`, `Movies`, `Series`, `Books`, `Manga`, `Manhwa`.
  - `Sort`: Dropdown pill with options: `Recently Added`, `Title (A–Z)`, `Title (Z–A)`.
  - `Reset`: Secondary rounded pill button appearing when any filter is non-default.
- **Client-Side Filtering & Sorting**:
  - Filter by status matching `item.status`.
  - Filter by media type matching `item.type`.
  - Sort by `created_at` or `title` locale comparison.

### 4.2 Detail Page Comments & Rating (`client/src/pages/MovieDetailsPage.jsx`)
- **User Review Card vs Composer**:
  - Check if `communityData.reviews` contains a review with `userId === user.id`.
  - If present and not in editing mode: render pinned review card at the top with:
    - User avatar, username, score badge, review body, `(edited)` marker if `is_edited === true`, and creation date.
    - "Edit Review" button and "Delete" button.
  - If "Edit Review" clicked: toggle composer into edit mode prefilled with current score and text. Primary button displays "Save Changes" (or "Publish"), plus a "Cancel" button.
- **Interactive ReviewSlider (`client/src/components/ui/ReviewSlider.jsx`)**:
  - Track: `relative w-full h-2 bg-[#1C1C1C] rounded-full`.
  - Snapping: Input range with step 1 (values 1–10).
  - Number ticks: 10 numbers `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` rendered under the track with exact mathematical positioning `left: calc(${(i - 1) * 11.11}% - 4px)`.
  - Active score highlighted with `#61F1AC`.
- **Review Content Truncation**:
  - Clamp review body to `line-clamp-2`.
  - Calculate or check if text exceeds 120 characters / 2 lines; show "Read more" / "Show less" button.
- **Provider Reviews vs Community Reviews**:
  - If `rev.source !== "community"`: hide ThumbsUp/Like, Reply, and 3-dots actions.
  - If `rev.source === "community"`: show ThumbsUp with persistent like toggle, Reply button, and 3-dots menu with "Report Review".

### 4.3 User Avatar & Profile Integration
- **`AuthContext.jsx`**:
  - Load user profile on authentication via `/api/profiles/:id`.
  - Provide `userProfile` state and `refreshProfile` function in context.
- **`Navbar.jsx`**:
  - Replace hardcoded image with `userProfile?.profile_url || user?.user_metadata?.avatar_url`.
  - Add image error handler falling back to default avatar.
- **Review Avatars**:
  - Pass authenticated user's profile avatar to the review composer.

### 4.4 Dashboard Page (`client/src/pages/DashboardPage.jsx`)
- **Hero & Metrics**:
  - Header: "Dashboard" with user welcome greeting.
  - 3 KPI cards:
    - Total Reviews Written
    - Total Liked Reviews
    - Total Reports (with status indicator)
- **Tab Navigation**:
  - `My Reviews`
  - `My Likes`
  - `Reports`
  - `Moderation Queue` (conditional if `userRole === 'admin' || userRole === 'moderator'`)
- **My Reviews Panel**:
  - List of user reviews with media poster, title, rating score ring/badge, body text, `is_edited` badge, date, and "Edit" / "Delete" actions.
- **My Likes Panel**:
  - List of liked reviews with author avatar, media item title link, rating, and "Unlike" action.
- **Reports Panel**:
  - List of user submitted reports with target type, reason, date, and status chips:
    - Pending (amber)
    - In Review (blue)
    - Resolved (mint)
    - Dismissed (zinc)
- **Moderation Queue Panel**:
  - Actionable table/card list of all reports with reporter name, reason, target ID, and quick status switcher with moderator notes modal.

---

## 5. Non-Functional & Code Constraints

- **Never add comments to code**.
- **Trailing whitespace on wrapped lines**: if a line ends with `;` `,` `'` `"` `(` `{` `[` `|` `:` `-` `+` `=` `?` `*` `&` `%` or any letter because the statement breaks across lines, append one space at end of that line. Applies inside JSX too (lines ending `}` or `"` in a multi-line element).
- **Blank lines get indentation whitespace** matching surrounding block depth.
- **Never strip trailing whitespace or "clean up" padded blank lines in user's files**.
