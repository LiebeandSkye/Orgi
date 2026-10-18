# Orgi Picks: Personalized Recommendation System Design Document

**Date:** 2026-10-18  
**Status:** Approved  
**Topic:** Orgi Picks 3-Step Psychological Recommendation Wizard, Algorithmic Filtering, and In-Place Quick Summary Pop-up  

---

## 1. Overview & Goals

When users finish a workday, decision fatigue makes endless browsing daunting. **Orgi Picks** transforms discovery from aimless scrolling into a guided, comforting, and high-agency experience:
1. **Psychological Flow**: 3 progressive stages with the **Endowed Progress Effect** (progress bar starts at **20%** rather than 0% so users feel immediate momentum).
2. **Accessible Entry Points**:
   - A shiny, standout **"Orgi Picks"** button beside the search bar on desktop, and directly below on mobile.
   - A persistent floating action button (FAB) at `bottom-6 right-6` on Movie and Book browsing pages.
3. **Pure Algorithmic Filtering**: Fast, zero-token client/server querying leveraging TMDB Discover and MangaDex tags, picking 3 randomized candidates from high-relevance filtered pools.
4. **In-Place Quick Summary Modal**: Clicking any recommended card opens a full modal overlay of that item's details (synopsis, score rings, trailer player, and collection toggle) without navigating away or losing session results.
5. **Collection Bookmark**: Quick "Add to collection" button directly on each recommendation card.

---

## 2. User Experience & 3-Step Wizard Flow

### Step 1: Choose Medium (`1 / 3`)
- **Title**: *"What do you want to watch or read?"*
- **Description**: *"Select the type of content you're in the mood for. We'll tailor your next steps based on your choice."*
- **Primary Selector Cards**:
  - `Movie` (Films, anime movies, and more)
  - `Book` (Novels, manga, manhwa, manhua)
- **Sub-Medium Chips**:
  - For Movie: `Movie` · `Series / TV` · `Anime`
  - For Book: `Manga` · `Manhwa` · `Manhua` · `Novel / Book`
- **Interactive Preview**:
  - Right-hand side carousel/card showing key visual art for the active medium.
  - Action button: **"Next →"** (advances to Step 2).

---

### Step 2: Psychological Preference Questionnaire (`2 / 3`)
- **Progress Bar**: Starts visibly at **20%** upon entry to Step 2, advancing smoothly to **60%** as answers are toggled.
- **Micro-Questions** (designed for zero cognitive friction, single/multi-tap):
  1. **What should it feel like? (Mood & Atmosphere)**:
     - Multi-select pill buttons:
       - `Relaxed`
       - `Exciting`
       - `Thought-provoking`
       - `Emotional`
       - `Funny`
       - `Dark & Intense`
       - `Feel-good`
  2. **Who's watching / reading? (Social Context)**:
     - Single-select cards with icons:
       - `Just me`
       - `With a partner`
       - `With friends`
       - `With family`
  3. **How much time do you have? (Pacing & Duration)**:
     - Segmented options:
       - `Under 90 min` (quick, breezy watch)
       - `90–120 min` (standard feature length)
       - `2+ hours` (immersive, epic experience)
       - `A few episodes / chapters` (episodic binge)
  4. **What kind of experience do you want? (Story Depth)**:
     - Descriptive cards:
       - `Easy to follow`: Low effort, easy to settle into after work
       - `A deep story`: Layered, meaningful, memorable
       - `Something unexpected`: Fresh ideas, twists, mind-benders
- **Fine-Tune Accordion (Optional)**:
  - Exclude genres (e.g. avoid Horror, Romance, or Animation).
  - Language / Region (English, International, Anime).
- **Navigation**:
  - `← Back` (returns to Step 1 preserving selections)
  - `Find my 3 picks →` (progress bar reaches 100%, fetches and reveals Step 3)

---

### Step 3: "Here are your 3 picks!" (`3 / 3`)
- **Headline**: *"Here are your 3 picks!"*
- **Active Filter Badges**: Displays user's selected mood pills (e.g., `Relaxed`, `With friends`, `90–120 min`).
- **3 Recommendation Cards**:
  - Rank indicator badge (`01`, `02`, `03`)
  - Full-color 2:3 poster cover with subtle border glow on hover
  - Title, release year, genres, rating (e.g., `8.6/10`)
  - Tailored pitch: 2-line explanation of why this matches the selected mood
  - Mood & vibe tags (e.g. `Thought-provoking`, `Emotional`)
  - **Quick Action**: "Add to Collection" bookmark icon button (integrates with guest/auth collection)
  - **Primary Action**: "Watch now" / "Read now" button
- **Session Actions**:
  - **"Refine your picks"**: Navigates back to Step 2 so user can tweak mood or runtime.
  - **"Roll 3 new picks"**: Draws another 3 items from the filtered pool without needing to re-answer questions.

