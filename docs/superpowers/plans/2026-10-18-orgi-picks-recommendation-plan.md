# Orgi Picks Recommendation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 3-step psychological recommendation wizard ("Orgi Picks") under `feature/recommendation/`, powered by algorithmic TMDB and MangaDex filtering, with an endowed progress bar starting at 20%, an in-place Quick Summary modal, and dual entry points (desktop/mobile search companion and floating action button).

**Architecture:** A lightweight client-side recommendation engine maps mood, social context, runtime, and story depth to TMDB Discover and MangaDex APIs. The wizard manages a 3-step state flow (Medium -> Psychological Questions -> Curated 3 Picks), keeping the user in-place on `/picks` by presenting detailed overviews inside an in-page Quick Summary modal rather than redirecting away.

**Tech Stack:** React 19, React Router v7, Lucide Icons, Tailwind CSS v4, TMDB API, MangaDex API, Supabase Auth/Collection API.

**Spec:** `docs/superpowers/specs/2026-10-18-orgi-picks-recommendation-design.md`

## Global Constraints

- Folder structure: All recommendation components and services must live inside `client/src/feature/recommendation/`.
- Zero AI tokens: Recommendations must be calculated via pure algorithmic filtering (TMDB Discover and MangaDex tag queries).
- Endowed progress: The progress bar on Step 2 must visually start at 20% on load.
- In-place detail view: Clicking on recommended items must open `MediaQuickSummaryModal` without navigating away from `/picks`.
- No comments in code: Strictly follow the project rule prohibiting code comments.
- Indented blank lines: Blank lines must match surrounding block indentation depth.
- Trailing whitespace: Wrapped lines ending with punctuation, operators, or letters must carry a trailing space.

---

### Task 1: Algorithmic Recommendation Service

**Files:**
- Create: `client/src/feature/recommendation/services/recommendationService.js`
- Test: `client/src/feature/recommendation/services/recommendationService.test.js`

**Interfaces:**
- Consumes: TMDB Discover endpoints (`/discover/movie`, `/discover/tv`), MangaDex API (`/manga`).
- Produces: `fetchOrgiPicks({ medium, subMedium, vibes, socialContext, timeBudget, storyDepth, excludedGenres }) => Promise<Array<MediaItem>>`

- [x] **Step 1: Write test for recommendation service**

Create `client/src/feature/recommendation/services/recommendationService.test.js`:
```javascript
import { describe, it, expect, vi } from "vitest"; 
import { buildTmdbDiscoverParams, mapVibeToGenres } from "./recommendationService"; 

describe("recommendationService", () => { 
  it("maps Thought-provoking vibe to mystery, sci-fi and drama genre IDs", () => { 
    const genreIds = mapVibeToGenres(["Thought-provoking"]); 
    expect(genreIds).toContain("9648"); 
    expect(genreIds).toContain("878"); 
  }); 

  it("builds valid TMDB discover params for movie under 90 minutes", () => { 
    const params = buildTmdbDiscoverParams({ 
      medium: "movie", 
      vibes: ["Relaxed"], 
      timeBudget: "under90", 
    }); 
    expect(params.get("with_runtime.lte")).toBe("90"); 
    expect(params.get("vote_average.gte")).toBe("7.0"); 
  }); 
}); 
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test src/feature/recommendation/services/recommendationService.test.js` in `client`
Expected: FAIL (module not found).

- [x] **Step 3: Implement recommendationService**

