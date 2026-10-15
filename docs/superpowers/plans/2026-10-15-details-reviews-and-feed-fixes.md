# Details UI Unification, Review Pagination, Episodes Fixes & Feed Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify SeriesDetailsPage with MovieDetailsPage design for the 2 circular rating rings and the Reviews tab using shared components; fix provider review pagination so "Load more reviews" fetches all available reviews; connect real episode ratings and metadata in the Episodes tab; optimize Feed page loading performance and incorporate Orgi's own community reviews into the feed.

**Architecture:** 
- Extract reusable `DetailScoreRings` primitive and `MediaReviewsTab` feature component so MovieDetailsPage and SeriesDetailsPage share the exact same UI, rating calculations, review posting/editing/deleting, likes, replies, and reporting flows.
- Add TMDB reviews pagination endpoints (`/api/tmdb/movie/:id/reviews` and `/api/tmdb/tv/:id/reviews`) on the server with caching, and integrate on-demand pagination into `MediaReviewsTab` so users can load all reviews across multiple pages.
- Correct TMDB season episodes data mapping to preserve `vote_count`, `vote_average`, `air_date`, `runtime`, and `still_path`, eliminating hardcoded placeholder text in `EpisodeSSection`.
- Optimize TMDB review candidate fetching with a focused high-density candidate pool and persistent caching; introduce `orgiReviewService` to query Supabase `reviews` table and interleave Orgi community reviews directly into the Feed page.

**Tech Stack:** React, Tailwind CSS, Lucide Icons, Express, TMDB API v3, Supabase PostgreSQL.

**Spec:** User prompt requirements (UI divergence fix, review pagination fix, episodes tab real data, feed performance optimization, Orgi latest reviews feed integration).

## Global Constraints
- Strictly adhere to user coding rules: NEVER ADD COMMENTS TO CODE.
- Lines ending with `;`, `,`, `'`, `"`, `(`, `{`, `[`, `|`, `:`, `-`, `+`, `=`, `?`, `*`, `&`, `%` breaking across lines MUST have trailing whitespace.
- Blank lines MUST have indentation whitespace matching surrounding block depth.
- No placeholders or stub code.

---

### Task 1: Create Shared DetailScoreRings Component

**Files:**
- Create: `client/src/components/ui/DetailScoreRings.jsx`
- Modify: `client/src/pages/MovieDetailsPage.jsx`
- Modify: `client/src/pages/SeriesDetailsPage.jsx`

**Interfaces:**
- Consumes: `ScoreRing` (`client/src/components/ui/ScoreRing.jsx`)
- Produces: `DetailScoreRings` component taking `{ blendedScore, totalVotesLabel, communityScore, communityVotesLabel }`

- [ ] **Step 1: Create DetailScoreRings.jsx**

Implement `client/src/components/ui/DetailScoreRings.jsx` rendering the primary large score ring, the 1px vertical separator, and the inline community score ring:

```jsx
import React from "react"; 
import { ScoreRing } from "./ScoreRing"; 

export function DetailScoreRings({ 
  blendedScore, 
  totalVotesLabel, 
  communityScore, 
  communityVotesLabel, 
}) { 
  return ( 
    <div className="flex items-center gap-8 mb-8"> 
      <ScoreRing 
        score={blendedScore} 
        label={totalVotesLabel} 
        size="lg" 
      /> 
 
      <div className="w-[1px] h-12 bg-[#1C1C1C]" /> 
 
      <ScoreRing 
        score={communityScore} 
        label={communityVotesLabel} 
        size="sm" 
        variant="inline" 
      /> 
    </div> 
  ); 
} 
```

- [ ] **Step 2: Update MovieDetailsPage.jsx to use DetailScoreRings**

Import `DetailScoreRings` in `client/src/pages/MovieDetailsPage.jsx` and replace the inline ScoreRing block with:
```jsx
<DetailScoreRings 
  blendedScore={blendedScore} 
  totalVotesLabel={totalVotesLabel} 
  communityScore={communityScore !== null ? communityScore : movieData.communityRating} 
  communityVotesLabel={communityVotesCount > 0 ? `${communityVotesCount} Orgi votes` : movieData.communityVotes} 
/> 
```

- [ ] **Step 3: Update SeriesDetailsPage.jsx to use DetailScoreRings**

Import `DetailScoreRings` in `client/src/pages/SeriesDetailsPage.jsx` and calculate `blendedScore`, `totalVotesLabel`, `communityScore`, and `communityVotesLabel`, replacing the broken divergent score rings.

---

### Task 2: Create Shared MediaReviewsTab Component

**Files:**
- Create: `client/src/components/reviews/MediaReviewsTab.jsx`
- Modify: `client/src/pages/MovieDetailsPage.jsx`
- Modify: `client/src/pages/SeriesDetailsPage.jsx`

