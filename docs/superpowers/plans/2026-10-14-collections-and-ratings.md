# Collections & Rating System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full collections management, a unified reviews/ratings schema with snapping slider, blended score calculation, and merged comments stream with filtering.

**Architecture:** Express backend routes (`/api/collections` and `/api/reviews`) verify authentication tokens via Supabase and perform CRUD on PostgreSQL tables (`items`, `user_collections`, `reviews`). React frontend interacts via `api.js`, providing an immediate toggle on detail pages, combined score ring calculations, and a dedicated collection management page.

**Tech Stack:** React 19, Vite, Tailwind CSS, Express 5, Supabase PostgreSQL, Node.js test runner (`node:test`).

**Spec:** [docs/superpowers/specs/2026-10-14-collections-and-ratings-design.md](file:///d:/ZenzenLife/Projects/Orgi(Forked)/docs/superpowers/specs/2026-10-14-collections-and-ratings-design.md)

## Global Constraints

- Never add comments to code.
- Trailing whitespace on wrapped lines: if a line ends with `;` `,` `'` `"` `(` `{` `[` `|` `:` `-` `+` `=` `?` `*` `&` `%` or any letter because the statement breaks across lines, append one space at end of that line. Applies inside JSX too (lines ending `}` or `"` in a multi-line element).
- Blank lines get indentation whitespace matching surrounding block depth.
- Never strip trailing whitespace or "clean up" padded blank lines in existing files.
- Collection status values must be strictly: `'plan'`, `'progress'`, `'completed'` (default `'plan'`).
- Review scores must be integer values between 1 and 10.

---

### Task 1: Update Database Schema (`server/schema.sql`)

**Files:**
- Modify: `server/schema.sql:31-78`
- Test: `server/test/schema.test.js`

**Interfaces:**
- Produces: Updated `server/schema.sql` with unified `reviews` table, constrained `user_collections`, and updated RLS policies.

- [ ] **Step 1: Write test verifying schema definition contains required tables and constraints**

Create `server/test/schema.test.js`:
```javascript
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("schema.sql defines unified reviews table and 3-status user_collections", () => {
  const schemaPath = path.resolve("schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  assert.match(sql, /CREATE TABLE IF NOT EXISTS reviews/);
  assert.match(sql, /score INTEGER CHECK \(score >= 1 AND score <= 10\)/);
  assert.match(sql, /uq_user_item_top_review/);
  assert.match(sql, /CHECK \(status IN \('plan', 'progress', 'completed'\)\)/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS ratings/);
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS comments/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/schema.test.js` from `server/` directory.  
Expected: FAIL with missing `reviews` table or lingering `ratings`/`comments`.

- [ ] **Step 3: Update `server/schema.sql`**

Replace lines 31–78 in `server/schema.sql`:
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_item_top_review 
ON reviews (user_id, item_id) 
WHERE parent_id IS NULL; 

CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON reviews(item_id); 
CREATE INDEX IF NOT EXISTS idx_reviews_parent_id ON reviews(parent_id); 
CREATE INDEX IF NOT EXISTS idx_user_collections_user_id ON user_collections(user_id); 

CREATE TABLE IF NOT EXISTS reports ( 
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    target_type TEXT NOT NULL CHECK (target_type IN ('item', 'review', 'user')), 
    target_id UUID NOT NULL, 
    reason TEXT NOT NULL, 
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')), 
    moderator_notes TEXT, 
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL, 
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
    resolved_at TIMESTAMPTZ 
); 

ALTER TABLE users ENABLE ROW LEVEL SECURITY; 
ALTER TABLE items ENABLE ROW LEVEL SECURITY; 
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY; 
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY; 
ALTER TABLE reports ENABLE ROW LEVEL SECURITY; 
```

Update RLS policies for reviews:
```sql
CREATE POLICY "Allow public read access to non-deleted reviews" 
ON reviews FOR SELECT 
USING (NOT is_deleted); 

CREATE POLICY "Allow users to insert own reviews" 
ON reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id); 