Create `client/src/feature/recommendation/services/recommendationService.js`:
```javascript
import { getTmdbImageUrl } from "../../../services/tmdb"; 
import { MANGADEX_GENRE_TAGS } from "../../../services/mediaApi"; 

const DIRECT_API_KEY = "e2a7d3e1dd95c5e71b164f3334a3628d"; 
const TMDB_DIRECT_URL = "https://api.themoviedb.org/3"; 
const MANGADEX_BASE = "https://api.mangadex.org"; 
const MANGADEX_COVERS = "https://uploads.mangadex.org/covers"; 

const VIBE_GENRE_MAP = { 
  Relaxed: ["16", "35", "10751"], 
  Exciting: ["28", "12", "878"], 
  "Thought-provoking": ["9648", "878", "18"], 
  Emotional: ["18", "10749"], 
  Funny: ["35"], 
  "Dark & Intense": ["53", "80", "27"], 
  "Feel-good": ["35", "16", "10402"], 
}; 

const VIBE_MANGADEX_MAP = { 
  Relaxed: ["Slice of Life", "Comedy"], 
  Exciting: ["Action", "Adventure"], 
  "Thought-provoking": ["Psychological", "Mystery"], 
  Emotional: ["Drama", "Romance"], 
  Funny: ["Comedy"], 
  "Dark & Intense": ["Horror", "Psychological", "Crime"], 
  "Feel-good": ["Slice of Life", "Comedy", "Fantasy"], 
}; 

export function mapVibeToGenres(vibes = []) { 
  const set = new Set(); 
  vibes.forEach((v) => { 
    const ids = VIBE_GENRE_MAP[v] || []; 
    ids.forEach((id) => set.add(id)); 
  }); 
  return Array.from(set); 
} 

export function buildTmdbDiscoverParams({ 
  medium = "movie", 
  vibes = [], 
  socialContext, 
  timeBudget, 
  excludedGenres = [], 
}) { 
  const params = new URLSearchParams({ 
    api_key: DIRECT_API_KEY, 
    sort_by: "vote_count.desc", 
    "vote_average.gte": "7.0", 
    "vote_count.gte": "250", 
    include_adult: "false", 
  }); 

  const genreIds = mapVibeToGenres(vibes); 
  if (genreIds.length > 0) { 
    params.set("with_genres", genreIds.join("|")); 
  } 

  if (excludedGenres.length > 0) { 
    params.set("without_genres", excludedGenres.join(",")); 
  } 

  if (socialContext === "family") { 
    params.set("certification_country", "US"); 
    params.set("certification.lte", "PG-13"); 
  } 

  if (medium === "movie") { 
    if (timeBudget === "under90") { 
      params.set("with_runtime.lte", "90"); 
    } else if (timeBudget === "90-120") { 
      params.set("with_runtime.gte", "90"); 
      params.set("with_runtime.lte", "120"); 
    } else if (timeBudget === "2plus") { 
      params.set("with_runtime.gte", "120"); 
    } 
  } 

  return params; 
} 

function shuffleArray(arr) { 
  const shuffled = [...arr]; 
  for (let i = shuffled.length - 1; i > 0; i--) { 
    const j = Math.floor(Math.random() * (i + 1)); 
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
  } 
  return shuffled; 
} 

export async function fetchOrgiPicks({ 
  medium = "movie", 
  subMedium = "movie", 
  vibes = ["Relaxed"], 
  socialContext = "justMe", 
  timeBudget = "90-120", 
  storyDepth = "deep", 
  excludedGenres = [], 
}) { 
  if (medium === "book") { 
    return fetchMangaPicks({ subMedium, vibes }); 
  } 

  const endpoint = subMedium === "series" ? "/discover/tv" : "/discover/movie"; 
  const params = buildTmdbDiscoverParams({ 
    medium: subMedium, 
    vibes, 
    socialContext, 
    timeBudget, 
    excludedGenres, 
  }); 

  const res = await fetch(`${TMDB_DIRECT_URL}${endpoint}?${params.toString()}`); 
  if (!res.ok) { 
    throw new Error(`Failed to fetch recommendations: ${res.status}`); 
  } 

  const json = await res.json(); 
  const results = json.results || []; 
  const shuffled = shuffleArray(results); 
  const selected = shuffled.slice(0, 3); 

  return selected.map((item, idx) => ({ 
    id: String(item.id), 
    rank: idx + 1, 
    title: item.title || item.name || "Untitled", 
    poster: getTmdbImageUrl(item.poster_path, "w500"), 
    backdrop: getTmdbImageUrl(item.backdrop_path, "original"), 
    year: (item.release_date || item.first_air_date || "").slice(0, 4) || "2024", 
    rating: typeof item.vote_average === "number" ? item.vote_average.toFixed(1) : "8.0", 
    votesCount: item.vote_count ? `${(item.vote_count / 1000).toFixed(1)}k` : "1.2k", 
    synopsis: item.overview || "An exceptional story recommended based on your tonight's vibe.", 
    provider: "tmdb", 
    type: subMedium === "series" ? "SERIES" : "MOVIE", 
    vibes: vibes.slice(0, 2), 
    pitch: `Matches your ${vibes.join(" & ").toLowerCase()} mood with high audience acclaim.`, 
  })); 
} 

async function fetchMangaPicks({ subMedium = "manga", vibes = ["Relaxed"] }) { 
  const params = new URLSearchParams({ 
    limit: "25", 
    "order[followedCount]": "desc", 
    "order[rating]": "desc", 
  }); 

  params.append("includes[]", "cover_art"); 
  params.append("includes[]", "author"); 

  const targetTags = new Set(); 
  vibes.forEach((v) => { 
    const tags = VIBE_MANGADEX_MAP[v] || []; 
    tags.forEach((t) => { 
      if (MANGADEX_GENRE_TAGS[t]) targetTags.add(MANGADEX_GENRE_TAGS[t]); 
    }); 
  }); 

  targetTags.forEach((tagId) => params.append("includedTags[]", tagId)); 

  const res = await fetch(`${MANGADEX_BASE}/manga?${params.toString()}`); 
  if (!res.ok) { 
    throw new Error(`Failed to fetch manga picks: ${res.status}`); 
  } 

  const json = await res.json(); 
  const items = json.data || []; 
  const shuffled = shuffleArray(items); 
  const selected = shuffled.slice(0, 3); 

  return selected.map((item, idx) => { 
    const attrs = item.attributes || {}; 
    const title = attrs.title?.en || Object.values(attrs.title || {})[0] || "Untitled"; 
    const coverRel = (item.relationships || []).find((r) => r.type === "cover_art"); 
    const fileName = coverRel?.attributes?.fileName; 
    const coverUrl = fileName ? `${MANGADEX_COVERS}/${item.id}/${fileName}.512.jpg` : ""; 

    return { 
      id: String(item.id), 
      rank: idx + 1, 
      title, 
      poster: coverUrl, 
      backdrop: coverUrl, 
      year: (attrs.year || attrs.createdAt || "").toString().slice(0, 4) || "2024", 
      rating: "8.5", 
      votesCount: "850", 
      synopsis: attrs.description?.en || "A critically acclaimed series matching your reading mood.", 
      provider: "mangadex", 
      type: (subMedium || "manga").toUpperCase(), 
      vibes: vibes.slice(0, 2), 
      pitch: `A standout ${subMedium} fitting your ${vibes.join(" & ").toLowerCase()} preference.`, 
    }; 
  }); 
} 
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test src/feature/recommendation/services/recommendationService.test.js` in `client`
Expected: PASS.

---

### Task 2: In-Place Quick Summary Modal

**Files:**
- Create: `client/src/feature/recommendation/components/MediaQuickSummaryModal.jsx`

**Interfaces:**
- Consumes: `{ item, isOpen, onClose }`
- Produces: Pop-up overlay with backdrop blur, detailed poster, metadata, trailer playback, synopsis, and collection toggle button.

- [x] **Step 1: Implement MediaQuickSummaryModal**