**Interfaces:**
- Consumes: `ReviewSlider`, `Button`, `Star`, `ThumbsUp`, `Reply`, `MoreHorizontal`, `ChevronDown`, `api`
- Produces: `MediaReviewsTab` taking `{ mediaId, mediaType, mediaTitle, coverUrl, provider, providerRating, providerVotes, initialProviderReviews }`

- [ ] **Step 1: Create MediaReviewsTab.jsx**

Create `client/src/components/reviews/MediaReviewsTab.jsx` containing:
- Avatar helper with fallback
- Date formatter
- Fetching community reviews for `provider` and `mediaId`
- Review posting and editing with `ReviewSlider`
- Review deletion
- Like toggling with API persistence
- Reply posting, expandable replies list
- Report modal integration
- Filter tabs: All, Community (Ours), Provider / TMDB
- Sorting dropdown: Top, Newest, Highest Rated, Lowest Rated
- "Load more reviews" pagination button connected to provider review fetching

- [ ] **Step 2: Replace Reviews Tab in MovieDetailsPage.jsx with MediaReviewsTab**

In `client/src/pages/MovieDetailsPage.jsx`, replace the 400-line inline reviews section with `<MediaReviewsTab ... />`.

- [ ] **Step 3: Replace Reviews Tab in SeriesDetailsPage.jsx with MediaReviewsTab**

In `client/src/pages/SeriesDetailsPage.jsx`, replace the mock reviews section with `<MediaReviewsTab ... />`, giving Series full review functionality, community reviews, ratings, likes, replies, and reports.

---

### Task 3: Backend & Client TMDB Review Pagination API

**Files:**
- Modify: `server/src/routes/tmdbRoutes.js`
- Modify: `client/src/services/tmdb.js`
- Modify: `client/src/components/reviews/MediaReviewsTab.jsx`

**Interfaces:**
- Produces:
  - `GET /api/tmdb/movie/:id/reviews?page=N`
  - `GET /api/tmdb/tv/:id/reviews?page=N`
  - `getMovieReviews(movieId, page)`
  - `getSeriesReviews(seriesId, page)`

- [ ] **Step 1: Add movie and tv review routes in tmdbRoutes.js**

In `server/src/routes/tmdbRoutes.js`, add:
```javascript
router.get("/movie/:id/reviews", async (req, res, next) => { 
  try { 
    const { id } = req.params; 
    const { page = 1 } = req.query; 
    const cacheKey = `tmdb:movie:${id}:reviews:${page}`; 
    const data = await getOrSetCache(cacheKey, 3600, () => 
      fetchTmdbApi(`/movie/${id}/reviews`, { page }) 
    ); 
    res.json({ success: true, data }); 
  } catch (err) { 
    next(err); 
  } 
}); 

router.get("/tv/:id/reviews", async (req, res, next) => { 
  try { 
    const { id } = req.params; 
    const { page = 1 } = req.query; 
    const cacheKey = `tmdb:tv:${id}:reviews:${page}`; 
    const data = await getOrSetCache(cacheKey, 3600, () => 
      fetchTmdbApi(`/tv/${id}/reviews`, { page }) 
    ); 
    res.json({ success: true, data }); 
  } catch (err) { 
    next(err); 
  } 
}); 
```

- [ ] **Step 2: Update tmdb.js to stop discarding reviews and add pagination helpers**

In `client/src/services/tmdb.js`:
- In `getMovieDetails` and `getSeriesDetails`: remove `.slice(0, 6)` on reviews so all reviews returned by TMDB on page 1 are preserved.
- Export `getMovieReviews(movieId, page = 1)` and `getSeriesReviews(seriesId, page = 1)`.

- [ ] **Step 3: Connect Load More Reviews in MediaReviewsTab.jsx**

In `MediaReviewsTab.jsx`, implement `handleLoadMoreReviews`:
When visible items reach the end of the current reviews pool, if more pages exist (`providerPage < totalProviderPages`), fetch the next page via `getMovieReviews` or `getSeriesReviews`, append new items to the pool, and increment `visibleReviews`.

---

### Task 4: Fix Episodes Tab Hardcoded Data & Rating Mapping

**Files:**
- Modify: `client/src/services/tmdb.js`
- Modify: `client/src/components/ui/EpisodeSSection.jsx`
- Modify: `client/src/pages/SeriesDetailsPage.jsx`

**Interfaces:**
- Produces: Complete episode data mapping including `vote_count`, `vote_average`, `air_date`, `runtime`, and `still_path`.

- [ ] **Step 1: Fix getSeasonEpisodes in tmdb.js**

