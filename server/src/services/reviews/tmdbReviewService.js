import { createExcerpt } from "./excerpt.js";
import { selectBestReview, scoreReview } from "./bestReview.js";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// In-memory cache for genre mappings and candidate pools
let genreMap = null;
let genreMapExpiry = 0;

let tmdbCandidatesCache = null;
let tmdbCandidatesExpiry = 0;

let tmdbReviewCardsCache = null;
let tmdbReviewCardsExpiry = 0;

let tmdbFeaturedReviewCache = null;
let tmdbFeaturedReviewExpiry = 0;
let tmdbFeaturedReviewPromise = null;

/**
 * Concurrency runner for parallel fetches
 */
async function pMap(items, mapper, concurrency = 8) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = await mapper(items[i], i);
      } catch (err) {
        console.warn(`[TMDB pMap] Error processing item:`, err.message);
        results[i] = null;
      }
    }
  });
  await Promise.all(workers);
  return results;
}

/**
 * Make a GET request to TMDB API
 */
async function tmdbFetch(endpoint, params = {}) { 
  const rawKey = process.env.TMDB_API_KEY; 
  if (!rawKey) { 
    throw new Error("TMDB_API_KEY is missing from environment"); 
  } 
  const apiKey = rawKey.trim().toLowerCase(); 

  const queryParams = new URLSearchParams({
    api_key: apiKey,
    language: "en-US",
    include_adult: "false",
    ...params,
  });

  const url = `${TMDB_BASE_URL}${endpoint}?${queryParams.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch and cache movie & TV genre names for 24h
 */
export async function getTmdbGenres() {
  const now = Date.now();
  if (genreMap && now < genreMapExpiry) {
    return genreMap;
  }

  try {
    const [movieRes, tvRes] = await Promise.all([
      tmdbFetch("/genre/movie/list"),
      tmdbFetch("/genre/tv/list"),
    ]);

    const map = {};
    for (const g of movieRes.genres || []) {
      map[g.id] = g.name;
    }
    for (const g of tvRes.genres || []) {
      map[g.id] = g.name;
    }

    genreMap = map;
    genreMapExpiry = now + 24 * 60 * 60 * 1000;
    return genreMap;
  } catch (err) {
    console.warn("[TMDB] Failed to fetch genres:", err.message);
    return genreMap || {};
  }
}

/**
 * Resolve avatar URL according to spec:
 * If author_details.avatar_path starts with /http, strip leading slash;
 * otherwise use https://image.tmdb.org/t/p/w45{path}.
 */
export function resolveAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  if (avatarPath.startsWith("/http://") || avatarPath.startsWith("/https://")) {
    return avatarPath.slice(1);
  }
  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }
  return `${TMDB_IMAGE_BASE}/w45${avatarPath}`;
}

/**
 * Identify if title is Anime (genre 16 Animation + ja original language)
 */
export function isAnimeItem(item) {
  if (!item) return false;
  const genreIds = Array.isArray(item.genre_ids)
    ? item.genre_ids
    : Array.isArray(item.genres)
    ? item.genres.map((g) => (typeof g === "object" ? g.id : g))
    : [];
  const isAnimation = genreIds.includes(16);
  const isJapanese = item.original_language === "ja";
  return isAnimation && isJapanese;
}

/**
 * Fetches candidates from trending, popular, and top_rated
 */
export async function fetchTmdbCandidates() {
  const now = Date.now();
  if (tmdbCandidatesCache && now < tmdbCandidatesExpiry) {
    return tmdbCandidatesCache;
  }

  console.log("🎬 [TMDB] Refreshing candidate pool...");

  const endpoints = [ 
    { path: "/trending/movie/week", type: "movie", page: 1 }, 
    { path: "/trending/tv/week", type: "tv", page: 1 }, 
    { path: "/movie/popular", type: "movie", page: 1 }, 
    { path: "/tv/popular", type: "tv", page: 1 }, 
    { 
      path: "/discover/tv", 
      type: "tv", 
      page: 1, 
      params: { with_genres: "16", with_original_language: "ja", sort_by: "vote_count.desc" }, 
    }, 
    { 
      path: "/discover/movie", 
      type: "movie", 
      page: 1, 
      params: { with_genres: "16", with_original_language: "ja", sort_by: "vote_count.desc" }, 
    }, 
  ]; 
 
  const fetchPromises = endpoints.map((ep) => 
    tmdbFetch(ep.path, { page: ep.page, ...(ep.params || {}) }) 
      .then((data) => (data.results || []).map((item) => ({ ...item, media_type: ep.type }))) 
      .catch((err) => { 
        console.warn(`[TMDB] Error fetching ${ep.path}:`, err.message); 
        return []; 
      }) 
  ); 
 
  const resultsNested = await Promise.all(fetchPromises); 
  const combined = resultsNested.flat(); 
 
  const seen = new Set(); 
  const deduped = []; 
  for (const item of combined) { 
    if (!item || !item.id) continue; 
    const key = `${item.media_type || "movie"}:${item.id}`; 
    if (!seen.has(key)) { 
      seen.add(key); 
      deduped.push(item); 
    } 
  } 
 
  tmdbCandidatesCache = deduped; 
  tmdbCandidatesExpiry = now + 2 * 60 * 60 * 1000; 
  return deduped; 
} 
 
export async function getTmdbReviewCards() { 
  const now = Date.now(); 
  if (tmdbReviewCardsCache && now < tmdbReviewCardsExpiry) { 
    return tmdbReviewCardsCache; 
  } 
 
  const [candidates, genres] = await Promise.all([ 
    fetchTmdbCandidates(), 
    getTmdbGenres(), 
  ]); 
 
  const topCandidates = candidates 
    .slice() 
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)) 
    .slice(0, 35); 
 
  console.log(`🎬 [TMDB] Evaluating reviews for ${topCandidates.length} top candidates...`); 
 
  const cards = await pMap( 
    topCandidates, 
    async (item) => { 
      const mediaType = item.media_type === "tv" ? "tv" : "movie"; 
      const isAnime = isAnimeItem(item); 


      // Fetch reviews for this title
      let reviewsData;
      try {
        reviewsData = await tmdbFetch(`/${mediaType}/${item.id}/reviews`);
      } catch (err) {
        return null;
      }

      const reviewsList = reviewsData.results || [];
      if (reviewsList.length === 0) {
        return null; // Drop titles with zero reviews
      }

      const scored = reviewsList
        .map((rev) => ({ rev, score: scoreReview(rev) }))
        .filter((entry) => entry.score > -20)
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) return null;

      // Select up to 2 best quality reviews for this title
      const topReviews = scored.slice(0, 2).map((entry) => entry.rev);

      const titleYear =
        item.release_date?.substring(0, 4) ||
        item.first_air_date?.substring(0, 4) ||
        undefined;

      const itemGenres = (item.genre_ids || [])
        .map((gid) => genres[gid])
        .filter(Boolean)
        .slice(0, 3);

      const category = isAnime ? "anime" : mediaType === "tv" ? "series" : "movie";
      const mediaLabel = isAnime ? "Anime" : mediaType === "tv" ? "Series" : "Movie";

      return topReviews.map((rev) => {
        const rawRating = rev.author_details?.rating;
        const normalizedRating =
          rawRating !== null && rawRating !== undefined && !Number.isNaN(Number(rawRating))
            ? Math.round(Number(rawRating) * 10) / 10
            : undefined;

        return {
          id: `tmdb:${item.id}:${rev.id}`,
          source: "tmdb",
          category,
          titleId: String(item.id),
          title: item.title || item.name || "Untitled",
          year: titleYear ? parseInt(titleYear, 10) : undefined,
          mediaLabel,
          posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}/w342${item.poster_path}` : undefined,
          backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE}/w780${item.backdrop_path}` : undefined,
          genres: itemGenres,
          rating: normalizedRating,
          ratingKind: "review",
          excerpt: createExcerpt(rev.content, 220),
          excerptKind: "review",
          rawContent: rev.content,
          author: {
            name: rev.author_details?.username || rev.author || "Anonymous",
            avatarUrl: resolveAvatarUrl(rev.author_details?.avatar_path),
          },
          createdAt: rev.created_at || new Date().toISOString(),
          containsSpoilers: /spoiler/i.test(rev.content),
          detailHref: `/reviews/tmdb/${item.id}/${rev.id}`,
          mediaType,
          likes: item.vote_count || 0,
          comments: reviewsData.total_results || reviewsList.length || 0,
        };
      });
    },
    12
  );

  const validCards = cards.filter(Boolean).flat();
  console.log(`🎬 [TMDB] Successfully built ${validCards.length} review cards.`);

  tmdbReviewCardsCache = validCards; 
  tmdbReviewCardsExpiry = now + 60 * 60 * 1000; 
  return validCards; 
}

let tmdbAnimeCardsCache = null;
let tmdbAnimeCardsExpiry = 0;

/**
 * Fetch and build cards specifically for Anime (movies and series)
 */
export async function getTmdbAnimeCards() {
  const now = Date.now();
  if (tmdbAnimeCardsCache && now < tmdbAnimeCardsExpiry) {
    return tmdbAnimeCardsCache;
  }

  console.log("🎌 [TMDB] Fetching anime candidates...");

  const [tvVoted, movieVoted, tvPopular] = await Promise.all([
    tmdbFetch("/discover/tv", {
      with_genres: "16",
      with_original_language: "ja",
      sort_by: "vote_count.desc",
      page: 1,
    }).catch(() => ({ results: [] })),
    tmdbFetch("/discover/movie", {
      with_genres: "16",
      with_original_language: "ja",
      sort_by: "vote_count.desc",
      page: 1,
    }).catch(() => ({ results: [] })),
    tmdbFetch("/discover/tv", {
      with_genres: "16",
      with_original_language: "ja",
      sort_by: "popularity.desc",
      page: 1,
    }).catch(() => ({ results: [] })),
  ]);

  const candidates = [
    ...(tvVoted.results || []).map((i) => ({ ...i, media_type: "tv" })),
    ...(movieVoted.results || []).map((i) => ({ ...i, media_type: "movie" })),
    ...(tvPopular.results || []).map((i) => ({ ...i, media_type: "tv" })),
  ];

  const seen = new Set();
  const deduped = [];
  for (const it of candidates) {
    if (!it || !it.id) continue;
    const key = `${it.media_type || "tv"}:${it.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(it);
    }
  }

  const genres = await getTmdbGenres();

  const cards = await pMap(
    deduped.slice(0, 35),
    async (item) => {
      const mediaType = item.media_type === "movie" ? "movie" : "tv";

      let reviewsData;
      try {
        reviewsData = await tmdbFetch(`/${mediaType}/${item.id}/reviews`);
      } catch {
        return null;
      }

      const reviewsList = reviewsData.results || [];
      if (reviewsList.length === 0) return null;

      const scored = reviewsList
        .map((rev) => ({ rev, score: scoreReview(rev) }))
        .filter((entry) => entry.score > -20)
        .sort((a, b) => b.score - a.score);

      if (scored.length === 0) return null;

      const topReviews = scored.slice(0, 2).map((entry) => entry.rev);

      const titleYear =
        item.release_date?.substring(0, 4) ||
        item.first_air_date?.substring(0, 4) ||
        undefined;

      const itemGenres = (item.genre_ids || [])
        .map((gid) => genres[gid])
        .filter(Boolean)
        .slice(0, 3);

      return topReviews.map((rev) => {
        const rawRating = rev.author_details?.rating;
        const normalizedRating =
          rawRating !== null && rawRating !== undefined && !Number.isNaN(Number(rawRating))
            ? Math.round(Number(rawRating) * 10) / 10
            : undefined;

        return {
          id: `tmdb:${item.id}:${rev.id}`,
          source: "tmdb",
          category: "anime",
          titleId: String(item.id),
          title: item.title || item.name || "Untitled",
          year: titleYear ? parseInt(titleYear, 10) : undefined,
          mediaLabel: "Anime",
          posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}/w342${item.poster_path}` : undefined,
          backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE}/w780${item.backdrop_path}` : undefined,
          genres: itemGenres,
          rating: normalizedRating,
          ratingKind: "review",
          excerpt: createExcerpt(rev.content, 220),
          excerptKind: "review",
          rawContent: rev.content,
          author: {
            name: rev.author_details?.username || rev.author || "Anonymous",
            avatarUrl: resolveAvatarUrl(rev.author_details?.avatar_path),
          },
          createdAt: rev.created_at || new Date().toISOString(),
          containsSpoilers: /spoiler/i.test(rev.content),
          detailHref: `/reviews/tmdb/${item.id}/${rev.id}`,
          mediaType,
          mediaRoute: mediaType === "tv" ? `/series/${item.id}` : `/movie/${item.id}`,
          likes: item.vote_count || 0,
          comments: reviewsData.total_results || reviewsList.length || 0,
        };
      });
    },
    8
  );

  const validCards = cards.filter(Boolean).flat();
  console.log(`🎌 [TMDB] Successfully built ${validCards.length} anime review cards.`);

  tmdbAnimeCardsCache = validCards;
  tmdbAnimeCardsExpiry = now + 60 * 60 * 1000;
  return validCards;
}

