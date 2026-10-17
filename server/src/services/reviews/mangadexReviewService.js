import { createExcerpt } from "./excerpt.js";

const MANGADEX_BASE = "https://api.mangadex.org";
const MANGADEX_COVERS = "https://uploads.mangadex.org/covers";

let mangaDexCache = { 
  manga: null, 
  mangaExpiry: 0, 
  manhwa: null, 
  manhwaExpiry: 0, 
}; 
const mangaDexPromises = {}; 
 
async function fetchMangaDexBatch(endpoint, params = {}) {
  const query = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (Array.isArray(val)) {
      for (const item of val) {
        query.append(`${key}[]`, item);
      }
    } else {
      query.append(key, val);
    }
  }

  const url = `${MANGADEX_BASE}${endpoint}?${query.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`MangaDex error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch batch statistics (ratings) for manga ids
 */
async function fetchMangaDexStatistics(ids) {
  if (!ids || ids.length === 0) return {};
  try {
    const query = ids.map((id) => `manga[]=${encodeURIComponent(id)}`).join("&");
    const res = await fetch(`${MANGADEX_BASE}/statistics/manga?${query}`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.statistics || {};
  } catch (err) {
    console.warn("[MangaDex] Stats fetch error:", err.message);
    return {};
  }
}

/**
 * Fetch and build cards for Manga or Manhwa
 * @param {'manga' | 'manhwa'} category
 * @param {number} [limit=30]
 */
export async function getMangaDexCards(category = "manga", limit = 30) {
  const now = Date.now();
  const cacheKey = category === "manhwa" ? "manhwa" : "manga";
  const expiryKey = category === "manhwa" ? "manhwaExpiry" : "mangaExpiry";

  if (mangaDexCache[cacheKey] && now < mangaDexCache[expiryKey]) { 
    return mangaDexCache[cacheKey]; 
  } 
 
  if (mangaDexPromises[cacheKey]) { 
    return mangaDexPromises[cacheKey]; 
  } 
 
  mangaDexPromises[cacheKey] = (async () => { 
    try { 
      const lang = category === "manhwa" ? "ko" : "ja"; 
      const mediaLabel = category === "manhwa" ? "Manhwa" : "Manga"; 
 
      let mangaList = []; 
      try { 
        const data = await fetchMangaDexBatch("/manga", { 
          limit, 
          originalLanguage: [lang], 
          includes: ["cover_art"], 
          contentRating: ["safe", "suggestive"], 
          "order[followedCount]": "desc", 
        }); 
        mangaList = data.data || []; 
      } catch (err) { 
        console.warn(`[MangaDex] Fetch failed for ${category}:`, err.message); 
        return []; 
      } 
 
      const ids = mangaList.map((m) => m.id); 
      const statsMap = await fetchMangaDexStatistics(ids); 
 
      const cards = []; 
      for (const item of mangaList) { 
        const attrs = item.attributes || {}; 
        const title = 
          attrs.title?.en || 
          attrs.title?.["ja-ro"] || 
          attrs.title?.["ko-ro"] || 
          Object.values(attrs.title || {})[0] || 
          "Untitled"; 
 
        const overview = 
          attrs.description?.en || 
          Object.values(attrs.description || {})[0] || 
          ""; 
 
        const coverRel = item.relationships?.find((r) => r.type === "cover_art"); 
        const coverFileName = coverRel?.attributes?.fileName; 
        const posterUrl = coverFileName 
          ? `${MANGADEX_COVERS}/${item.id}/${coverFileName}.256.jpg` 
          : undefined; 
 
        const stats = statsMap[item.id]; 
        let ratingValue = stats?.rating?.bayesian || stats?.rating?.average; 
        if (ratingValue !== undefined && ratingValue !== null) { 
          ratingValue = Math.round(Number(ratingValue) * 10) / 10; 
        } else { 
          ratingValue = undefined; 
        } 
 
        const genres = (attrs.tags || []) 
          .filter((t) => t.attributes?.group === "genre") 
          .map((t) => t.attributes?.name?.en) 
          .filter(Boolean) 
          .slice(0, 3); 
 
        const year = attrs.year || undefined; 
 
        cards.push({ 
          id: `mangadex:${item.id}:title`, 
          source: "mangadex", 
          category, 
          titleId: item.id, 
          title, 
          year: year ? parseInt(year, 10) : undefined, 
          mediaLabel, 
          posterUrl, 
          backdropUrl: undefined, 
          genres, 
          rating: ratingValue, 
          ratingKind: "community", 
          excerpt: createExcerpt(overview, 220), 
          rawContent: overview, 
          excerptKind: "synopsis", 
          author: undefined, 
          createdAt: attrs.createdAt || new Date().toISOString(), 
          containsSpoilers: false, 
          detailHref: `/reviews/mangadex/${item.id}`, 
        }); 
      } 
 
      mangaDexCache[cacheKey] = cards; 
      mangaDexCache[expiryKey] = Date.now() + 60 * 60 * 1000; 
      return cards; 
    } finally { 
      delete mangaDexPromises[cacheKey]; 
    } 
  })(); 
 
  return mangaDexPromises[cacheKey]; 
}

/**
 * Get detail for a specific MangaDex item
 */
export async function getMangaDexDetail(titleId) {
  const data = await fetchMangaDexBatch(`/manga/${titleId}`, {
    includes: ["cover_art", "author", "artist"],
  });
  const item = data.data;
  if (!item) throw new Error("MangaDex title not found");

  const attrs = item.attributes || {};
  const title =
    attrs.title?.en ||
    attrs.title?.["ja-ro"] ||
    attrs.title?.["ko-ro"] ||
    Object.values(attrs.title || {})[0] ||
    "Untitled";

  const overview =
    attrs.description?.en ||
    Object.values(attrs.description || {})[0] ||
    "";

  const coverRel = item.relationships?.find((r) => r.type === "cover_art");
  const coverFileName = coverRel?.attributes?.fileName;
  const posterUrl = coverFileName
    ? `${MANGADEX_COVERS}/${item.id}/${coverFileName}.512.jpg`
    : undefined;

  const statsMap = await fetchMangaDexStatistics([titleId]);
  const stats = statsMap[titleId];
  let ratingValue = stats?.rating?.bayesian || stats?.rating?.average;
  if (ratingValue !== undefined && ratingValue !== null) {
    ratingValue = Math.round(Number(ratingValue) * 10) / 10;
  }

  const isManhwa = attrs.originalLanguage === "ko";
  const genres = (attrs.tags || [])
    .filter((t) => t.attributes?.group === "genre")
    .map((t) => t.attributes?.name?.en)
    .filter(Boolean)
    .slice(0, 4);

  return {
    id: `mangadex:${item.id}:title`,
    source: "mangadex",
    category: isManhwa ? "manhwa" : "manga",
    titleId: item.id,
    title,
    tagline: `MangaDex Community Synopsis`,
    year: attrs.year ? parseInt(attrs.year, 10) : undefined,
    mediaLabel: isManhwa ? "Manhwa" : "Manga",
    posterUrl,
    genres,
    rating: ratingValue,
    ratingKind: "community",
    content: overview,
    excerpt: createExcerpt(overview, 220),
    excerptKind: "synopsis",
    createdAt: attrs.createdAt,
    externalUrl: `https://mangadex.org/title/${titleId}`,
    mediaRoute: `/books/${isManhwa ? "manhwa" : "manga"}/${titleId}`,
  };
}