Ensure `getSeasonEpisodes` maps all fields from TMDB:
```javascript
export async function getSeasonEpisodes(seriesId, seasonNumber = 1) { 
  if (!seriesId) { 
    throw new Error("Series ID is missing."); 
  } 

  const data = await fetchFromApi( 
    `/tv/${seriesId}/season/${seasonNumber}`, 
    `/tv/${seriesId}/season/${seasonNumber}`, 
    { language: "en-US" } 
  ); 

  return (data.episodes || []).map((ep, idx) => ({ 
    id: ep.id, 
    number: String(ep.episode_number).padStart(2, "0"), 
    episodeNumber: ep.episode_number, 
    episode_number: ep.episode_number, 
    title: ep.name || `Episode ${ep.episode_number}`, 
    name: ep.name || `Episode ${ep.episode_number}`, 
    description: ep.overview || "No overview provided for this episode.", 
    overview: ep.overview || "No overview provided for this episode.", 
    runtime: ep.runtime ?? null, 
    score: ep.vote_average ? ep.vote_average.toFixed(1) : "—", 
    vote_average: ep.vote_average ?? 0, 
    vote_count: ep.vote_count ?? 0, 
    air_date: ep.air_date ?? "", 
    still_path: ep.still_path ?? null, 
    thumbnail: getTmdbImageUrl(ep.still_path, "w342"), 
    isHovered: idx === 0 
  })); 
} 
```

- [ ] **Step 2: Update EpisodeSSection.jsx**

In `client/src/components/ui/EpisodeSSection.jsx`:
- Accept `seriesData` prop from `SeriesDetailsPage`.
- Update state mapping in `loadSeason` to preserve `vote_count`, `vote_average`, `air_date`, `still_path`, and `runtime`.
- In `seasonAverage`, check `episode.vote_count > 0 || episode.vote_average > 0`.
- In the featured episode container, ensure `selectedEpisode.air_date`, `selectedEpisode.vote_count`, `selectedEpisode.runtime`, and `series.genres` display real TMDB values.
- Pass `seriesData={seriesData}` in `client/src/pages/SeriesDetailsPage.jsx`.

---

### Task 5: Feed Performance Optimization & Orgi Latest Reviews Integration

**Files:**
- Create: `server/src/services/reviews/orgiReviewService.js`
- Modify: `server/src/services/reviews/tmdbReviewService.js`
- Modify: `server/src/services/reviews/index.js`
- Modify: `client/src/components/reviews/ReviewCard.jsx`
- Modify: `client/src/components/reviews/ReviewDetailModal.jsx`

**Interfaces:**
- Produces:
  - `getOrgiReviewCards({ category, limit })`
  - Integrated feed combining Orgi community reviews + TMDB reviews
  - Fast-loading candidate pool with persistent cache

- [ ] **Step 1: Create orgiReviewService.js**

Create `server/src/services/reviews/orgiReviewService.js` querying Supabase `reviews` (joined with `items`, `users`, and `review_likes`) and converting them into standard `ReviewCardItem` objects with `source: "orgi"`.

- [ ] **Step 2: Streamline tmdbReviewService.js candidate fetching and caching**

In `server/src/services/reviews/tmdbReviewService.js`:
- Refine `fetchTmdbCandidates` to focus on top trending and popular titles (~25-30 candidates instead of 100+).
- Increase `tmdbReviewCardsCache` duration to 1 hour.
- Ensure `getTmdbFeaturedReview` resolves quickly without redundant network calls.

- [ ] **Step 3: Integrate Orgi reviews into queryReviews in index.js**

In `server/src/services/reviews/index.js`:
- Import `getOrgiReviewCards` and combine them with provider cards in `getItemsForCategory`.
- In `getReviewDetail`, handle `source === "orgi"` by querying Supabase for the specific review and item details.

- [ ] **Step 4: Update ReviewCard.jsx and ReviewDetailModal.jsx for Orgi reviews**

In `client/src/components/reviews/ReviewCard.jsx`:
- Show the mint "Orgi" badge when `item.source === "orgi"`.
- Ensure clicks on Orgi cards navigate to the media item or open the detail modal.
In `client/src/components/reviews/ReviewDetailModal.jsx`:
- Ensure `mediaRoute` properly routes to `/movie/:id` or `/series/:id` for Orgi reviews.

---

### Task 6: End-to-End Verification

- [ ] **Step 1: Verify Movie and Series detail pages in browser**
Check that MovieDetailsPage and SeriesDetailsPage have identical 2 circles rating design and identical Reviews tab.
- [ ] **Step 2: Verify "Load more reviews" functionality**
Click "Load more reviews" multiple times and confirm additional reviews are fetched and rendered.
- [ ] **Step 3: Verify Series Episodes tab**
Confirm that the season average rating, episode vote count, and featured episode container are populated with real TMDB data.
- [ ] **Step 4: Verify Feed page performance and Orgi reviews**
Confirm that `/feed` loads quickly and displays both latest Orgi reviews and provider reviews.