CREATE POLICY "Allow users to update own reviews" 
ON reviews FOR UPDATE 
USING (auth.uid() = user_id); 

CREATE POLICY "Allow users to delete own reviews" 
ON reviews FOR DELETE 
USING (auth.uid() = user_id); 
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/schema.test.js` from `server/` directory.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/schema.sql server/test/schema.test.js
git commit -m "feat(db): update schema with unified reviews table and collections status"
```

---

### Task 2: Backend Collections Routes & Controller

**Files:**
- Create: `server/src/controllers/collectionController.js`
- Create: `server/src/routes/collectionRoutes.js`
- Modify: `server/index.js`
- Test: `server/test/collectionRoutes.test.js`

**Interfaces:**
- Produces:
  - `GET /api/collections` -> `{ success: true, data: Array<CollectionItem> }`
  - `GET /api/collections/check/:provider/:externalId` -> `{ success: true, data: { inCollection: boolean, status: string | null, itemId: string | null } }`
  - `POST /api/collections/toggle` -> `{ success: true, data: { inCollection: boolean, status: string | null } }`
  - `PATCH /api/collections/:itemId/status` -> `{ success: true, data: { status: string } }`

- [ ] **Step 1: Write failing integration test for collection endpoints**

Create `server/test/collectionRoutes.test.js`:
```javascript
import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import collectionRoutes from "../src/routes/collectionRoutes.js";

test("collectionRoutes has check endpoint mounted", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/collections", collectionRoutes);

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/api/collections/check/tmdb/157336`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(typeof json.data.inCollection, "boolean");
  } finally {
    server.close();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/collectionRoutes.test.js` from `server/` directory.  
Expected: FAIL cannot resolve `collectionRoutes.js`.

- [ ] **Step 3: Implement `collectionController.js` and `collectionRoutes.js`**

Create `server/src/controllers/collectionController.js`:
```javascript
import { supabase } from "../services/supabase.js"; 

export const collectionController = { 
  async getCollection(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { status } = req.query; 

      let query = supabase 
        .from("user_collections") 
        .select(`
          id,
          status,
          created_at,
          updated_at,
          items (
            id,
            external_id,
            provider,
            type,
            title,
            cover_url
          )
        `) 
        .eq("user_id", userId) 
        .order("updated_at", { ascending: false }); 

      if (status && ["plan", "progress", "completed"].includes(status)) { 
        query = query.eq("status", status); 
      } 

      const { data, error } = await query; 
      if (error) throw error; 

      const formatted = (data || []).map((entry) => ({ 
        id: entry.id, 
        status: entry.status, 
        createdAt: entry.created_at, 
        updatedAt: entry.updated_at, 
        itemId: entry.items?.id, 
        externalId: entry.items?.external_id, 
        provider: entry.items?.provider, 
        type: entry.items?.type, 
        title: entry.items?.title, 
        coverUrl: entry.items?.cover_url, 
      })); 

      res.json({ success: true, data: formatted }); 
    } catch (err) { 
      next(err); 
    } 
  }, 

  async checkStatus(req, res, next) { 
    try { 
      const { provider, externalId } = req.params; 
      const authHeader = req.headers.authorization; 
      let userId = null; 

      if (authHeader?.startsWith("Bearer ")) { 
        const token = authHeader.split(" ")[1]; 
        const { data: userData } = await supabase.auth.getUser(token); 
        userId = userData?.user?.id || null; 
      } 

      if (!userId) { 
        return res.json({ 
          success: true, 
          data: { inCollection: false, status: null, itemId: null }  
        }); 
      } 

      const { data: item } = await supabase 
        .from("items") 
        .select("id") 
        .eq("provider", provider) 
        .eq("external_id", String(externalId)) 
        .maybeSingle(); 

      if (!item) { 
        return res.json({ 
          success: true, 
          data: { inCollection: false, status: null, itemId: null }  
        }); 
      } 

      const { data: collectionEntry } = await supabase 
        .from("user_collections") 
        .select("id, status") 
        .eq("user_id", userId) 
        .eq("item_id", item.id) 
        .maybeSingle(); 

      res.json({ 
        success: true, 
        data: { 
          inCollection: !!collectionEntry, 
          status: collectionEntry?.status || null, 
          itemId: item.id, 
        }  
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 

  async toggleItem(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { external_id, provider, type, title, cover_url } = req.body; 

      if (!external_id || !provider || !type || !title) { 
        return res.status(400).json({ 
          error: { message: "Missing required item fields", code: "VALIDATION_ERROR" }  
        }); 
      } 

      let { data: item } = await supabase 
        .from("items") 
        .select("id") 
        .eq("type", type) 
        .eq("provider", provider) 
        .eq("external_id", String(external_id)) 
        .maybeSingle(); 

      if (!item) { 
        const { data: newItem, error: itemError } = await supabase 
          .from("items") 
          .insert({ 
            external_id: String(external_id), 
            provider, 
            type, 
            title, 
            cover_url: cover_url || null, 
          }) 
          .select("id") 
          .single(); 

        if (itemError) throw itemError; 
        item = newItem; 
      } 

      const { data: existingEntry } = await supabase 
        .from("user_collections") 
        .select("id") 
        .eq("user_id", userId) 
        .eq("item_id", item.id) 
        .maybeSingle(); 

      if (existingEntry) { 
        const { error: delError } = await supabase 
          .from("user_collections") 
          .delete() 
          .eq("id", existingEntry.id); 

        if (delError) throw delError; 

        return res.json({ 
          success: true, 
          data: { inCollection: false, status: null, itemId: item.id }  
        }); 
      } 

      const { data: newEntry, error: insertError } = await supabase 
        .from("user_collections") 
        .insert({ 
          user_id: userId, 
          item_id: item.id, 
          status: "plan", 
        }) 
        .select("id, status") 
        .single(); 

      if (insertError) throw insertError; 

      res.json({ 
        success: true, 
        data: { inCollection: true, status: newEntry.status, itemId: item.id }  
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 

  async updateStatus(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { itemId } = req.params; 
      const { status } = req.body; 

      if (!["plan", "progress", "completed"].includes(status)) { 
        return res.status(400).json({ 
          error: { message: "Invalid status value", code: "VALIDATION_ERROR" }  
        }); 
      } 

      const { data, error } = await supabase 
        .from("user_collections") 
        .update({ status, updated_at: new Date().toISOString() }) 
        .eq("user_id", userId) 
        .eq("item_id", itemId) 
        .select() 
        .single(); 

      if (error) throw error; 

      res.json({ success: true, data }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
}; 
```

Create `server/src/routes/collectionRoutes.js`:
```javascript
import express from "express"; 
import { collectionController } from "../controllers/collectionController.js"; 
import { requireAuth } from "../middlewares/authMiddleware.js"; 

const router = express.Router(); 

router.get("/", requireAuth, collectionController.getCollection); 
router.get("/check/:provider/:externalId", collectionController.checkStatus); 
router.post("/toggle", requireAuth, collectionController.toggleItem); 
router.patch("/:itemId/status", requireAuth, collectionController.updateStatus); 

export default router; 
```

Register route in `server/index.js`:
```javascript
import collectionRoutes from "./src/routes/collectionRoutes.js"; 
// ...
app.use("/api/collections", collectionRoutes); 
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/collectionRoutes.test.js` from `server/` directory.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/collectionController.js server/src/routes/collectionRoutes.js server/index.js server/test/collectionRoutes.test.js
git commit -m "feat(api): add collection endpoints for toggle, check, and status update"
```

---

### Task 3: Backend Reviews & Ratings Routes & Controller

**Files:**
- Create: `server/src/controllers/reviewController.js`
- Create: `server/src/routes/reviewRoutes.js`
- Modify: `server/index.js`
- Test: `server/test/reviewRoutes.test.js`

**Interfaces:**
- Produces:
  - `GET /api/reviews/:provider/:externalId` -> `{ success: true, data: { communityAverage: number | null, communityVotes: number, reviews: Array<ReviewItem> } }`
  - `POST /api/reviews` -> `{ success: true, data: ReviewItem }`
  - `DELETE /api/reviews/:id` -> `{ success: true }`

- [ ] **Step 1: Write integration test for review endpoints**

Create `server/test/reviewRoutes.test.js`:
```javascript
import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import reviewRoutes from "../src/routes/reviewRoutes.js";

test("reviewRoutes handles get reviews for unknown item gracefully", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reviews", reviewRoutes);

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/api/reviews/tmdb/99999999`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.communityVotes, 0);
    assert.deepEqual(json.data.reviews, []);
  } finally {
    server.close();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/reviewRoutes.test.js` from `server/` directory.  
Expected: FAIL cannot resolve `reviewRoutes.js`.

- [ ] **Step 3: Implement `reviewController.js` and `reviewRoutes.js`**

Create `server/src/controllers/reviewController.js`:
```javascript
import { supabase } from "../services/supabase.js"; 

export const reviewController = { 
  async getReviews(req, res, next) { 
    try { 
      const { provider, externalId } = req.params; 

      const { data: item } = await supabase 
        .from("items") 
        .select("id") 
        .eq("provider", provider) 
        .eq("external_id", String(externalId)) 
        .maybeSingle(); 

      if (!item) { 
        return res.json({ 
          success: true, 
          data: { 
            communityAverage: null, 
            communityVotes: 0, 
            reviews: [], 
          }  
        }); 
      } 

      const { data: rawReviews, error } = await supabase 
        .from("reviews") 
        .select(`
          id,
          user_id,
          parent_id,
          score,
          content,
          created_at,
          updated_at,
          users (
            id,
            user_name,
            profile_url
          )
        `) 
        .eq("item_id", item.id) 
        .eq("is_deleted", false) 
        .order("created_at", { ascending: false }); 

      if (error) throw error; 

      const topLevel = []; 
      const repliesByParent = {}; 
      let scoreSum = 0; 
      let scoreCount = 0; 

      (rawReviews || []).forEach((rev) => { 
        if (rev.parent_id) { 
          if (!repliesByParent[rev.parent_id]) repliesByParent[rev.parent_id] = []; 
          repliesByParent[rev.parent_id].push({ 
            id: rev.id, 
            userId: rev.user_id, 
            author: rev.users?.user_name || "Unnamed Orgi", 
            avatar: rev.users?.profile_url || "", 
            content: rev.content, 
            time: rev.created_at, 
            source: "community", 
          }); 
        } else { 
          if (typeof rev.score === "number" && rev.score > 0) { 
            scoreSum += rev.score; 
            scoreCount += 1; 
          } 
          topLevel.push(rev); 
        } 
      }); 

      const formattedReviews = topLevel.map((rev) => ({ 
        id: rev.id, 
        userId: rev.user_id, 
        author: rev.users?.user_name || "Unnamed Orgi", 
        avatar: rev.users?.profile_url || "", 
        score: rev.score, 
        content: rev.content, 
        time: rev.created_at, 
        source: "community", 
        likes: 0, 
        repliesCount: (repliesByParent[rev.id] || []).length, 
        replies: repliesByParent[rev.id] || [], 
      })); 

      const communityAverage = scoreCount > 0 ? Number((scoreSum / scoreCount).toFixed(1)) : null; 

      res.json({ 
        success: true, 
        data: { 
          communityAverage, 
          communityVotes: scoreCount, 
          reviews: formattedReviews, 
        }  
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 

  async createReview(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { 
        external_id, 
        provider, 
        type, 
        title, 
        cover_url, 
        score, 
        content, 
        parent_id  
      } = req.body; 

      if (!external_id || !provider || !type || !title) { 
        return res.status(400).json({ 
          error: { message: "Missing item details", code: "VALIDATION_ERROR" }  
        }); 
      } 

      let { data: item } = await supabase 
        .from("items") 
        .select("id") 
        .eq("type", type) 
        .eq("provider", provider) 
        .eq("external_id", String(external_id)) 
        .maybeSingle(); 

      if (!item) { 
        const { data: newItem, error: itemError } = await supabase 
          .from("items") 
          .insert({ 
            external_id: String(external_id), 
            provider, 
            type, 
            title, 
            cover_url: cover_url || null, 
          }) 
          .select("id") 
          .single(); 

        if (itemError) throw itemError; 
        item = newItem; 
      } 

      if (parent_id) { 
        const { data: reply, error: replyError } = await supabase 
          .from("reviews") 
          .insert({ 
            item_id: item.id, 
            user_id: userId, 
            parent_id, 
            content: content || "", 
          }) 
          .select(`
            id,
            user_id,
            parent_id,
            score,
            content,
            created_at,
            users (
              user_name,
              profile_url
            )
          `) 
          .single(); 

        if (replyError) throw replyError; 

        return res.json({ 
          success: true, 
          data: { 
            id: reply.id, 
            userId: reply.user_id, 
            parentId: reply.parent_id, 
            author: reply.users?.user_name || "Unnamed Orgi", 
            avatar: reply.users?.profile_url || "", 
            content: reply.content, 
            time: reply.created_at, 
            source: "community", 
          }  
        }); 
      } 

      const parsedScore = score !== undefined && score !== null ? parseInt(score, 10) : null; 
      if (parsedScore !== null && (parsedScore < 1 || parsedScore > 10)) { 
        return res.status(400).json({ 
          error: { message: "Score must be an integer between 1 and 10", code: "VALIDATION_ERROR" }  
        }); 
      } 

      const { data: existingReview } = await supabase 
        .from("reviews") 
        .select("id") 
        .eq("user_id", userId) 
        .eq("item_id", item.id) 
        .is("parent_id", null) 
        .maybeSingle(); 

      let query; 
      if (existingReview) { 
        query = supabase 
          .from("reviews") 
          .update({ 
            score: parsedScore, 
            content: content || "", 
            updated_at: new Date().toISOString(), 
          }) 
          .eq("id", existingReview.id) 
          .select(`
            id,
            user_id,
            score,
            content,
            created_at,
            updated_at,
            users (
              user_name,
              profile_url
            )
          `) 
          .single(); 
      } else { 
        query = supabase 
          .from("reviews") 
          .insert({ 
            user_id: userId, 
            item_id: item.id, 
            score: parsedScore, 
            content: content || "", 
          }) 
          .select(`
            id,
            user_id,
            score,
            content,
            created_at,
            updated_at,
            users (
              user_name,
              profile_url
            )
          `) 
          .single(); 
      } 

      const { data: reviewRecord, error: reviewError } = await query; 
      if (reviewError) throw reviewError; 

      res.json({ 
        success: true, 
        data: { 
          id: reviewRecord.id, 
          userId: reviewRecord.user_id, 
          author: reviewRecord.users?.user_name || "Unnamed Orgi", 
          avatar: reviewRecord.users?.profile_url || "", 
          score: reviewRecord.score, 
          content: reviewRecord.content, 
          time: reviewRecord.created_at, 
          source: "community", 
          repliesCount: 0, 
          replies: [], 
        }  
      }); 
    } catch (err) { 
      next(err); 
    } 
  }, 

  async deleteReview(req, res, next) { 
    try { 
      const userId = req.user.id; 
      const { id } = req.params; 

      const { error } = await supabase 
        .from("reviews") 
        .update({ is_deleted: true }) 
        .eq("id", id) 
        .eq("user_id", userId); 

      if (error) throw error; 

      res.json({ success: true }); 
    } catch (err) { 
      next(err); 
    } 
  }, 
}; 
```

Create `server/src/routes/reviewRoutes.js`:
```javascript
import express from "express"; 
import { reviewController } from "../controllers/reviewController.js"; 
import { requireAuth } from "../middlewares/authMiddleware.js"; 

const router = express.Router(); 

router.get("/:provider/:externalId", reviewController.getReviews); 
router.post("/", requireAuth, reviewController.createReview); 
router.delete("/:id", requireAuth, reviewController.deleteReview); 

export default router; 
```

Mount route in `server/index.js`:
```javascript
import reviewRoutes from "./src/routes/reviewRoutes.js"; 
// ...
app.use("/api/reviews", reviewRoutes); 
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/reviewRoutes.test.js` from `server/` directory.  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/controllers/reviewController.js server/src/routes/reviewRoutes.js server/index.js server/test/reviewRoutes.test.js
git commit -m "feat(api): add review endpoints for community ratings and threaded reviews"
```

---

### Task 4: Frontend Stepped Snapping Slider Component (`ReviewSlider.jsx`)

**Files:**
- Create: `client/src/components/ui/ReviewSlider.jsx`
- Test: manual / render verification

**Interfaces:**
- Props: `value: number` (1 to 10), `onChange: (val: number) => void`, `disabled?: boolean`

- [ ] **Step 1: Create `client/src/components/ui/ReviewSlider.jsx`**

```jsx
import React from "react"; 
import { Star } from "lucide-react"; 

export function ReviewSlider({ value = 8, onChange, disabled = false }) { 
  const safeVal = Math.max(1, Math.min(10, Number(value) || 1)); 

  return ( 
    <div className="flex flex-col gap-2 w-full max-w-[280px]"> 
      <div className="flex items-center justify-between text-xs"> 
        <span className="text-[#7A7A7A] font-medium tracking-wide uppercase text-[10px]"> 
          Your Score 
        </span> 
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#202020]"> 
          <Star size={11} className="fill-[#61F1AC] text-[#61F1AC]" /> 
          <span className="font-semibold text-[#61F1AC] font-tabular text-xs"> 
            {safeVal} / 10 
          </span> 
        </div> 
      </div> 

      <div className="relative flex items-center"> 
        <input 
          type="range" 
          min="1" 
          max="10" 
          step="1" 
          value={safeVal} 
          disabled={disabled} 
          onChange={(e) => onChange && onChange(parseInt(e.target.value, 10))} 
          className="w-full h-1.5 bg-[#1C1C1C] rounded-lg appearance-none cursor-pointer accent-[#61F1AC] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none" 
        /> 
      </div> 

      <div className="flex justify-between px-0.5 text-[10px] text-[#4A4A4A] font-tabular"> 
        <span>1</span> 
        <span>3</span> 
        <span>5</span> 
        <span>7</span> 
        <span>10</span> 
      </div> 
    </div> 
  ); 
} 
```

- [ ] **Step 2: Run client linter to verify syntax**

Run: `npm run lint` from `client/` directory.  
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ui/ReviewSlider.jsx
git commit -m "feat(ui): add stepped 1-10 review slider component"
```

---

### Task 5: Frontend Collections & Reviews Integration in Detail Pages

**Files:**
- Modify: `client/src/pages/MovieDetailsPage.jsx`
- Modify: `client/src/pages/BreakingBadPage.jsx`

**Interfaces:**
- Detail page integration:
  - Button says "Add to collection" (default) or "In collection" (when collected).
  - Score rings compute blended rating = `((providerRating * providerVotes) + (communityAvg * communityVotes)) / (providerVotes + communityVotes)`.
  - Composer uses `ReviewSlider` snapping 1–10.
  - Review filters: `All`, `Community`, `Provider`.
  - Posting review calls `api.post('/reviews', ...)` and prepends to state.

- [ ] **Step 1: Update `client/src/pages/MovieDetailsPage.jsx`**

1. Import `ReviewSlider` and `api` client and `Check` icon from `lucide-react`.
2. Add state for:
   - `inCollection` (boolean)
   - `collectionLoading` (boolean)
   - `communityData` (`{ communityAverage: null, communityVotes: 0, reviews: [] }`)
   - `reviewFilter` (`'all' | 'community' | 'provider'`)
   - `selectedScore` (default `8`)
   - `isPostingReview` (boolean)
3. Load collection check via `api.get('/collections/check/' + provider + '/' + externalId)`.
4. Load community reviews via `api.get('/reviews/' + provider + '/' + externalId)`.
5. Compute blended rating:
```javascript
const providerScore = parseFloat(movieData.tmdbRating) || 0; 
const providerVotesCount = movieData.tmdbVotes?.includes("K") 
  ? parseFloat(movieData.tmdbVotes) * 1000 
  : parseInt(movieData.tmdbVotes, 10) || 100; 

const communityScore = communityData.communityAverage; 
const communityVotesCount = communityData.communityVotes || 0; 

let blendedScore = providerScore; 
let totalVotesCount = providerVotesCount; 

if (communityScore !== null && communityVotesCount > 0) { 
  blendedScore = Number( 
    ( 
      (providerScore * providerVotesCount + communityScore * communityVotesCount) / 
      (providerVotesCount + communityVotesCount) 
    ).toFixed(1) 
  ); 
  totalVotesCount = providerVotesCount + communityVotesCount; 
} 
```
6. Replace "Add to list" button with "Add to collection" toggle button:
```jsx
<Button 
  variant={inCollection ? "mintGhost" : "outline"} 
  size="md" 
  disabled={collectionLoading} 
  className={`px-5 py-2.5 rounded-[10px] transition-all ${ 
    inCollection ? "border-[#61F1AC]/50 text-[#61F1AC] bg-[#61F1AC]/10" : "" 
  }`} 
  onClick={handleToggleCollection} 
> 
  {inCollection ? <Check size={15} /> : <Plus size={15} />} 
  <span>{inCollection ? "In collection" : "Add to collection"}</span> 
</Button> 
```
7. Replace `StarRating` in composer with `ReviewSlider`.
8. Add filter buttons row (`All`, `Community`, `Provider`) above the review list.
9. Filter reviews based on `reviewFilter` value.
10. Submit review via `api.post('/reviews', ...)` on "Post" click.

- [ ] **Step 2: Update `client/src/pages/BreakingBadPage.jsx` with identical collection toggle, slider, and review filter**

- [ ] **Step 3: Run client linter and verify syntax**

Run: `npm run lint` from `client/` directory.  
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/MovieDetailsPage.jsx client/src/pages/BreakingBadPage.jsx
git commit -m "feat(pages): integrate Add to collection toggle, blended rating, and review slider"
```

---

### Task 6: Frontend Collection Management Page (`client/src/pages/CollectionPage.jsx`)

**Files:**
- Modify: `client/src/pages/CollectionPage.jsx`

**Interfaces:**
- Consumes: `GET /api/collections?status=...`, `PATCH /api/collections/:itemId/status`, `POST /api/collections/toggle`

- [ ] **Step 1: Implement full collection management in `client/src/pages/CollectionPage.jsx`**

Key elements:
1. Status tabs: `All`, `Plan`, `Progress`, `Completed`.
2. Responsive media card grid:
   - 2:3 aspect poster with hover zoom.
   - Media type badge (`MOVIE`, `SERIES`, `BOOK`, etc.).
   - Status badge and status switcher dropdown (`Plan`, `Progress`, `Completed`).
   - Remove button (trash or X) calling toggle to remove from collection.
3. Loading skeleton states while fetching.
4. Empty states when tab has no items, including button linking to movies/search.
5. Error state with retry button.

- [ ] **Step 2: Run client linter and production build check**

Run: `npm run lint` and `npm run build` from `client/` directory.  
Expected: 0 errors, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/CollectionPage.jsx
git commit -m "feat(pages): implement full collection management page with status tabs"
```

---

### Task 7: Full System Verification

**Files:**
- All created and modified files across client and server.

- [ ] **Step 1: Run all server tests**

Run: `npm test` from `server/` directory.  
Expected: All tests pass.

- [ ] **Step 2: Run client lint and build**

Run: `npm run lint` and `npm run build` from `client/` directory.  
Expected: Both pass without errors.

- [ ] **Step 3: Test user flow in browser**

Using browser subagent:
1. Navigate to movie detail page (`/movie/157336`).
2. Verify "Add to collection" button appears instead of "Add to list".
3. Check Score rings show blended rating and community score.
4. Check Reviews tab shows 1–10 slider composer and filter chips (`All`, `Community`, `Provider`).
5. Navigate to `/collection` and verify status tabs (`All`, `Plan`, `Progress`, `Completed`) render cleanly.