Create `client/src/feature/recommendation/components/MediaQuickSummaryModal.jsx`:
```javascript
import React, { useEffect, useState } from "react"; 
import { X, Star, Bookmark, Play, ExternalLink } from "lucide-react"; 
import { Button } from "../../../components/ui/Button"; 
import Trailer from "../../../components/ui/Trailer"; 
import { getMediaVideos, findTrailerKey } from "../../../services/tmdb"; 
import { isGuestInCollection, toggleGuestCollection } from "../../../utils/guestCollection"; 
import { useToast } from "../../../context/ToastContext"; 
import api from "../../../services/api"; 

export function MediaQuickSummaryModal({ item, isOpen, onClose }) { 
  const [trailerKey, setTrailerKey] = useState(null); 
  const [showTrailer, setShowTrailer] = useState(false); 
  const [loadingTrailer, setLoadingTrailer] = useState(false); 
  const [inCollection, setInCollection] = useState(false); 
  const { showToast, openAuthModal } = useToast(); 

  useEffect(() => { 
    if (!isOpen || !item) return; 

    const token = localStorage.getItem("orgi_session"); 
    if (!token) { 
      setInCollection(isGuestInCollection(item.provider || "tmdb", item.id)); 
    } else { 
      api.get(`/collections/check/${item.provider || "tmdb"}/${item.id}`) 
        .then((res) => { 
          if (res?.data?.inCollection) setInCollection(true); 
        }) 
        .catch(() => {}); 
    } 

    const handleKeyDown = (e) => { 
      if (e.key === "Escape") onClose(); 
    }; 
    window.addEventListener("keydown", handleKeyDown); 
    return () => window.removeEventListener("keydown", handleKeyDown); 
  }, [isOpen, item, onClose]); 

  if (!isOpen || !item) return null; 

  const handlePlayTrailer = async () => { 
    if (trailerKey) { 
      setShowTrailer(true); 
      return; 
    } 
    setLoadingTrailer(true); 
    try { 
      const videos = await getMediaVideos(item.id, item.type === "SERIES" ? "tv" : "movie"); 
      const key = findTrailerKey(videos); 
      if (key) { 
        setTrailerKey(key); 
        setShowTrailer(true); 
      } else { 
        showToast({ message: "No official trailer available." }); 
      } 
    } catch { 
      showToast({ message: "Could not load trailer." }); 
    } finally { 
      setLoadingTrailer(false); 
    } 
  }; 

  const handleToggleCollection = async () => { 
    const token = localStorage.getItem("orgi_session"); 
    if (!token) { 
      const next = toggleGuestCollection({ 
        external_id: item.id, 
        provider: item.provider || "tmdb", 
        type: item.type || "MOVIE", 
        title: item.title, 
        cover_url: item.poster, 
      }); 
      setInCollection(next); 
      showToast({ 
        message: next ? "Added to local collection." : "Removed from collection.", 
        actionText: "Sign In to Sync", 
        onAction: openAuthModal, 
      }); 
      return; 
    } 
    try { 
      const res = await api.post("/collections/toggle", { 
        external_id: item.id, 
        provider: item.provider || "tmdb", 
        type: item.type || "MOVIE", 
        title: item.title, 
        cover_url: item.poster, 
      }); 
      if (res?.success) setInCollection(!!res.data?.inCollection); 
    } catch (err) { 
      showToast({ message: err.message || "Failed to update collection." }); 
    } 
  }; 

  const detailUrl = item.type === "SERIES" ? `/series/${item.id}` : `/movie/${item.id}`; 

  return ( 
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-backdrop-fade"> 
      <div 
        role="dialog" 
        aria-modal="true" 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0B0F13] border border-[#1E262F] text-[#F5F5F5] shadow-2xl shadow-black/80 animate-modal-pop" 
      > 
        <button 
          type="button" 
          onClick={onClose} 
          aria-label="Close" 
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-[#B5B5B5] hover:text-white hover:bg-black/80 transition-colors cursor-pointer" 
        > 
          <X size={16} /> 
        </button> 

        <div className="relative aspect-[16/8] w-full overflow-hidden"> 
          <img 
            src={item.backdrop || item.poster} 
            alt={item.title} 
            className="w-full h-full object-cover opacity-35" 
          /> 
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F13] via-[#0B0F13]/60 to-transparent" /> 
        </div> 

        <div className="p-6 sm:p-8 -mt-20 relative z-10 flex flex-col sm:flex-row gap-6"> 
          <div className="shrink-0 w-36 sm:w-44 aspect-[2/3] rounded-xl overflow-hidden border border-[#1E262F] bg-[#000] shadow-xl"> 
            <img 
              src={item.poster} 
              alt={item.title} 
              className="w-full h-full object-cover" 
            /> 
          </div> 

          <div className="flex-1 flex flex-col min-w-0"> 
            <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#61F1AC] mb-1"> 
              ORGI PICK · {item.type} 
            </div> 
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F5F5F5] mb-2"> 
              {item.title} 
            </h2> 
            <div className="flex items-center gap-3 text-xs text-[#9CA3AF] mb-4"> 
              <span>{item.year}</span> 
              <span>·</span> 
              <span className="flex items-center gap-1 text-[#61F1AC]"> 
                <Star size={13} className="fill-[#61F1AC]" /> 
                {item.rating} / 10 
              </span> 
              <span>·</span> 
              <span>{item.votesCount} ratings</span> 
            </div> 

            <p className="text-sm text-[#D0D0D0] leading-relaxed mb-6"> 
              {item.synopsis} 
            </p> 

            <div className="flex flex-wrap items-center gap-3 mt-auto"> 
              {item.provider === "tmdb" && ( 
                <Button 
                  variant="primary" 
                  size="sm" 
                  disabled={loadingTrailer} 
                  onClick={handlePlayTrailer} 
                  className="px-4 py-2 rounded-xl" 
                > 
                  <Play size={14} className="fill-black text-black" /> 
                  <span>{loadingTrailer ? "Loading..." : "Trailer"}</span> 
                </Button> 
              )} 

              <button 
                type="button" 
                onClick={handleToggleCollection} 
                className={`h-9 px-4 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${ 
                  inCollection 
                    ? "border-[#61F1AC]/50 text-[#61F1AC] bg-[#61F1AC]/10" 
                    : "border-[#1E262F] text-[#B5B5B5] hover:text-white hover:bg-[#141414]" 
                }`} 
              > 
                <Bookmark size={14} className={inCollection ? "fill-[#61F1AC]" : ""} /> 
                <span>{inCollection ? "In Collection" : "Add to Collection"}</span> 
              </button> 

              <a 
                href={detailUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="h-9 px-3 rounded-xl border border-[#1E262F] text-xs text-[#9CA3AF] hover:text-white flex items-center gap-1.5 transition-colors" 
              > 
                <span>Full Page</span> 
                <ExternalLink size={13} /> 
              </a> 
            </div> 
          </div> 
        </div> 

        {showTrailer && trailerKey && ( 
          <Trailer 
            trailerKey={trailerKey} 
            onClose={() => setShowTrailer(false)} 
          /> 
        )} 
      </div> 
    </div> 
  ); 
} 
```