---

## 3. In-Place Quick Summary Modal

When the user clicks on any of the 3 recommended cards or the "Watch now" button:
- **No Page Redirection**: User remains on `/picks` so their recommendation state and other 2 picks are never lost.
- **Modal Component**: `MediaQuickSummaryModal.jsx`
  - High-resolution cinematic backdrop with radial gradient darkening.
  - 2:3 poster, title, metadata (runtime, year, genres).
  - Dual score rings (TMDB/Provider + Orgi Community).
  - Action buttons: "Trailer" (in-modal YouTube trailer playback), "Add to collection" toggle, and "Open full page in new tab" link.
  - Full synopsis and key verdict highlights.
  - Dismissible via `Esc`, click outside, or top-right `X` button.

---

## 4. Algorithmic Filtering Engine

To keep response times under 400ms with zero token usage, recommendations use direct algorithmic queries:

### 4.1 Movie & Series Mapping (TMDB Discover)
- **Base Filters**:
  - `vote_average.gte=7.0`
  - `vote_count.gte=250`
  - `sort_by=popularity.desc`
- **Mood / Vibe Genre Mappings**:
  - `Relaxed` → Animation (16), Comedy (35), Family (10751)
  - `Exciting` → Action (28), Adventure (12), Sci-Fi (878)
  - `Thought-provoking` → Mystery (9648), Sci-Fi (878), Drama (18)
  - `Emotional` → Drama (18), Romance (10749)
  - `Funny` → Comedy (35)
  - `Dark & Intense` → Thriller (53), Crime (80), Horror (27)
  - `Feel-good` → Comedy (35), Animation (16), Music (10402)
- **Runtime Constraints**:
  - `Under 90 min` → `with_runtime.lte=90`
  - `90–120 min` → `with_runtime.gte=90&with_runtime.lte=120`
  - `2+ hours` → `with_runtime.gte=120`
- **Social Context Adjustments**:
  - `With family` → `certification_country=US&certification.lte=PG-13` + excludes Horror (27)
- **Randomizer**: Pulls top 15–20 matches and randomly selects 3 diverse titles.

### 4.2 Manga & Literature Mapping (MangaDex & OpenLibrary)
- Uses `MANGADEX_GENRE_TAGS` to map selected mood pills to tag UUIDs.
- Queries `order[followedCount]=desc&order[rating]=desc`.
- Selects 3 diverse titles from the top 15 results.

---

## 5. Component & Route Architecture

```
client/src/
  ├── feature/
  │     └── recommendation/
  │           ├── components/
  │           │     ├── StepMediumSelector.jsx     # Step 1: Medium & format selector cards
  │           │     ├── StepMoodQuestions.jsx      # Step 2: Psychological preference questions
  │           │     ├── StepPicksResults.jsx       # Step 3: 3 Curated cards grid
  │           │     ├── MediaQuickSummaryModal.jsx # In-place modal detail view
  │           │     ├── OrgiPicksButton.jsx        # Standout shiny pill button (search companion)
  │           │     └── OrgiPicksFAB.jsx           # Floating Action Button for bottom-right corners
  │           └── services/
  │                 └── recommendationService.js   # Algorithmic query builder & result ranker
  ├── pages/
  │     ├── RecommendationPage.jsx                 # Main 3-step recommendation wizard page
  │     └── HomePage.jsx                           # Houses the top search companion button
  └── routes/
        └── AppRoutes.jsx                          # Registers /picks route
```

---

## 6. Implementation Checklist

- [ ] Create `feature/recommendation/services/recommendationService.js` with TMDB Discover & MangaDex genre/vibe matching functions.
- [ ] Create `feature/recommendation/components/OrgiPicksButton.jsx` with mint border glow, gradient animation, and responsive layout.
- [ ] Add `OrgiPicksButton` to `HomePage.jsx` beside the search bar (desktop) and below (mobile).
- [ ] Create `feature/recommendation/components/OrgiPicksFAB.jsx` and add it to `Layout.jsx` or relevant browsing pages.
- [ ] Build `feature/recommendation/components/StepMediumSelector.jsx` (Step 1).
- [ ] Build `feature/recommendation/components/StepMoodQuestions.jsx` with 20% initial progress bar (Step 2).
- [ ] Build `feature/recommendation/components/StepPicksResults.jsx` with 3 cards, vibe tags, collection toggle, and re-roll button (Step 3).
- [ ] Build `feature/recommendation/components/MediaQuickSummaryModal.jsx` for in-place pop-up detail view.
- [ ] Assemble `pages/RecommendationPage.jsx` and register `/picks` in `AppRoutes.jsx`.
- [ ] Verify build and behavior with zero errors.

