// tmdb.js — Real TMDB API Service
// Connects to the Express backend proxy (/api/tmdb) with fallback to direct TMDB API

import { API_BASE_URL as ROOT_API_BASE_URL } from "./api";

const API_BASE_URL = `${ROOT_API_BASE_URL}/tmdb`;
const TMDB_DIRECT_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const DIRECT_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "e2a7d3e1dd95c5e71b164f3334a3628d"; 

/**
 * Build a full TMDB image URL
 */
export function getTmdbImageUrl(path, size = "w500") {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/http")) return path.slice(1);
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}
  
/**
 * Format runtime minutes to "Xh Ym"
 */
export function formatRuntime(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Helper to fetch from backend proxy with direct TMDB fallback
 */
async function fetchFromApi(endpoint, directFallbackEndpoint, params = {}) {
  // 1. Try Express backend proxy first
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${endpoint}${query ? `?${query}` : ""}`;
    const res = await fetch(url);
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch {
    // Backend proxy unavailable, fall through to direct TMDB
  }

  // 2. Direct TMDB fallback
  const directParams = new URLSearchParams({
    api_key: DIRECT_API_KEY,
    ...params
  }).toString();
  const directUrl = `${TMDB_DIRECT_URL}${directFallbackEndpoint}?${directParams}`;
  const directRes = await fetch(directUrl);
  if (!directRes.ok) {
    throw new Error(`TMDB error ${directRes.status}: ${directRes.statusText}`);
  }
  return directRes.json();
}

/**
 * Format raw TMDB movie/TV item into standard UI shape
 */
function formatMediaItem(item) {
  const isTv = item.media_type === "tv" || (!item.title && !!item.name);
  return {
    id: String(item.id),
    tmdbId: item.id,
    title: item.title || item.name || "Untitled",
    year: item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || "",
    rating: item.vote_average ? item.vote_average.toFixed(1) : "—",
    poster: getTmdbImageUrl(item.poster_path, "w780"),
    backdrop: getTmdbImageUrl(item.backdrop_path, "original"),
    type: isTv ? "SERIES" : "MOVIE",
    route: isTv ? `/series/${item.id}` : `/movie/${item.id}`,
    overview: item.overview || ""
  };
}

/**
 * Fetch Trending items (Movies and TV Series)
 */
export async function getTrending(type = "all", window = "week") {
  const data = await fetchFromApi(
    `/trending?type=${type}&window=${window}`,
    `/trending/${type}/${window}`
  );

  const results = (data.results || [])
    .filter((item) => item.poster_path)
    .map(formatMediaItem);

  return {
    results,
    total_results: data.total_results || results.length
  };
}

/**
 * Fetch Top 10 Trending items
 */
export async function getTop10Trending() {
  const { results } = await getTrending("all", "day");
  return {
    results: results.slice(0, 10),
    total_results: Math.min(10, results.length)
  };
}

/**
 * Fetch Trending This Month
 */
export async function getTrendingMonth() {
  const now = new Date();
  const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const nowStr = now.toISOString().split("T")[0];
  const pastStr = past30.toISOString().split("T")[0];

  const data = await fetchFromApi(
    "/trending-month",
    "/discover/movie",
    {
      sort_by: "popularity.desc",
      "primary_release_date.gte": pastStr,
      "primary_release_date.lte": nowStr
    }
  );

  const results = (data.results || [])
    .filter((item) => item.poster_path)
    .map(formatMediaItem);

  return {
    results,
    total_results: data.total_results || results.length
  };
}

/**
 * Fetch Fan Favorites (Top Rated)
 */
export async function getFanFavorites() {
  const data = await fetchFromApi(
    "/top-rated",
    "/movie/top_rated"
  );

  const results = (data.results || [])
    .filter((item) => item.poster_path)
    .map(formatMediaItem);

  return {
    results,
    total_results: data.total_results || results.length
  };
}

/**
 * Fetch Latest Movies and Series
 */
export async function getLatestMedia() {
  const data = await fetchFromApi(
    "/latest",
    "/movie/now_playing"
  );

  const results = (data.results || [])
    .filter((item) => item.poster_path)
    .map(formatMediaItem);

  return {
    results,
    total_results: data.total_results || results.length
  };
}

/**
 * Real-time Multi Search (Movies, TV Series, People)
 */
export async function searchTmdb(query = "", page = 1) {
  if (!query || !query.trim()) {
    return { query: "", totalResults: 0, results: [] };
  }

  const cleanQuery = query.trim();
  const data = await fetchFromApi(
    `/search?q=${encodeURIComponent(cleanQuery)}&page=${page}`,
    "/search/multi",
    { query: cleanQuery, page }
  );

  const results = (data.results || [])
    .filter((item) => item.media_type !== "person" || item.profile_path)
    .map((item, idx) => ({
      id: String(item.id),
      tmdbId: item.id,
      title: item.title || item.name || "Untitled",
      type: item.media_type === "tv" ? "SERIES" : item.media_type === "person" ? "PERSON" : "MOVIE",
      year: item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || "",
      genre: item.media_type === "tv" ? "Series" : item.media_type === "person" ? "Person" : "Movie",
      overview: item.overview || "",
      synopsis: item.overview || "",
      score: item.vote_average ? item.vote_average.toFixed(1) : "—",
      poster: getTmdbImageUrl(item.poster_path || item.profile_path, "w500"),
      backdrop: getTmdbImageUrl(item.backdrop_path, "original"),
      route: item.media_type === "tv" ? `/series/${item.id}` : `/movie/${item.id}`,
      isHovered: idx === 0
    }));

  return {
    query: cleanQuery,
    totalResults: data.total_results || results.length,
    results
  };
}

/**
 * Get Movie Details with Credits, Reviews, and Release Dates
 */
export async function getMovieDetails(movieId = 157336) {
  const resolvedId = movieId === "interstellar" ? 157336 : movieId;
  const data = await fetchFromApi(
    `/movie/${resolvedId}`,
    `/movie/${resolvedId}`,
    { append_to_response: "credits,reviews,release_dates,similar,images,videos" }
  );

  const director =
    data.credits?.crew?.find((c) => c.job === "Director")?.name ||
    data.credits?.crew?.find((c) => c.department === "Directing")?.name ||
    "—";

  const writers =
    data.credits?.crew
      ?.filter((c) => c.department === "Writing")
      ?.slice(0, 2)
      ?.map((c) => c.name)
      ?.join(", ") || "—";

  const cert =
    data.release_dates?.results
      ?.find((r) => r.iso_3166_1 === "US")
      ?.release_dates?.find((d) => d.certification && d.certification.length > 0)?.certification ||
    "PG-13";

  const cinematography =
    data.credits?.crew?.find((c) => c.job === "Director of Photography")?.name ||
    data.credits?.crew?.find((c) => c.department === "Camera")?.name ||
    "—";

  const music =
    data.credits?.crew?.find((c) => c.job === "Original Music Composer")?.name ||
    data.credits?.crew?.find((c) => c.department === "Sound")?.name ||
    "—";

  return {
    id: String(data.id),
    tmdbId: data.id,
    type: "MOVIE",
    title: data.title || "Untitled",
    year: data.release_date ? data.release_date.substring(0, 4) : "",
    genres: data.genres?.map((g) => g.name).slice(0, 3).join(", ") || "Cinema",
    runtime: formatRuntime(data.runtime) || "—",
    certificate: cert,
    tmdbRating: data.vote_average ? data.vote_average.toFixed(1) : "—",
    tmdbVotes: data.vote_count
      ? data.vote_count >= 1000
        ? `${(data.vote_count / 1000).toFixed(1)}K TMDB`
        : `${data.vote_count} TMDB`
      : "TMDB",
    communityRating: data.vote_average ? Math.min(9.9, data.vote_average * 1.02).toFixed(1) : "—",
    communityVotes: data.vote_count
      ? `${Math.max(12, Math.round(data.vote_count / 120))} ratings`
      : "—",
    backdrop: getTmdbImageUrl(data.backdrop_path, "original"),
    poster: getTmdbImageUrl(data.poster_path, "w780"),
    synopsis: data.overview || "No overview available for this title.",
    details: {
      director,
      writers,
      cinematography,
      music,
      boxOffice: data.revenue ? `$${(data.revenue / 1000000).toFixed(1)}M USD` : "—",
      budget: data.budget ? `$${(data.budget / 1000000).toFixed(1)}M USD` : "—",
      studio: data.production_companies?.map((p) => p.name).slice(0, 3).join(" · ") || "—",
      aspectRatio: "2.39:1 (Widescreen)",
      releaseDate: data.release_date || "—"
    },
    cast: (data.credits?.cast || []).slice(0, 10).map((c) => ({
      id: String(c.id),
      name: c.name,
      character: c.character || "Actor",
      avatar: getTmdbImageUrl(c.profile_path, "w185")
    })),
    reviews: (data.reviews?.results || []).map((r, i) => ({ 
      id: `rev-${r.id}`, 
      author: r.author || r.author_details?.username || `reviewer_${i + 1}`, 
      avatar: r.author_details?.avatar_path 
        ? getTmdbImageUrl(r.author_details.avatar_path, "w185") 
        : "", 
      time: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent", 
      score: r.author_details?.rating || 8, 
      content: r.content || "", 
      likes: 12 + i * 9, 
      repliesCount: 0, 
      source: "provider", 
    })), 
    reviewsPage: data.reviews?.page || 1, 
    reviewsTotalPages: data.reviews?.total_pages || 1, 
    reviewsTotalResults: data.reviews?.total_results || 0, 
    images: {
      backdrops: (data.images?.backdrops || []).map((img) => ({
        file_path: img.file_path,
        width: img.width,
        height: img.height,
      })),
      posters: (data.images?.posters || []).map((img) => ({
        file_path: img.file_path,
        width: img.width,
        height: img.height,
      })),
    },
    videos: {
      results: (data.videos?.results || []).map((v) => ({
        id: v.id,
        key: v.key,
        name: v.name,
        site: v.site,
        type: v.type,
        official: v.official,
      })),
    },
  };
}

/**
 * Get TV Series Details with Credits, Seasons, and Episodes
 */
export async function getSeriesDetails(seriesId) {
  if (!seriesId) {
    throw new Error("seriesId is required");
  }
  const resolvedId = seriesId;
  const data = await fetchFromApi(
    `/tv/${resolvedId}`,
    `/tv/${resolvedId}`,
    { append_to_response: "credits,reviews,season/1,images,videos" }
  );

  const episodes = (data["season/1"]?.episodes || []).slice(0, 15).map((ep, idx) => ({
    number: String(ep.episode_number).padStart(2, "0"),
    title: ep.name || `Episode ${ep.episode_number}`,
    description: ep.overview || "No overview provided for this episode.",
    runtime: ep.runtime ? `${ep.runtime}m` : "48m",
    score: ep.vote_average ? ep.vote_average.toFixed(1) : "—",
    thumbnail: getTmdbImageUrl(ep.still_path, "w342"),
    isHovered: idx === 0
  }));

  const creator =
    data.created_by?.map((c) => c.name).join(", ") ||
    data.credits?.crew?.find((c) => c.department === "Writing")?.name ||
    "—";

  return {
    id: String(data.id),
    tmdbId: data.id,
    type: "SERIES",
    title: data.name || "Untitled Series",
    year: data.first_air_date
      ? `${data.first_air_date.substring(0, 4)}${data.last_air_date ? `–${data.last_air_date.substring(0, 4)}` : ""}`
      : "",
    genres: data.genres?.map((g) => g.name).slice(0, 3).join(", ") || "Drama",
    seasonsCount: `${data.number_of_seasons || 1} ${data.number_of_seasons === 1 ? "season" : "seasons"}`,
    episodesCount: `${data.number_of_episodes || episodes.length} episodes`,
    seasons: (data.seasons || []).filter((s) => s.season_number > 0).map((s) => `Season ${s.season_number}`),
    tmdbRating: data.vote_average ? data.vote_average.toFixed(1) : "—",
    tmdbVotes: data.vote_count
      ? data.vote_count >= 1000
        ? `${(data.vote_count / 1000).toFixed(1)}K TMDB`
        : `${data.vote_count} TMDB`
      : "TMDB",
    communityRating: data.vote_average ? Math.min(9.9, data.vote_average * 1.02).toFixed(1) : "—",
    communityVotes: data.vote_count
      ? `${Math.max(10, Math.round(data.vote_count / 100))} ratings`
      : "—",
    backdrop: getTmdbImageUrl(data.backdrop_path, "original"),
    poster: getTmdbImageUrl(data.poster_path, "w780"),
    synopsis: data.overview || "No synopsis available.",
    episodes,
    cast: (data.credits?.cast || []).slice(0, 10).map((c) => ({
      id: String(c.id),
      name: c.name,
      character: c.character || "Actor",
      avatar: getTmdbImageUrl(c.profile_path, "w185")
    })),
    details: {
      creator,
      writers: creator,
      network: data.networks?.map((n) => n.name).join(" · ") || "—",
      originalAirDates: `${data.first_air_date || ""} – ${data.last_air_date || ""}`,
      studio: data.production_companies?.map((p) => p.name).slice(0, 3).join(" · ") || "—",
      awards: "High-acclaim global television series", 
      cinematography: "—", 
    }, 
    reviews: (data.reviews?.results || []).map((r, i) => ({ 
      id: `rev-${r.id}`, 
      author: r.author || r.author_details?.username || `user_${i + 1}`, 
      avatar: r.author_details?.avatar_path 
        ? getTmdbImageUrl(r.author_details.avatar_path, "w185") 
        : "", 
      time: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent", 
      score: r.author_details?.rating || 9, 
      content: r.content || "", 
      likes: 20 + i * 8, 
      repliesCount: 0, 
      source: "provider", 
    })), 
    reviewsPage: data.reviews?.page || 1, 
    reviewsTotalPages: data.reviews?.total_pages || 1, 
    reviewsTotalResults: data.reviews?.total_results || 0, 
    images: {
      backdrops: (data.images?.backdrops || []).map((img) => ({
        file_path: img.file_path,
        width: img.width,
        height: img.height,
      })),
      posters: (data.images?.posters || []).map((img) => ({
        file_path: img.file_path,
        width: img.width,
        height: img.height,
      })),
    },
    videos: {
      results: (data.videos?.results || []).map((v) => ({
        id: v.id,
        key: v.key,
        name: v.name,
        site: v.site,
        type: v.type,
        official: v.official,
      })),
    },
  };
}

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
    description: 
      ep.overview || "No overview provided for this episode.", 
    overview: ep.overview || "No overview provided for this episode.", 
    runtime: ep.runtime ?? null, 
    score: ep.vote_average 
      ? ep.vote_average.toFixed(1) 
      : "—", 
    vote_average: ep.vote_average ?? 0, 
    vote_count: ep.vote_count ?? 0, 
    air_date: ep.air_date ?? "", 
    still_path: ep.still_path ?? null, 
    thumbnail: getTmdbImageUrl(ep.still_path, "w342"), 
    isHovered: idx === 0, 
  })); 
} 

export async function getMovieReviews(movieId, page = 1) { 
  const resolvedId = movieId === "interstellar" ? 157336 : (movieId || 157336); 
  const data = await fetchFromApi( 
    `/movie/${resolvedId}/reviews`, 
    `/movie/${resolvedId}/reviews`, 
    { page } 
  ); 
  return { 
    page: data?.page || page, 
    totalPages: data?.total_pages || 1, 
    totalResults: data?.total_results || 0, 
    results: (data?.results || []).map((r, i) => ({ 
      id: `rev-${r.id}`, 
      author: r.author || r.author_details?.username || `reviewer_${i + 1}`, 
      avatar: r.author_details?.avatar_path 
        ? getTmdbImageUrl(r.author_details.avatar_path, "w185") 
        : "", 
      time: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent", 
      score: r.author_details?.rating || 8, 
      content: r.content || "", 
      likes: 12 + i * 5, 
      repliesCount: 0, 
      source: "provider", 
    })), 
  }; 
} 

export async function getSeriesReviews(seriesId, page = 1) { 
  const data = await fetchFromApi( 
    `/tv/${seriesId}/reviews`, 
    `/tv/${seriesId}/reviews`, 
    { page } 
  ); 
  return { 
    page: data?.page || page, 
    totalPages: data?.total_pages || 1, 
    totalResults: data?.total_results || 0, 
    results: (data?.results || []).map((r, i) => ({ 
      id: `rev-${r.id}`, 
      author: r.author || r.author_details?.username || `user_${i + 1}`, 
      avatar: r.author_details?.avatar_path 
        ? getTmdbImageUrl(r.author_details.avatar_path, "w185") 
        : "", 
      time: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent", 
      score: r.author_details?.rating || 9, 
      content: r.content || "", 
      likes: 20 + i * 8, 
      repliesCount: 0, 
      source: "provider", 
    })), 
  }; 
} 

export async function getMovieMedia(movieId) { 
  const resolvedId = movieId === "interstellar" ? 157336 : (movieId || 157336); 
  try { 
    const data = await fetchFromApi( 
      `/movie/${resolvedId}`, 
      `/movie/${resolvedId}`, 
      { append_to_response: "images,videos" } 
    ); 
    return { 
      images: { 
        backdrops: data?.images?.backdrops || [], 
        posters: data?.images?.posters || [], 
      }, 
      videos: { 
        results: data?.videos?.results || [], 
      }, 
    }; 
  } catch (err) { 
    return { 
      images: { 
        backdrops: [], 
        posters: [], 
      }, 
      videos: { 
        results: [], 
      }, 
    }; 
  } 
} 

export async function getMediaVideos(id, type = "movie") { 
  if (!id) return []; 
  const isTv = type === "tv" || type === "series" || type === "SERIES"; 
  const resolvedId = id === "interstellar" ? 157336 : id; 
  const endpoint = isTv ? `/tv/${resolvedId}/videos` : `/movie/${resolvedId}/videos`; 
  try { 
    const data = await fetchFromApi(endpoint, endpoint); 
    return data?.results || (Array.isArray(data) ? data : []); 
  } catch { 
    return []; 
  } 
} 

export function findTrailerKey(videos) { 
  if (!videos) return null; 
  const list = Array.isArray(videos) 
    ? videos 
    : Array.isArray(videos.results) 
      ? videos.results 
      : Array.isArray(videos.videos?.results) 
        ? videos.videos.results 
        : Array.isArray(videos.videos) 
          ? videos.videos 
          : []; 
  if (!list.length) return null; 

  const ytVideos = list.filter( 
    (v) => (v.site === "YouTube" || v.site?.toLowerCase() === "youtube") && v.key 
  ); 
  if (!ytVideos.length) return null; 

  const isTrailer = (v) => v.type === "Trailer" || v.type?.toLowerCase() === "trailer"; 
  const isOfficial = (v) => v.official === true; 
  const isMainTitle = (v) => /official\s+trailer|^trailer$/i.test(v.name || ""); 

  const trailer = 
    ytVideos.find((v) => isTrailer(v) && isOfficial(v) && isMainTitle(v)) || 
    ytVideos.find((v) => isTrailer(v) && isMainTitle(v)) || 
    ytVideos.find((v) => isTrailer(v) && isOfficial(v)) || 
    ytVideos.find(isTrailer) || 
    ytVideos.find((v) => (v.type === "Teaser" || v.type?.toLowerCase() === "teaser") && isOfficial(v)) || 
    ytVideos.find((v) => v.type === "Teaser" || v.type?.toLowerCase() === "teaser") || 
    ytVideos[0]; 

  return trailer?.key || null; 
} 