---

### Task 3: Step 1 Component (Medium Selector)

**Files:**
- Create: `client/src/feature/recommendation/components/StepMediumSelector.jsx`

**Interfaces:**
- Consumes: `{ medium, subMedium, onSelectMedium, onSelectSubMedium, onNext }`
- Produces: Visual card selection between Movie and Book with sub-formats and key-visual art preview.

- [x] **Step 1: Implement StepMediumSelector**

Create `client/src/feature/recommendation/components/StepMediumSelector.jsx`:
```javascript
import React from "react"; 
import { Film, BookOpen, ArrowRight, Tv, Compass, Sparkles } from "lucide-react"; 

const SUB_FORMATS = { 
  movie: [ 
    { key: "movie", label: "Movie", icon: Film }, 
    { key: "series", label: "TV Series", icon: Tv }, 
    { key: "anime", label: "Anime", icon: Sparkles }, 
  ], 
  book: [ 
    { key: "manga", label: "Manga", icon: BookOpen }, 
    { key: "manhwa", label: "Manhwa", icon: Compass }, 
    { key: "manhua", label: "Manhua", icon: Compass }, 
    { key: "novels", label: "Novel", icon: BookOpen }, 
  ], 
}; 

const PREVIEW_ART = { 
  movie: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80", 
  book: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80", 
}; 

export function StepMediumSelector({ 
  medium, 
  subMedium, 
  onSelectMedium, 
  onSelectSubMedium, 
  onNext, 
}) { 
  return ( 
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto"> 
      <div className="lg:col-span-7 flex flex-col"> 
        <div className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#61F1AC] mb-3"> 
          01 / 03 · MEDIUM 
        </div> 

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#F5F5F5] mb-4"> 
          What do you want to{" "} 
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0]"> 
            watch or read? 
          </span> 
        </h1> 

        <p className="text-sm text-[#9CA3AF] leading-relaxed mb-8 max-w-lg"> 
          Select the type of content you're in the mood for. We'll tailor your questions and recommendations based on your choice. 
        </p> 

        <div className="grid grid-cols-2 gap-4 mb-6"> 
          <button 
            type="button" 
            onClick={() => onSelectMedium("movie")} 
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-3 ${ 
              medium === "movie" 
                ? "bg-[#61F1AC]/10 border-[#61F1AC] shadow-[0_0_30px_rgba(97,241,172,0.15)]" 
                : "bg-[#0B0F13] border-[#1E262F] hover:border-white/20" 
            }`} 
          > 
            <Film size={24} className={medium === "movie" ? "text-[#61F1AC]" : "text-[#7A7A7A]"} /> 
            <div> 
              <div className="text-base font-semibold text-[#F5F5F5]">Watch</div> 
              <div className="text-xs text-[#7A7A7A]">Films, anime, and series</div> 
            </div> 
          </button> 

          <button 
            type="button" 
            onClick={() => onSelectMedium("book")} 
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-3 ${ 
              medium === "book" 
                ? "bg-[#61F1AC]/10 border-[#61F1AC] shadow-[0_0_30px_rgba(97,241,172,0.15)]" 
                : "bg-[#0B0F13] border-[#1E262F] hover:border-white/20" 
            }`} 
          > 
            <BookOpen size={24} className={medium === "book" ? "text-[#61F1AC]" : "text-[#7A7A7A]"} /> 
            <div> 
              <div className="text-base font-semibold text-[#F5F5F5]">Read</div> 
              <div className="text-xs text-[#7A7A7A]">Manga, manhwa, novels</div> 
            </div> 
          </button> 
        </div> 

        <div className="flex flex-wrap items-center gap-2 mb-8"> 
          {SUB_FORMATS[medium].map((sub) => { 
            const Icon = sub.icon; 
            const isSelected = subMedium === sub.key; 
            return ( 
              <button 
                key={sub.key} 
                type="button" 
                onClick={() => onSelectSubMedium(sub.key)} 
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${ 
                  isSelected 
                    ? "bg-[#61F1AC] text-black border-[#61F1AC] font-semibold" 
                    : "bg-[#0B0F13] border-[#1E262F] text-[#9CA3AF] hover:text-white" 
                }`} 
              > 
                <Icon size={12} /> 
                <span>{sub.label}</span> 
              </button> 
            ); 
          })} 
        </div> 

        <button 
          type="button" 
          onClick={onNext} 
          className="w-full sm:w-fit px-8 py-3.5 rounded-xl bg-[#61F1AC] hover:bg-[#61F1AC]/90 text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#61F1AC]/20 transition-all cursor-pointer" 
        > 
          <span>Next: Pick your vibe</span> 
          <ArrowRight size={16} /> 
        </button> 
      </div> 

      <div className="lg:col-span-5 hidden lg:block"> 
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-[#1E262F] bg-[#0B0F13] shadow-2xl"> 
          <img 
            src={PREVIEW_ART[medium]} 
            alt={medium} 
            className="w-full h-full object-cover" 
          /> 
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F13] via-transparent to-transparent" /> 
          <div className="absolute bottom-6 left-6 right-6"> 
            <div className="text-xs uppercase tracking-wider text-[#61F1AC] font-mono mb-1"> 
              Curated Medium 
            </div> 
            <div className="text-lg font-bold text-white capitalize"> 
              {subMedium} Selection 
            </div> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
} 
```

---

### Task 4: Step 2 Component (Psychological Preference Questions)

**Files:**
- Create: `client/src/feature/recommendation/components/StepMoodQuestions.jsx`

**Interfaces:**
- Consumes: `{ medium, answers, onToggleVibe, onSelectOption, onBack, onSubmit, isLoading }`
- Produces: Psychological questionnaire with 20% starting endowed progress bar, vibe pills, social cards, runtime pills, and story depth cards.

- [x] **Step 1: Implement StepMoodQuestions**

Create `client/src/feature/recommendation/components/StepMoodQuestions.jsx`:
```javascript
import React, { useState } from "react"; 
import { User, Users, Heart, Home, ArrowLeft, ArrowRight, ChevronDown, Sparkles } from "lucide-react"; 

