// tmdb.js — Real TMDB API Service
// Connects to the Express backend proxy (/api/tmdb) with fallback to direct TMDB API

const API_BASE_URL = "/api/tmdb";
const TMDB_DIRECT_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const DIRECT_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "b4ff80e1e0be756a6ca3ca60510e1231";

/**
 * Build a full TMDB image URL
 */
export function getTmdbImageUrl(path, size = "w500") {
  if (!path) return "";
  if (path.startsWith("http")) return path;
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
    if (res.ok) {
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
 * Fetch Trending items (Movies and TV Series)
 */
export async function getTrending(type = "all", window = "week") {
  const data = await fetchFromApi(
    `/trending?type=${type}&window=${window}`,
    `/trending/${type}/${window}`
  );

  const results = (data.results || [])
    .filter((item) => item.poster_path)
    .map((item) => ({
      id: String(item.id),
      tmdbId: item.id,
      title: item.title || item.name || "Untitled",
      year: item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || "",
      rating: item.vote_average ? item.vote_average.toFixed(1) : "—",
      poster: getTmdbImageUrl(item.poster_path, "w780"),
      backdrop: getTmdbImageUrl(item.backdrop_path, "original"),
      type: item.media_type === "tv" ? "SERIES" : "MOVIE",
      route: item.media_type === "tv" ? `/series/${item.id}` : `/movie/${item.id}`,
      overview: item.overview || ""
    }));

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
    { append_to_response: "credits,reviews,release_dates,similar" }
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
    reviews: (data.reviews?.results || []).slice(0, 6).map((r, i) => ({
      id: `rev-${r.id}`,
      author: r.author || `reviewer_${i + 1}`,
      avatar: r.author_details?.avatar_path
        ? getTmdbImageUrl(r.author_details.avatar_path, "w185")
        : "",
      time: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent",
      score: r.author_details?.rating || 8,
      content: r.content || "",
      likes: 12 + i * 9,
      repliesCount: 0
    }))
  };
}

/**
 * Get TV Series Details with Credits, Seasons, and Episodes
 */
export async function getSeriesDetails(seriesId = 1396) {
  const resolvedId = seriesId === "breaking-bad" ? 1396 : seriesId;
  const data = await fetchFromApi(
    `/tv/${resolvedId}`,
    `/tv/${resolvedId}`,
    { append_to_response: "credits,reviews,season/1" }
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
      cinematography: "—"
    },
    reviews: (data.reviews?.results || []).slice(0, 6).map((r, i) => ({
      id: `rev-${r.id}`,
      author: r.author || `user_${i + 1}`,
      avatar: r.author_details?.avatar_path
        ? getTmdbImageUrl(r.author_details.avatar_path, "w185")
        : "",
      time: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent",
      score: r.author_details?.rating || 9,
      content: r.content || "",
      likes: 20 + i * 8,
      repliesCount: 0
    }))
  };
}

/**
 * Get Episodes for a Specific Season of a Series
 */
export async function getSeasonEpisodes(seriesId = 1396, seasonNumber = 1) {
  const resolvedId = seriesId === "breaking-bad" ? 1396 : seriesId;
  const data = await fetchFromApi(
    `/tv/${resolvedId}/season/${seasonNumber}`,
    `/tv/${resolvedId}/season/${seasonNumber}`
  );

  return (data.episodes || []).map((ep, idx) => ({
    number: String(ep.episode_number).padStart(2, "0"),
    title: ep.name || `Episode ${ep.episode_number}`,
    description: ep.overview || "No overview provided for this episode.",
    runtime: ep.runtime ? `${ep.runtime}m` : "48m",
    score: ep.vote_average ? ep.vote_average.toFixed(1) : "—",
    thumbnail: getTmdbImageUrl(ep.still_path, "w342"),
    isHovered: idx === 0
  }));
}
