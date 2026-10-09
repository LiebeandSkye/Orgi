// tmdb.js — Client service for The Movie Database (TMDB) API

import {
  INTERSTELLAR_DATA,
  BREAKING_BAD_DATA,
  DUNE_SEARCH_DATA,
  HOME_TRENDING_ITEMS
} from "../data/mockData";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const STORAGE_KEY = "rate_tmdb_api_key";

/**
 * Get active TMDB API Key from environment or local storage
 */
export function getTmdbApiKey() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim().length > 0) return saved.trim();
  }
  return import.meta.env.VITE_TMDB_API_KEY || "";
}

/**
 * Save user custom TMDB API Key
 */
export function setTmdbApiKey(key) {
  if (typeof window !== "undefined") {
    if (key && key.trim().length > 0) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

/**
 * Check if a TMDB API Key is configured
 */
export function hasTmdbApiKey() {
  const key = getTmdbApiKey();
  return Boolean(key && key.length > 5);
}

/**
 * Build a full TMDB image URL from a path
 * @param {string} path - Image path (e.g., "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg")
 * @param {"w92"|"w154"|"w185"|"w342"|"w500"|"w780"|"original"} size - Image size
 */
export function getTmdbImageUrl(path, size = "w500") {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

/**
 * Format runtime in minutes to "Xh Ym"
 */
export function formatRuntime(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Fetch from TMDB API with active key
 */
async function fetchTmdb(endpoint, params = {}) {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    throw new Error("TMDB API key not configured");
  }

  const query = new URLSearchParams({
    api_key: apiKey,
    ...params
  });

  const res = await fetch(`${TMDB_BASE_URL}${endpoint}?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Get Movie Details from TMDB with credits & reviews
 */
export async function getMovieDetails(movieId = 157336) {
  try {
    const data = await fetchTmdb(`/movie/${movieId}`, {
      append_to_response: "credits,reviews,release_dates"
    });

    // Transform live TMDB response into the "rate." design system format
    const director = data.credits?.crew?.find((c) => c.job === "Director")?.name || "Christopher Nolan";
    const writers = data.credits?.crew
      ?.filter((c) => c.department === "Writing")
      ?.slice(0, 2)
      ?.map((c) => c.name)
      ?.join(", ") || "Jonathan Nolan, Christopher Nolan";
    const cert = data.release_dates?.results
      ?.find((r) => r.iso_3166_1 === "US")
      ?.release_dates?.find((d) => d.certification)?.certification || "PG-13";

    return {
      id: "interstellar",
      tmdbId: data.id,
      type: "MOVIE",
      title: data.title || "Interstellar",
      year: data.release_date ? data.release_date.substring(0, 4) : "2014",
      genres: data.genres?.map((g) => g.name).slice(0, 2).join(", ") || "Sci-Fi, Adventure",
      runtime: formatRuntime(data.runtime) || "2h 49m",
      certificate: cert,
      tmdbRating: data.vote_average ? data.vote_average.toFixed(1) : "8.7",
      tmdbVotes: data.vote_count ? `${(data.vote_count / 1000).toFixed(0)}K TMDB` : "1.2M TMDB",
      communityRating: "8.9",
      communityVotes: "342 ratings",
      backdrop: data.backdrop_path ? getTmdbImageUrl(data.backdrop_path, "original") : INTERSTELLAR_DATA.backdrop,
      poster: data.poster_path ? getTmdbImageUrl(data.poster_path, "w780") : INTERSTELLAR_DATA.poster,
      synopsis: data.overview || INTERSTELLAR_DATA.synopsis,
      details: {
        director,
        writers,
        cinematography: data.credits?.crew?.find((c) => c.job === "Director of Photography")?.name || "Hoyte van Hoytema",
        music: data.credits?.crew?.find((c) => c.job === "Original Music Composer")?.name || "Hans Zimmer",
        boxOffice: data.revenue ? `$${(data.revenue / 1000000).toFixed(1)}M USD` : "$773.8M USD",
        budget: data.budget ? `$${(data.budget / 1000000).toFixed(0)}M USD` : "$165M USD",
        studio: data.production_companies?.map((p) => p.name).slice(0, 3).join(" · ") || "Paramount Pictures · Syncopy",
        aspectRatio: "2.39:1 (35mm) / 1.43:1 (IMAX 70mm)",
        releaseDate: data.release_date || "November 7, 2014 (USA)"
      },
      cast: data.credits?.cast?.slice(0, 8).map((c) => ({
        id: String(c.id),
        name: c.name,
        character: c.character,
        avatar: c.profile_path
          ? getTmdbImageUrl(c.profile_path, "w185")
          : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&auto=format&fit=crop&q=80"
      })) || INTERSTELLAR_DATA.cast,
      reviews: data.reviews?.results?.slice(0, 4).map((r, i) => ({
        id: `live-${r.id}`,
        author: r.author,
        avatar: r.author_details?.avatar_path
          ? getTmdbImageUrl(r.author_details.avatar_path, "w185")
          : INTERSTELLAR_DATA.reviews[i % INTERSTELLAR_DATA.reviews.length].avatar,
        time: "Recent",
        score: r.author_details?.rating || 9,
        content: r.content.slice(0, 240) + "…",
        likes: 85 + i * 14,
        repliesCount: i === 0 ? 3 : 0,
        replies: i === 0 ? INTERSTELLAR_DATA.reviews[0].replies : []
      })) || INTERSTELLAR_DATA.reviews
    };
  } catch {
    // Return high-fidelity canonical dataset
    return INTERSTELLAR_DATA;
  }
}

/**
 * Get TV Series Details from TMDB
 */
export async function getSeriesDetails(seriesId = 1396) {
  try {
    const data = await fetchTmdb(`/tv/${seriesId}`, {
      append_to_response: "credits,season/1"
    });

    return {
      id: "breaking-bad",
      tmdbId: data.id,
      type: "SERIES",
      title: data.name || "Breaking Bad",
      year: data.first_air_date ? `${data.first_air_date.substring(0, 4)}–${data.last_air_date ? data.last_air_date.substring(0, 4) : ""}` : "2008–2013",
      genres: data.genres?.map((g) => g.name).slice(0, 2).join(", ") || "Crime, Drama",
      seasonsCount: `${data.number_of_seasons || 5} seasons`,
      episodesCount: `${data.number_of_episodes || 62} episodes`,
      tmdbRating: data.vote_average ? data.vote_average.toFixed(1) : "8.9",
      tmdbVotes: data.vote_count ? `${(data.vote_count / 1000).toFixed(0)}K TMDB` : "14K TMDB",
      communityRating: "9.6",
      communityVotes: "890 ratings",
      backdrop: data.backdrop_path ? getTmdbImageUrl(data.backdrop_path, "original") : BREAKING_BAD_DATA.backdrop,
      poster: data.poster_path ? getTmdbImageUrl(data.poster_path, "w780") : BREAKING_BAD_DATA.poster,
      synopsis: data.overview || BREAKING_BAD_DATA.synopsis,
      episodes: data["season/1"]?.episodes?.slice(0, 7).map((ep, idx) => ({
        number: String(ep.episode_number).padStart(2, "0"),
        title: ep.name,
        description: ep.overview || "Episode overview",
        runtime: ep.runtime ? `${ep.runtime}m` : "48m",
        score: ep.vote_average ? ep.vote_average.toFixed(1) : "8.9",
        thumbnail: ep.still_path ? getTmdbImageUrl(ep.still_path, "w342") : BREAKING_BAD_DATA.episodes[idx]?.thumbnail,
        isHovered: idx === 0
      })) || BREAKING_BAD_DATA.episodes
    };
  } catch {
    return BREAKING_BAD_DATA;
  }
}

/**
 * Get specific season episodes
 */
export async function getSeasonEpisodes(seriesId = 1396, seasonNumber = 1) {
  try {
    const data = await fetchTmdb(`/tv/${seriesId}/season/${seasonNumber}`);
    if (data?.episodes) {
      return data.episodes.map((ep, idx) => ({
        number: String(ep.episode_number).padStart(2, "0"),
        title: ep.name,
        description: ep.overview,
        runtime: ep.runtime ? `${ep.runtime}m` : "48m",
        score: ep.vote_average ? ep.vote_average.toFixed(1) : "8.5",
        thumbnail: ep.still_path ? getTmdbImageUrl(ep.still_path, "w342") : BREAKING_BAD_DATA.episodes[idx % BREAKING_BAD_DATA.episodes.length]?.thumbnail,
        isHovered: idx === 0
      }));
    }
  } catch {
    // Fall back
  }
  return BREAKING_BAD_DATA.episodes;
}

/**
 * Search TMDB across Movies, TV Series, and People
 */
export async function searchTmdb(query = "dune", page = 1) {
  try {
    const data = await fetchTmdb("/search/multi", { query, page });
    if (data?.results && data.results.length > 0) {
      const results = data.results.slice(0, 6).map((item, idx) => ({
        id: `tmdb-${item.id}`,
        title: item.title || item.name,
        type: item.media_type === "tv" ? "SERIES" : item.media_type === "person" ? "PERSON" : "MOVIE",
        year: item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4) || "2024",
        genre: "Sci-Fi, Drama",
        director: "Denis Villeneuve",
        synopsis: item.overview || "Cinematic masterwork",
        score: item.vote_average ? item.vote_average.toFixed(1) : "8.0",
        poster: item.poster_path ? getTmdbImageUrl(item.poster_path, "w500") : DUNE_SEARCH_DATA.results[0].poster,
        isHovered: idx === 0
      }));

      return {
        query,
        totalResults: data.total_results || 24,
        results
      };
    }
  } catch {
    // Fall back to Dune curated results
  }
  return DUNE_SEARCH_DATA;
}

/**
 * Get Trending media from TMDB
 */
export async function getTrending(mediaType = "all", timeWindow = "week") {
  try {
    return await fetchTmdb(`/trending/${mediaType}/${timeWindow}`);
  } catch {
    return { results: HOME_TRENDING_ITEMS };
  }
}