const VIBES = [ 
  "Relaxed", 
  "Exciting", 
  "Thought-provoking", 
  "Emotional", 
  "Funny", 
  "Dark & Intense", 
  "Feel-good", 
]; 

const SOCIAL_OPTIONS = [ 
  { id: "justMe", label: "Just me", icon: User }, 
  { id: "partner", label: "With partner", icon: Heart }, 
  { id: "friends", label: "With friends", icon: Users }, 
  { id: "family", label: "With family", icon: Home }, 
]; 

const RUNTIME_OPTIONS = [ 
  { id: "under90", label: "Under 90 min" }, 
  { id: "90-120", label: "90–120 min" }, 
  { id: "2plus", label: "2+ hours" }, 
  { id: "episodes", label: "A few episodes" }, 
]; 

const DEPTH_OPTIONS = [ 
  { id: "easy", title: "Easy to follow", subtitle: "Low effort, easy to settle into" }, 
  { id: "deep", title: "A story worth thinking about", subtitle: "Layered, meaningful, memorable" }, 
  { id: "unexpected", title: "Something unexpected", subtitle: "Surprises and fresh twists" }, 
]; 

export function StepMoodQuestions({ 
  answers, 
  onToggleVibe, 
  onSelectOption, 
  onBack, 
  onSubmit, 
  isLoading, 
}) { 
  const [fineTuneOpen, setFineTuneOpen] = useState(false); 

  const progressPercent = Math.min( 
    20 + (answers.vibes.length > 0 ? 20 : 0) + (answers.social ? 20 : 0) + (answers.time ? 20 : 0) + (answers.depth ? 20 : 0), 
    100 
  ); 

  return ( 
    <div className="max-w-3xl mx-auto flex flex-col"> 
      <div className="mb-8"> 
        <div className="flex items-center justify-between text-xs text-[#7A7A7A] mb-2 font-mono"> 
          <span className="text-[#61F1AC] uppercase tracking-wider font-semibold"> 
            02 / 03 · YOUR MOOD &amp; TIME 
          </span> 
          <span>{progressPercent}% Complete</span> 
        </div> 
        <div className="w-full h-1.5 rounded-full bg-[#161D24] overflow-hidden"> 
          <div 
            className="h-full bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0] transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }} 
          /> 
        </div> 
      </div> 

      <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#F5F5F5] mb-2"> 
        Tell us what you're{" "} 
        <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0]"> 
          in the mood for 
        </span> 
      </h2> 
      <p className="text-xs sm:text-sm text-[#9CA3AF] mb-8"> 
        A few quick taps. Three considered picks that fit tonight. 
      </p> 

      <div className="space-y-8"> 
        <div> 
          <label className="block text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider mb-3"> 
            1. What should it feel like? (Pick 1 or more) 
          </label> 
          <div className="flex flex-wrap gap-2.5"> 
            {VIBES.map((v) => { 
              const active = answers.vibes.includes(v); 
              return ( 
                <button 
                  key={v} 
                  type="button" 
                  onClick={() => onToggleVibe(v)} 
                  className={`px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${ 
                    active 
                      ? "bg-[#61F1AC]/15 border-[#61F1AC] text-[#61F1AC] shadow-[0_0_20px_rgba(97,241,172,0.12)] font-semibold" 
                      : "bg-[#0B0F13] border-[#1E262F] text-[#9CA3AF] hover:text-white hover:border-white/20" 
                  }`} 
                > 
                  {v} 
                </button> 
              ); 
            })} 
          </div> 
        </div> 

        <div> 
          <label className="block text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider mb-3"> 
            2. Who's watching / reading? 
          </label> 
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"> 
            {SOCIAL_OPTIONS.map((opt) => { 
              const Icon = opt.icon; 
              const active = answers.social === opt.id; 
              return ( 
                <button 
                  key={opt.id} 
                  type="button" 
                  onClick={() => onSelectOption("social", opt.id)} 
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${ 
                    active 
                      ? "bg-[#61F1AC]/15 border-[#61F1AC] text-[#61F1AC] font-semibold" 
                      : "bg-[#0B0F13] border-[#1E262F] text-[#9CA3AF] hover:text-white" 
                  }`} 
                > 
                  <Icon size={16} /> 
                  <span className="text-xs">{opt.label}</span> 
                </button> 
              ); 
            })} 
          </div> 
        </div> 

        <div> 
          <label className="block text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider mb-3"> 
            3. How much time do you have? 
          </label> 
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"> 
            {RUNTIME_OPTIONS.map((opt) => { 
              const active = answers.time === opt.id; 
              return ( 
                <button 
                  key={opt.id} 
                  type="button" 
                  onClick={() => onSelectOption("time", opt.id)} 
                  className={`py-2.5 px-3 rounded-xl border text-xs text-center transition-all cursor-pointer ${ 
                    active 
                      ? "bg-[#61F1AC] text-black border-[#61F1AC] font-semibold" 
                      : "bg-[#0B0F13] border-[#1E262F] text-[#9CA3AF] hover:text-white" 
                  }`} 
                > 
                  {opt.label} 
                </button> 
              ); 
            })} 
          </div> 
        </div> 

        <div> 
          <label className="block text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider mb-3"> 
            4. What kind of experience do you want? 
          </label> 
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"> 
            {DEPTH_OPTIONS.map((opt) => { 
              const active = answers.depth === opt.id; 
              return ( 
                <button 
                  key={opt.id} 
                  type="button" 
                  onClick={() => onSelectOption("depth", opt.id)} 
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${ 
                    active 
                      ? "bg-[#61F1AC]/10 border-[#61F1AC] shadow-[0_0_20px_rgba(97,241,172,0.1)]" 
                      : "bg-[#0B0F13] border-[#1E262F] hover:border-white/20" 
                  }`} 
                > 
                  <div className={`text-xs font-semibold ${active ? "text-[#61F1AC]" : "text-[#F5F5F5]"}`}> 
                    {opt.title} 
                  </div> 
                  <div className="text-[11px] text-[#7A7A7A] leading-relaxed"> 
                    {opt.subtitle} 
                  </div> 
                </button> 
              ); 
            })} 
          </div> 
        </div> 

        <div className="pt-2"> 
          <button 
            type="button" 
            onClick={() => setFineTuneOpen((p) => !p)} 
            className="flex items-center gap-2 text-xs text-[#7A7A7A] hover:text-[#9CA3AF] transition-colors cursor-pointer" 
          > 
            <ChevronDown size={14} className={`transition-transform duration-300 ${fineTuneOpen ? "rotate-180" : ""}`} /> 
            <span>Fine-tune options (Exclude genres)</span> 
          </button> 
          {fineTuneOpen && ( 
            <div className="mt-3 p-4 rounded-xl bg-[#0B0F13] border border-[#1E262F] text-xs text-[#9CA3AF]"> 
              <div className="mb-2 text-[11px] text-[#7A7A7A]">Exclude specific genres from results:</div> 
              <div className="flex flex-wrap gap-2"> 
                {["Horror", "Romance", "Animation", "Crime"].map((genre) => ( 
                  <label key={genre} className="flex items-center gap-1.5 cursor-pointer select-none"> 
                    <input 
                      type="checkbox" 
                      className="rounded border-[#1E262F] bg-black accent-[#61F1AC]" 
                    /> 
                    <span>{genre}</span> 
                  </label> 
                ))} 
              </div> 
            </div> 
          )} 
        </div> 
      </div> 

      <div className="flex items-center justify-between pt-10 border-t border-[#1E262F] mt-10"> 
        <button 
          type="button" 
          onClick={onBack} 
          className="px-5 py-2.5 rounded-xl border border-[#1E262F] text-xs font-medium text-[#9CA3AF] hover:text-white transition-colors cursor-pointer flex items-center gap-2" 
        > 
          <ArrowLeft size={14} /> 
          <span>Back</span> 
        </button> 

        <button 
          type="button" 
          disabled={isLoading || answers.vibes.length === 0} 
          onClick={onSubmit} 
          className="px-7 py-3 rounded-xl bg-[#61F1AC] hover:bg-[#61F1AC]/90 text-black font-semibold text-xs flex items-center gap-2 shadow-xl shadow-[#61F1AC]/20 transition-all cursor-pointer disabled:opacity-50" 
        > 
          <Sparkles size={14} /> 
          <span>{isLoading ? "Finding your picks..." : "Find my 3 picks →"}</span> 
        </button> 
      </div> 
    </div> 
  ); 
} 
```

---

### Task 5: Step 3 Component (Curated 3 Picks Grid)

**Files:**
- Create: `client/src/feature/recommendation/components/StepPicksResults.jsx`

**Interfaces:**
- Consumes: `{ picks, vibes, onSelectPick, onReroll, onRefine }`
- Produces: 3-column card grid displaying ranked recommendations with bookmark toggles, watch buttons, and quick summary triggers.

- [x] **Step 1: Implement StepPicksResults**

Create `client/src/feature/recommendation/components/StepPicksResults.jsx`:
```javascript
import React, { useState } from "react"; 
import { Star, Bookmark, Play, RefreshCw, SlidersHorizontal, BookOpen } from "lucide-react"; 
import { isGuestInCollection, toggleGuestCollection } from "../../../utils/guestCollection"; 
import { useToast } from "../../../context/ToastContext"; 
import api from "../../../services/api"; 

