# Dashboard, Reviews, and Collections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Collection Page toolbar redesign (Status, Filter, Sort pills), Detail Page review overhaul (pinned user review with edit mode, `is_edited` tracking, snapping 1–10 slider, avatar fallback, 2-line truncation, provider action removal), and a full User Dashboard page for managing reviews, likes, and reports.

**Architecture:** Express backend routes handle persistent review likes (`review_likes`), reports lifecycle (`reports`), review edit tracking (`is_edited`), and dashboard aggregated summary. React frontend uses Tailwind CSS and Lucide icons to deliver responsive pill dropdowns, smooth snapping sliders, resilient image fallbacks, and a multi-tabbed dashboard with moderation capabilities.

**Tech Stack:** React 19, Vite, Tailwind CSS, Express 5, Supabase PostgreSQL, Node.js test runner (`node:test`).

**Spec:** [docs/superpowers/specs/2026-10-14-dashboard-reviews-and-collections-design.md](file:///d:/ZenzenLife/Projects/Orgi(Forked)/docs/superpowers/specs/2026-10-14-dashboard-reviews-and-collections-design.md)

## Global Constraints

- Never add comments to code.
- Trailing whitespace on wrapped lines: if a line ends with `;` `,` `'` `"` `(` `{` `[` `|` `:` `-` `+` `=` `?` `*` `&` `%` or any letter because the statement breaks across lines, append one space at end of that line. Applies inside JSX too (lines ending `}` or `"` in a multi-line element).
- Blank lines get indentation whitespace matching surrounding block depth.
- Never strip trailing whitespace or "clean up" padded blank lines in existing files.
- Collection status values must be strictly: `'plan'`, `'progress'`, `'completed'`.
- Review scores must be integer values between 1 and 10.

---

### Task 1: Database Schema & Backend Likes, Reports, and Dashboard APIs

**Files:**
- Modify: `server/schema.sql`
- Modify: `server/src/controllers/reviewController.js`
- Modify: `server/src/routes/reviewRoutes.js`
- Create: `server/src/controllers/reportController.js`
- Create: `server/src/routes/reportRoutes.js`
- Create: `server/src/controllers/dashboardController.js`
- Create: `server/src/routes/dashboardRoutes.js`
- Modify: `server/index.js`
- Test: `server/test/dashboardAndReports.test.js`

**Interfaces:**
- Produces:
  - `POST /api/reviews/:id/like` -> `{ success: true, data: { liked: boolean, likesCount: number } }`
  - `GET /api/reviews/user/my` -> `{ success: true, data: Array<Review> }`
  - `GET /api/reviews/user/likes` -> `{ success: true, data: Array<Review> }`
  - `POST /api/reports` -> `{ success: true, data: Report }`
  - `GET /api/reports/my` -> `{ success: true, data: Array<Report> }`
  - `GET /api/reports/all` -> `{ success: true, data: Array<Report> }`
  - `PATCH /api/reports/:id` -> `{ success: true, data: Report }`
  - `GET /api/dashboard/summary` -> `{ success: true, data: { stats, userRole, recentReviews, recentLikes, recentReports } }`

- [x] **Step 1: Write test for dashboard summary and report routes**

Create `server/test/dashboardAndReports.test.js`:
```javascript
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("schema.sql contains review_likes and is_edited column", () => {
  const schemaPath = path.resolve("schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  assert.match(sql, /CREATE TABLE IF NOT EXISTS review_likes/);
  assert.match(sql, /is_edited/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS reports/);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `node --test test/dashboardAndReports.test.js` from `server/` directory.  
Expected: FAIL due to missing `review_likes` or `is_edited` in `schema.sql`.

- [x] **Step 3: Update `server/schema.sql`**

Update `server/schema.sql`:
Add `is_edited BOOLEAN NOT NULL DEFAULT false` to the `reviews` table definition, and add `review_likes` table with indexes and RLS policies:
```sql
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false; 

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

- [x] **Step 4: Update `server/src/controllers/reviewController.js`**

Implement:
1. In `createReview`: when updating an `existingReview`, set `is_edited: true` and `updated_at: new Date().toISOString()`.
2. Add `toggleLike(req, res, next)`:
   - Check if row exists in `review_likes` for `req.user.id` and `req.params.id`.
   - If exists, delete and decrement; if not, insert and increment.
   - Return `{ success: true, data: { liked: boolean, likesCount: number } }`.
3. Add `getMyReviews(req, res, next)`:
   - Select reviews where `user_id = req.user.id` and `parent_id IS NULL` and `is_deleted = false`, joining `items (*)` ordered by `created_at DESC`.
4. Add `getMyLikes(req, res, next)`:
   - Select `review_likes` for `user_id = req.user.id`, joining `reviews (*, items(*), users(user_name, profile_url))`.
5. In `getReviews`:
   - Join `review_likes (id, user_id)` to count actual likes on community reviews and check if the current user (via optional auth token) has liked it.

- [x] **Step 5: Create `server/src/controllers/reportController.js` and `server/src/routes/reportRoutes.js`**

Create `server/src/controllers/reportController.js`:
- `createReport`: inserts into `reports` with `reporter_id: req.user.id`, `target_type`, `target_id`, `reason`.
- `getMyReports`: queries `reports` where `reporter_id = req.user.id` ordered by `created_at DESC`.
- `getAllReports`: checks if `req.user` role is `admin` or `moderator`; returns all reports with user details.
- `updateReportStatus`: checks role; updates status (`resolved`, `dismissed`, `in_review`) and `moderator_notes`.

Create `server/src/routes/reportRoutes.js`:
- Mount routes with `requireAuth`.

- [x] **Step 6: Create `server/src/controllers/dashboardController.js` and `server/src/routes/dashboardRoutes.js`**

Create `server/src/controllers/dashboardController.js`:
- `getSummary`: queries counts for user's reviews, user's likes, and user's reports; gets user's role from `users` table; returns `{ stats: { reviewCount, likeCount, reportCount }, userRole, recentReviews, recentLikes, recentReports }`.

Create `server/src/routes/dashboardRoutes.js`:
- Mount `GET /summary` with `requireAuth`.

- [x] **Step 7: Mount routes in `server/index.js`**

Mount `/api/reports` and `/api/dashboard`.

- [x] **Step 8: Run tests and verify they pass**

Run: `node --test test/dashboardAndReports.test.js` from `server/` directory.  
Expected: PASS.

- [x] **Step 9: Commit**

```bash
git add server/schema.sql server/src/ server/index.js server/test/
git commit -m "feat(server): add review likes, reports, and dashboard APIs"
```

---

### Task 2: Collection Page Toolbar, Status & Type Filters, Sorting

**Files:**
- Modify: `client/src/pages/CollectionPage.jsx`

**Interfaces:**
- Consumes: `/api/collections` (list of user collection items)
- State:
  - `statusFilter`: `'all' | 'plan' | 'progress' | 'completed'`
  - `typeFilter`: `'all' | 'movie' | 'series' | 'book' | 'manga' | 'manhwa'`
  - `sortBy`: `'recent' | 'title_asc' | 'title_desc'`

- [x] **Step 1: Replace horizontal status tabs in `CollectionPage.jsx` with dropdown toolbar**

1. Create dropdown state: `statusOpen`, `typeOpen`, `sortOpen`.
2. Add Status dropdown pill with options: `All`, `Plan`, `Progress`, `Completed`.
3. Add Media Type filter pill with options: `All`, `Movies`, `Series`, `Books`, `Manga`, `Manhwa`.
4. Add Sort pill with options: `Recently Added`, `Title (A–Z)`, `Title (Z–A)`.
5. Add Reset button when filters are non-default.
6. Compute `filteredItems` applying status, media type, and sort comparison.
7. Use styling matching `ManhwaPage.jsx` pill dropdowns with clean borders, active states, and chevrons.

- [x] **Step 2: Verify in browser**

Verify filters change items instantly, count numbers reflect filtered states, and status changes continue to work.

- [x] **Step 3: Commit**

```bash
git add client/src/pages/CollectionPage.jsx
git commit -m "feat(client): implement books-style filter and sort toolbar in CollectionPage"
```

---

### Task 3: Dynamic User Avatar & Profile in AuthContext and Navbar

**Files:**
- Modify: `client/src/context/AuthContext.jsx`
- Modify: `client/src/components/layout/Navbar.jsx`
- Modify: `client/src/pages/MovieDetailsPage.jsx`

**Interfaces:**
- `useAuth()` provides `{ session, user, userProfile, refreshProfile, logout }`.
- Default fallback avatar constant: `"https://i.pinimg.com/736x/2e/e4/25/2ee425db685b15db57175a0840e931b1.jpg"`.

- [x] **Step 1: Update `AuthContext.jsx` to load and provide `userProfile`**

1. Add `userProfile` state.
2. In `useEffect`, if `session?.user?.id`, call `/api/profile/${session.user.id}` via `api.get` and set `userProfile`.
3. Expose `userProfile` and `refreshProfile` in context value.

- [x] **Step 2: Update `Navbar.jsx` with dynamic avatar and fallback**

1. Use `userProfile?.profile_url || user?.user_metadata?.avatar_url || DEFAULT_AVATAR`.
2. Add `onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}` to image.

- [x] **Step 3: Update `MovieDetailsPage.jsx` composer with dynamic avatar**

1. Use `userProfile?.profile_url || DEFAULT_AVATAR` for the review composer avatar.

- [x] **Step 4: Commit**

```bash
git add client/src/context/AuthContext.jsx client/src/components/layout/Navbar.jsx client/src/pages/MovieDetailsPage.jsx
git commit -m "feat(client): integrate dynamic user profile avatar with fallback"
```

---

### Task 4: Detail Page Review & Rating Experience

**Files:**
- Modify: `client/src/components/ui/ReviewSlider.jsx`
- Modify: `client/src/pages/MovieDetailsPage.jsx`

**Interfaces:**
- `ReviewSlider`: props `{ value: number, onChange: (n: number) => void, disabled?: boolean }`
- Review Item: `{ id, userId, author, avatar, score, content, time, source, likes, isLiked, is_edited }`

- [x] **Step 1: Overhaul `ReviewSlider.jsx` with snapping 1–10 track and aligned numbers**

1. Render range input with `min="1" max="10" step="1"`.
2. Below track, render numbers 1 through 10 positioned with precise tick calculations:
   ```jsx
   <div className="relative w-full h-4 mt-1.5 select-none pointer-events-none">
     {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
       const pct = ((num - 1) / 9) * 100;
       return (
         <span
           key={num}
           style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
           className={`absolute text-[10px] font-tabular transition-colors ${
             safeVal === num ? "text-[#61F1AC] font-bold" : "text-[#555555]"
           }`}
         >
           {num}
         </span>
       );
     })}
   </div>
   ```
3. Add smooth track styling and instant snap feedback.

- [x] **Step 2: Implement Pinned User Review Card and Edit Mode in `MovieDetailsPage.jsx`**

1. Identify user review: `myReview = communityData.reviews.find((r) => r.userId === user?.id)`.
2. If `myReview` exists and `!isEditing`:
   - Render a distinct pinned card above the review stream labeled "Your Review" with rating badge, content, `(edited)` indicator if `myReview.is_edited`, and "Edit Review" button.
3. If user clicks "Edit Review":
   - Set `isEditing = true`, populate composer with `myReview.content` and `myReview.score`.
   - Composer buttons: "Save Changes" (calls `handlePostReview`) and "Cancel".
4. After saving, reset `isEditing = false` and update community data.

- [x] **Step 3: Implement 2-Line Text Truncation with Expand/Collapse**

1. Add state `expandedReviewIds` set/object.
2. For each review, render text with `className={isExpanded ? "" : "line-clamp-2"}`.
3. If review content length > 120 or exceeds 2 lines, show inline text button "Read more" / "Show less".

- [x] **Step 4: Remove like, reply, and 3-dots on provider reviews**

1. In review rendering loop, check `rev.source === "community"`.
2. If `rev.source !== "community"`, omit the action buttons row (ThumbsUp, Reply, MoreHorizontal).
3. If `rev.source === "community"`, render Like button connected to `/api/reviews/:id/like`, Reply button, and 3-dots with Report Review action.

- [x] **Step 5: Verify in browser**

Test leaving a review, editing it, saving it, observing `(edited)` flag, snapping slider, expanding truncated reviews, and verifying provider reviews have no action buttons.

- [x] **Step 6: Commit**

```bash
git add client/src/components/ui/ReviewSlider.jsx client/src/pages/MovieDetailsPage.jsx
git commit -m "feat(client): implement pinned user review, edit mode, snapping slider, and provider action filter"
```

---

### Task 5: User Dashboard Page (`/dashboard`)

**Files:**
- Modify: `client/src/pages/DashboardPage.jsx`
- Test: manual & browser verification

**Interfaces:**
- Consumes:
  - `GET /api/dashboard/summary`
  - `PATCH /api/reports/:id` (moderators)
  - `DELETE /api/reviews/:id`
  - `POST /api/reviews/:id/like`

- [x] **Step 1: Implement Dashboard UI Structure in `DashboardPage.jsx`**

1. Authentication gate: if not signed in, show clean sign-in prompt.
2. Fetch summary from `/api/dashboard/summary`.
3. Render Hero with greeting and 3 KPI stat cards:
   - Total Reviews Written
   - Liked Reviews
   - Reports (active count)
4. Render Tabs:
   - `My Reviews`
   - `My Likes`
   - `Reports`
   - `Moderation Queue` (conditionally visible if `userRole === 'admin' || userRole === 'moderator'`)

- [x] **Step 2: Implement "My Reviews" Tab**

1. Render grid/list of user's reviews.
2. Show media cover thumbnail, title, media type badge, star score, content, `(edited)` tag, and date.
3. Add "Edit" button (opens inline edit modal/drawer) and "Delete" button (calls `/api/reviews/:id`).

- [x] **Step 3: Implement "My Likes" Tab**

1. Render list of liked reviews with media item link, author avatar, score, and content.
2. Add "Unlike" button that calls `/api/reviews/:id/like` and removes from list.

- [x] **Step 4: Implement "Reports" Tab**

1. Render user's submitted reports with target type, reason, date, and status badges (`Pending`, `In Review`, `Resolved`, `Dismissed`).

- [x] **Step 5: Implement "Moderation Queue" Tab**

1. For moderators/admins: display all community reports.
2. Allow changing status to `resolved` or `dismissed` with notes modal.

- [x] **Step 6: Verify in browser**

Navigate to `/dashboard`, test tab switching, review deletion/editing, unliking, and viewing reports.

- [x] **Step 7: Commit**

```bash
git add client/src/pages/DashboardPage.jsx
git commit -m "feat(client): implement complete User Dashboard with reviews, likes, and moderation tabs"
```

---

## Plan Self-Review Checklist

- **Spec Coverage:**
  - Collection Page toolbar with Status, Type, and Sort pills (Task 2)
  - Pinned user review + Edit mode + `is_edited` tracking (Task 1 & Task 4)
  - Snapping 1–10 slider with aligned numerical step labels (Task 4)
  - User avatar dynamic resolution and image fallback (Task 3)
  - 2-line text truncation with toggle (Task 4)
  - Provider reviews action button removal (Task 4)
  - User Dashboard for likes, reviews, and reports (Task 1 & Task 5)
- **Constraint Compliance:**
  - Zero comments in code
  - Trailing whitespace on wrapped lines
  - Indented blank lines matching block depth