/**
 * Search TMDB and build reviews for query
 */
export async function searchTmdbReviews(query) {
  if (!query || !query.trim()) return [];

  const genres = await getTmdbGenres();
  const searchRes = await tmdbFetch("/search/multi", { query: query.trim() });
  const rawResults = searchRes.results || [];

  // Filter for movie/tv or known_for from persons
  const candidateItems = [];
  for (const it of rawResults) {
    if (it.media_type === "movie" || it.media_type === "tv") {
      candidateItems.push(it);
    } else if (it.media_type === "person" && Array.isArray(it.known_for)) {
      for (const k of it.known_for) {
        if (k.media_type === "movie" || k.media_type === "tv") {
          candidateItems.push(k);
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  const deduped = [];
  for (const c of candidateItems) {
    const key = `${c.media_type}:${c.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }

  const cards = await pMap(
    deduped.slice(0, 15),
    async (item) => {
      const mediaType = item.media_type === "tv" ? "tv" : "movie";
      const isAnime = isAnimeItem(item);

      let reviewsData;
      try {
        reviewsData = await tmdbFetch(`/${mediaType}/${item.id}/reviews`);
      } catch {
        return null;
      }

      const reviewsList = reviewsData.results || [];
      if (reviewsList.length === 0) return null;

      const best = selectBestReview(reviewsList);
      if (!best) return null;

      const rawRating = best.author_details?.rating;
      const normalizedRating =
        rawRating !== null && rawRating !== undefined && !Number.isNaN(Number(rawRating))
          ? Math.round(Number(rawRating) * 10) / 10
          : undefined;

      const titleYear =
        item.release_date?.substring(0, 4) ||
        item.first_air_date?.substring(0, 4) ||
        undefined;

      const itemGenres = (item.genre_ids || [])
        .map((gid) => genres[gid])
        .filter(Boolean)
        .slice(0, 3);

      const category = isAnime ? "anime" : mediaType === "tv" ? "series" : "movie";
      const mediaLabel = isAnime ? "Anime" : mediaType === "tv" ? "Series" : "Movie";

      return {
        id: `tmdb:${item.id}:${best.id}`,
        source: "tmdb",
        category,
        titleId: String(item.id),
        title: item.title || item.name || "Untitled",
        year: titleYear ? parseInt(titleYear, 10) : undefined,
        mediaLabel,
        posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}/w342${item.poster_path}` : undefined,
        backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE}/w780${item.backdrop_path}` : undefined,
        genres: itemGenres,
        rating: normalizedRating,
        ratingKind: "review",
        excerpt: createExcerpt(best.content, 220),
        excerptKind: "review",
        rawContent: best.content,
        author: {
          name: best.author_details?.username || best.author || "Anonymous",
          avatarUrl: resolveAvatarUrl(best.author_details?.avatar_path),
        },
        createdAt: best.created_at || new Date().toISOString(),
        containsSpoilers: /spoiler/i.test(best.content),
        detailHref: `/reviews/tmdb/${item.id}/${best.id}`,
        mediaType,
        likes: item.vote_count || 0,
        comments: reviewsList.length || 0,
      };
    },
    6
  );

  return cards.filter(Boolean);
}

/**
 * Fetch detailed review for a specific title & reviewId
 */
export async function getTmdbReviewDetail(titleId, reviewId) {
  // First attempt movie, then tv
  let movieDetail = null;
  let isTv = false;

  try {
    movieDetail = await tmdbFetch(`/movie/${titleId}`, { append_to_response: "reviews" });
  } catch {
    try {
      movieDetail = await tmdbFetch(`/tv/${titleId}`, { append_to_response: "reviews" });
      isTv = true;
    } catch (err) {
      throw new Error(`Title not found: ${err.message}`);
    }
  }

  const reviews = movieDetail.reviews?.results || [];
  let matchingReview = reviews.find((r) => r.id === reviewId) || reviews[0];

  if (!matchingReview) {
    throw new Error(`Review not found for title ${titleId}`);
  }

  const rawRating = matchingReview.author_details?.rating;
  const normalizedRating =
    rawRating !== null && rawRating !== undefined && !Number.isNaN(Number(rawRating))
      ? Math.round(Number(rawRating) * 10) / 10
      : undefined;

  const year =
    movieDetail.release_date?.substring(0, 4) ||
    movieDetail.first_air_date?.substring(0, 4) ||
    "";

  const isAnime = isAnimeItem(movieDetail);
  const category = isAnime ? "anime" : isTv ? "series" : "movie";
  const mediaLabel = isAnime ? "Anime" : isTv ? "Series" : "Movie";

  return {
    id: `tmdb:${titleId}:${matchingReview.id}`,
    source: "tmdb",
    category,
    titleId: String(titleId),
    title: movieDetail.title || movieDetail.name || "Untitled",
    tagline: movieDetail.tagline || "",
    year: year ? parseInt(year, 10) : undefined,
    mediaLabel,
    posterUrl: movieDetail.poster_path ? `${TMDB_IMAGE_BASE}/w780${movieDetail.poster_path}` : undefined,
    backdropUrl: movieDetail.backdrop_path ? `${TMDB_IMAGE_BASE}/original${movieDetail.backdrop_path}` : undefined,
    genres: (movieDetail.genres || []).map((g) => g.name).slice(0, 4),
    rating: normalizedRating,
    ratingKind: "review",
    content: matchingReview.content,
    excerpt: createExcerpt(matchingReview.content, 220),
    excerptKind: "review",
    author: {
      name: matchingReview.author_details?.username || matchingReview.author || "Anonymous",
      avatarUrl: resolveAvatarUrl(matchingReview.author_details?.avatar_path),
    },
    createdAt: matchingReview.created_at || new Date().toISOString(),
    containsSpoilers: /spoiler/i.test(matchingReview.content),
    externalUrl: matchingReview.url || `https://www.themoviedb.org/${isTv ? "tv" : "movie"}/${titleId}`,
    mediaRoute: isTv ? `/series/${titleId}` : `/movie/${titleId}`,
    likes: movieDetail.vote_count || 0,
    comments: reviews.length || 0,
  };
}

/**
 * Get Featured Review (#1 trending movie of the week with an acceptable review)
 */
export async function getTmdbFeaturedReview() {
  const now = Date.now();
  if (tmdbFeaturedReviewCache && now < tmdbFeaturedReviewExpiry) {
    return tmdbFeaturedReviewCache;
  }

  if (tmdbFeaturedReviewPromise) {
    return tmdbFeaturedReviewPromise;
  }

  tmdbFeaturedReviewPromise = (async () => {
    try {
      const trendingData = await tmdbFetch("/trending/movie/week");
      const trendingMovies = trendingData.results || [];

      for (const movie of trendingMovies) {
        try {
          const reviewsData = await tmdbFetch(`/movie/${movie.id}/reviews`);
          const reviewsList = reviewsData.results || [];
          if (reviewsList.length === 0) continue;

          const best = selectBestReview(reviewsList);
          if (!best) continue;

          // Get movie details for tagline
          let movieDetail;
          try {
            movieDetail = await tmdbFetch(`/movie/${movie.id}`);
          } catch {
            movieDetail = movie;
          }

          const genres = await getTmdbGenres();
          const genreNames = (movie.genre_ids || [])
            .map((id) => genres[id])
            .filter(Boolean)
            .slice(0, 3);

          const rawRating = best.author_details?.rating;
          const normalizedRating =
            rawRating !== null && rawRating !== undefined && !Number.isNaN(Number(rawRating))
              ? Math.round(Number(rawRating) * 10) / 10
              : 8.5;

          const year = movie.release_date?.substring(0, 4) || "";

          const card = {
            id: `tmdb:${movie.id}:${best.id}`,
            source: "tmdb",
            category: "movie",
            titleId: String(movie.id),
            title: movie.title || "Untitled",
            year: year ? parseInt(year, 10) : undefined,
            mediaLabel: "Movie",
            tagline: movieDetail.tagline || genreNames.join(" · "),
            posterUrl: movie.poster_path ? `${TMDB_IMAGE_BASE}/w342${movie.poster_path}` : undefined,
            backdropUrl: movie.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}` : undefined,
            genres: genreNames,
            rating: normalizedRating,
            ratingKind: "review",
            excerpt: createExcerpt(best.content, 260),
            rawContent: best.content,
            excerptKind: "review",
            author: {
              name: best.author_details?.username || best.author || "Anonymous",
              avatarUrl: resolveAvatarUrl(best.author_details?.avatar_path),
            },
            createdAt: best.created_at || new Date().toISOString(),
            containsSpoilers: /spoiler/i.test(best.content),
            detailHref: `/reviews/tmdb/${movie.id}/${best.id}`,
            likes: movie.vote_count || 0,
            comments: reviewsList.length || 0,
          };

          const result = {
            item: card,
            heroBackdropUrl: movie.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${movie.backdrop_path}` : undefined,
          };

          tmdbFeaturedReviewCache = result;
          tmdbFeaturedReviewExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes
          return result;
        } catch {
          continue;
        }
      }

      return null;
    } finally {
      tmdbFeaturedReviewPromise = null;
    }
  })();

  return tmdbFeaturedReviewPromise;
}