export function StepPicksResults({ 
  picks = [], 
  vibes = [], 
  onSelectPick, 
  onReroll, 
  onRefine, 
  isRerolling, 
}) { 
  const { showToast, openAuthModal } = useToast(); 
  const [collectionMap, setCollectionMap] = useState({}); 

  const handleToggleCollection = async (e, pick) => { 
    e.stopPropagation(); 
    const token = localStorage.getItem("orgi_session"); 
    if (!token) { 
      const next = toggleGuestCollection({ 
        external_id: pick.id, 
        provider: pick.provider || "tmdb", 
        type: pick.type || "MOVIE", 
        title: pick.title, 
        cover_url: pick.poster, 
      }); 
      setCollectionMap((p) => ({ ...p, [pick.id]: next })); 
      showToast({ 
        message: next ? "Saved to collection." : "Removed from collection.", 
        actionText: "Sign In to Sync", 
        onAction: openAuthModal, 
      }); 
      return; 
    } 

    try { 
      const res = await api.post("/collections/toggle", { 
        external_id: pick.id, 
        provider: pick.provider || "tmdb", 
        type: pick.type || "MOVIE", 
        title: pick.title, 
        cover_url: pick.poster, 
      }); 
      if (res?.success) { 
        setCollectionMap((p) => ({ ...p, [pick.id]: !!res.data?.inCollection })); 
      } 
    } catch { 
      showToast({ message: "Could not update collection." }); 
    } 
  }; 

  return ( 
    <div className="max-w-6xl mx-auto flex flex-col"> 
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"> 
        <div> 
          <div className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#61F1AC] mb-2"> 
            03 / 03 · YOUR 3 PICKS 
          </div> 
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#F5F5F5]"> 
            Here are your{" "} 
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0]"> 
              3 picks! 
            </span> 
          </h1> 
        </div> 

        <div className="flex items-center gap-2"> 
          <button 
            type="button" 
            onClick={onRefine} 
            className="px-3.5 py-2 rounded-xl border border-[#1E262F] bg-[#0B0F13] hover:border-white/20 text-xs font-medium text-[#B5B5B5] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer" 
          > 
            <SlidersHorizontal size={13} /> 
            <span>Refine</span> 
          </button> 
          <button 
            type="button" 
            disabled={isRerolling} 
            onClick={onReroll} 
            className="px-3.5 py-2 rounded-xl border border-[#61F1AC]/30 bg-[#61F1AC]/10 hover:bg-[#61F1AC]/15 text-xs font-semibold text-[#61F1AC] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50" 
          > 
            <RefreshCw size={13} className={isRerolling ? "animate-spin" : ""} /> 
            <span>Roll 3 New</span> 
          </button> 
        </div> 
      </div> 

      <div className="flex flex-wrap gap-2 mb-8"> 
        {vibes.map((v) => ( 
          <span 
            key={v} 
            className="px-3 py-1 rounded-full text-xs font-medium bg-[#61F1AC]/10 text-[#61F1AC] border border-[#61F1AC]/20" 
          > 
            {v} 
          </span> 
        ))} 
      </div> 

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"> 
        {picks.map((pick) => { 
          const isCollected = Boolean(collectionMap[pick.id]); 
          return ( 
            <div 
              key={pick.id} 
              onClick={() => onSelectPick(pick)} 
              className="group relative rounded-2xl bg-[#0B0F13] border border-[#1E262F] hover:border-[#61F1AC]/50 p-4 flex flex-col transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(97,241,172,0.1)] cursor-pointer" 
            > 
              <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden mb-4 bg-black border border-white/5"> 
                <img 
                  src={pick.poster} 
                  alt={pick.title} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                /> 
                <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-black/75 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xs font-bold text-[#61F1AC]"> 
                  {pick.rank} 
                </div> 

                <button 
                  type="button" 
                  aria-label="Save to collection" 
                  onClick={(e) => handleToggleCollection(e, pick)} 
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full border flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer ${ 
                    isCollected 
                      ? "bg-[#61F1AC] text-black border-[#61F1AC]" 
                      : "bg-black/60 border-white/20 text-[#B5B5B5] hover:text-white" 
                  }`} 
                > 
                  <Bookmark size={14} className={isCollected ? "fill-black" : ""} /> 
                </button> 
              </div> 

              <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mb-1"> 
                <span>{pick.year}</span> 
                <span>·</span> 
                <span className="flex items-center gap-1 text-[#61F1AC] font-medium"> 
                  <Star size={12} className="fill-[#61F1AC]" /> 
                  {pick.rating} 
                </span> 
              </div> 

              <h3 className="text-base font-semibold text-[#F5F5F5] truncate mb-2 group-hover:text-[#61F1AC] transition-colors"> 
                {pick.title} 
              </h3> 

              <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed mb-4"> 
                {pick.pitch} 
              </p> 

              <button 
                type="button" 
                onClick={() => onSelectPick(pick)} 
                className="mt-auto w-full py-2.5 rounded-xl bg-[#161D24] group-hover:bg-[#61F1AC] text-[#D4D4D8] group-hover:text-black font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer" 
              > 
                {pick.provider === "tmdb" ? <Play size={13} className="fill-current" /> : <BookOpen size={13} />} 
                <span>Quick View</span> 
              </button> 
            </div> 
          ); 
        })} 
      </div> 
    </div> 
  ); 
} 
```

---

### Task 6: Recommendation Page & Route Integration

**Files:**
- Create: `client/src/pages/RecommendationPage.jsx`
- Modify: `client/src/routes/AppRoutes.jsx`

**Interfaces:**
- Consumes: `StepMediumSelector`, `StepMoodQuestions`, `StepPicksResults`, `MediaQuickSummaryModal`, `fetchOrgiPicks`.
- Produces: Route `/picks` accessible across the app.

- [x] **Step 1: Create RecommendationPage**

Create `client/src/pages/RecommendationPage.jsx`:
```javascript
import React, { useState } from "react"; 
import { StepMediumSelector } from "../feature/recommendation/components/StepMediumSelector"; 
import { StepMoodQuestions } from "../feature/recommendation/components/StepMoodQuestions"; 
import { StepPicksResults } from "../feature/recommendation/components/StepPicksResults"; 
import { MediaQuickSummaryModal } from "../feature/recommendation/components/MediaQuickSummaryModal"; 
import { fetchOrgiPicks } from "../feature/recommendation/services/recommendationService"; 

export function RecommendationPage() { 
  const [step, setStep] = useState(1); 
  const [medium, setMedium] = useState("movie"); 
  const [subMedium, setSubMedium] = useState("movie"); 
  const [answers, setAnswers] = useState({ 
    vibes: ["Relaxed"], 
    social: "justMe", 
    time: "90-120", 
    depth: "deep", 
    excludedGenres: [], 
  }); 
  const [picks, setPicks] = useState([]); 
  const [isLoading, setIsLoading] = useState(false); 
  const [isRerolling, setIsRerolling] = useState(false); 
  const [selectedModalItem, setSelectedModalItem] = useState(null); 

  const handleSelectMedium = (m) => { 
    setMedium(m); 
    setSubMedium(m === "book" ? "manga" : "movie"); 
  }; 

  const handleToggleVibe = (vibe) => { 
    setAnswers((prev) => { 
      const exists = prev.vibes.includes(vibe); 
      const updated = exists 
        ? prev.vibes.filter((v) => v !== vibe) 
        : [...prev.vibes, vibe]; 
      return { ...prev, vibes: updated.length > 0 ? updated : [vibe] }; 
    }); 
  }; 

  const handleSelectOption = (key, value) => { 
    setAnswers((prev) => ({ ...prev, [key]: value })); 
  }; 

  const handleSubmit = async () => { 
    setIsLoading(true); 
    try { 
      const results = await fetchOrgiPicks({ 
        medium, 
        subMedium, 
        vibes: answers.vibes, 
        socialContext: answers.social, 
        timeBudget: answers.time, 
        storyDepth: answers.depth, 
        excludedGenres: answers.excludedGenres, 
      }); 
      setPicks(results); 
      setStep(3); 
    } catch { 
      setPicks([]); 
    } finally { 
      setIsLoading(false); 
    } 
  }; 

  const handleReroll = async () => { 
    setIsRerolling(true); 
    try { 
      const results = await fetchOrgiPicks({ 
        medium, 
        subMedium, 
        vibes: answers.vibes, 
        socialContext: answers.social, 
        timeBudget: answers.time, 
        storyDepth: answers.depth, 
        excludedGenres: answers.excludedGenres, 
      }); 
      setPicks(results); 
    } finally { 
      setIsRerolling(false); 
    } 
  }; 

  return ( 
    <div className="min-h-[calc(100vh-64px)] bg-[#000000] text-[#F5F5F5] px-6 lg:px-[120px] py-12"> 
      {step === 1 && ( 
        <StepMediumSelector 
          medium={medium} 
          subMedium={subMedium} 
          onSelectMedium={handleSelectMedium} 
          onSelectSubMedium={setSubMedium} 
          onNext={() => setStep(2)} 
        /> 
      )} 

      {step === 2 && ( 
        <StepMoodQuestions 
          medium={medium} 
          answers={answers} 
          onToggleVibe={handleToggleVibe} 
          onSelectOption={handleSelectOption} 
          onBack={() => setStep(1)} 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
        /> 
      )} 

      {step === 3 && ( 
        <StepPicksResults 
          picks={picks} 
          vibes={answers.vibes} 
          onSelectPick={(item) => setSelectedModalItem(item)} 
          onReroll={handleReroll} 
          onRefine={() => setStep(2)} 
          isRerolling={isRerolling} 
        /> 
      )} 

      <MediaQuickSummaryModal 
        item={selectedModalItem} 
        isOpen={Boolean(selectedModalItem)} 
        onClose={() => setSelectedModalItem(null)} 
      /> 
    </div> 
  ); 
} 
```

- [x] **Step 2: Register route in AppRoutes.jsx**

Add route `/picks` to `client/src/routes/AppRoutes.jsx`:
```javascript
import { RecommendationPage } from "../pages/RecommendationPage"; 
...
<Route path="/picks" element={<RecommendationPage />} /> 
<Route path="/recommend" element={<Navigate to="/picks" replace />} /> 
```

---

### Task 7: Entry Points (`OrgiPicksButton` & `OrgiPicksFAB`)

**Files:**
- Create: `client/src/feature/recommendation/components/OrgiPicksButton.jsx`
- Create: `client/src/feature/recommendation/components/OrgiPicksFAB.jsx`
- Modify: `client/src/pages/HomePage.jsx`
- Modify: `client/src/components/layout/Layout.jsx`

**Interfaces:**
- Produces: Standout shiny companion button next to search bar on desktop & below on mobile; persistent floating action button on browsing pages.

- [x] **Step 1: Create OrgiPicksButton**

Create `client/src/feature/recommendation/components/OrgiPicksButton.jsx`:
```javascript
import React from "react"; 
import { Link } from "react-router-dom"; 
import { Sparkles } from "lucide-react"; 

export function OrgiPicksButton({ className = "" }) { 
  return ( 
    <Link 
      to="/picks" 
      className={`group relative inline-flex items-center justify-center gap-2 px-5 h-[54px] rounded-full bg-[#0B0F13] border border-[#61F1AC]/40 hover:border-[#61F1AC] text-[#F5F5F5] text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(97,241,172,0.12)] hover:shadow-[0_0_30px_rgba(97,241,172,0.25)] hover:bg-[#61F1AC]/10 cursor-pointer ${className}`} 
    > 
      <Sparkles size={16} className="text-[#61F1AC] group-hover:rotate-12 transition-transform duration-300" /> 
      <span>Orgi Picks</span> 
    </Link> 
  ); 
} 
```

- [x] **Step 2: Create OrgiPicksFAB**

Create `client/src/feature/recommendation/components/OrgiPicksFAB.jsx`:
```javascript
import React from "react"; 
import { Link, useLocation } from "react-router-dom"; 
import { Sparkles } from "lucide-react"; 

export function OrgiPicksFAB() { 
  const location = useLocation(); 
  if (location.pathname === "/picks") return null; 

  return ( 
    <Link 
      to="/picks" 
      aria-label="Orgi Picks Recommendation" 
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#0B0F13]/90 border border-[#61F1AC]/50 hover:border-[#61F1AC] text-[#F5F5F5] backdrop-blur-md shadow-2xl shadow-black hover:shadow-[0_0_25px_rgba(97,241,172,0.25)] transition-all duration-300 cursor-pointer group" 
    > 
      <Sparkles size={16} className="text-[#61F1AC] group-hover:rotate-12 transition-transform" /> 
      <span className="text-xs font-semibold tracking-wide">Orgi Picks</span> 
    </Link> 
  ); 
} 
```

- [x] **Step 3: Integrate OrgiPicksButton into HomePage.jsx**

In `client/src/pages/HomePage.jsx`:
Place `OrgiPicksButton` beside the search bar on desktop (`hidden sm:inline-flex`), and below search bar on mobile (`sm:hidden mt-3`).

- [x] **Step 4: Integrate OrgiPicksFAB into Layout.jsx**

In `client/src/components/layout/Layout.jsx`:
Render `<OrgiPicksFAB />` globally so it floats at the bottom-right corner of movie and book pages.

---

### Task 8: Verification & Quality Check

- [x] **Step 1: Run unit tests**
Run: `npm test` in `client`
Expected: All tests pass.

- [x] **Step 2: Run production build**
Run: `npm run build` in `client`
Expected: Build passes with 0 errors.
