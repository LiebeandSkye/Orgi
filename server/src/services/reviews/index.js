import {
  getTmdbReviewCards,
  searchTmdbReviews,
  getTmdbFeaturedReview,
  getTmdbReviewDetail,
} from "./tmdbReviewService.js";
import { getMangaDexCards, getMangaDexDetail } from "./mangadexReviewService.js";
import { getOpenLibraryCards, getOpenLibraryDetail } from "./openLibraryReviewService.js";

/**
 * Returns capabilities object for a given category and item pool
 */
export function getCapabilitiesForCategory(category, items = []) {
  const hasRatingData = items.some((it) => it.rating !== undefined && it.rating !== null);

  switch (category) {
    case "all":
    case "movie":
    case "series":
    case "anime":
      return {
        hasRating: true,
        hasReviewText: true,
        hasLikes: true,
        hasSocial: false,
      };
    case "manga":
    case "manhwa":
      return {
        hasRating: hasRatingData,
        hasReviewText: false,
        hasLikes: false,
        hasSocial: false,
      };
    case "book":
    case "novel":
    case "light-novel":
      return {
        hasRating: hasRatingData,
        hasReviewText: false,
        hasLikes: false,
        hasSocial: false,
      };
    default:
      return {
        hasRating: true,
        hasReviewText: true,
        hasLikes: false,
        hasSocial: false,
      };
  }
}

/**
 * Get all candidate items for a category
 */
async function getItemsForCategory(category) {
  switch (category) {
    case "all": {
      const tmdbCards = await getTmdbReviewCards();
      return tmdbCards; // Only items with real review text (movies, series, anime)
    }
    case "movie": {
      const tmdbCards = await getTmdbReviewCards();
      return tmdbCards.filter((c) => c.category === "movie");
    }
    case "series": {
      const tmdbCards = await getTmdbReviewCards();
      return tmdbCards.filter((c) => c.category === "series");
    }
    case "anime": {
      const tmdbCards = await getTmdbReviewCards();
      return tmdbCards.filter((c) => c.category === "anime");
    }
    case "manga":
      return await getMangaDexCards("manga", 100);
    case "manhwa":
      return await getMangaDexCards("manhwa", 100);
    case "book":
      return await getOpenLibraryCards("book", 100);
    case "novel":
      return await getOpenLibraryCards("novel", 100);
    case "light-novel":
      return await getOpenLibraryCards("light-novel", 100);
    default:
      return await getTmdbReviewCards();
  }
}

/**
 * Core aggregator function for feed
 */
export async function queryReviews({
  category = "all",
  sort = "recent",
  minRating,
  type = "all",
  q = "",
  cursor = "0",
  page,
  limit = 25,
}) {
  const offset = Math.max(0, parseInt(cursor, 10) || 0);

  let pool = [];

  // 1. Search vs Browse
  if (q && q.trim()) {
    pool = await searchTmdbReviews(q.trim());
    if (category !== "all") {
      pool = pool.filter((it) => it.category === category);
    }
  } else {
    pool = await getItemsForCategory(category);
  }

  const capabilities = getCapabilitiesForCategory(category, pool);

  // 2. Filter by minimum rating
  if (minRating !== undefined && minRating !== null && minRating !== "" && minRating !== "all") {
    const min = parseFloat(minRating);
    if (!Number.isNaN(min)) {
      pool = pool.filter((it) => it.rating !== undefined && it.rating !== null && it.rating >= min);
    }
  }

  // 3. Filter by content type (Featured: rating >= 8 and excerpt >= 150)
  if (type === "featured") {
    pool = pool.filter(
      (it) => (it.rating ?? 0) >= 8 && (it.excerpt?.length || 0) >= 150
    );
  }

  // 4. Sort
  const sorted = [...pool].sort((a, b) => {
    if (sort === "rated" || sort === "Highest rated") {
      const rA = a.rating ?? -1;
      const rB = b.rating ?? -1;
      if (rB !== rA) return rB - rA;
      return (b.rawContent?.length || 0) - (a.rawContent?.length || 0);
    }

    if (sort === "liked" || sort === "Most liked") {
      const lA = a.likes ?? 0;
      const lB = b.likes ?? 0;
      return lB - lA;
    }

    // Default: Most recent (createdAt desc)
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // 5. Paginate by page number or offset cursor (default 50 reviews per page)
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 50);
  const pageNum = page
    ? Math.max(1, parseInt(page, 10) || 1)
    : Math.floor(Math.max(0, parseInt(cursor, 10) || 0) / parsedLimit) + 1;
  const calculatedOffset = (pageNum - 1) * parsedLimit;

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / parsedLimit));
  const pagedItems = sorted.slice(calculatedOffset, calculatedOffset + parsedLimit);
  const nextOffset = calculatedOffset + parsedLimit;
  const nextCursor = nextOffset < total ? String(nextOffset) : null;

  return {
    items: pagedItems,
    nextCursor,
    capabilities,
    total,
    page: pageNum,
    totalPages,
    limit: parsedLimit,
  };
}

/**
 * Top rated 5 items for the right rail (follows category)
 */
export async function getTopRatedReviews(category = "all") {
  const pool = await getItemsForCategory(category);

  // Filter for items with a valid rating
  const rated = pool.filter((it) => it.rating !== undefined && it.rating !== null);

  // Sort by rating desc, tie-break by review length then recency
  rated.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    const lenA = a.rawContent?.length || a.excerpt?.length || 0;
    const lenB = b.rawContent?.length || b.excerpt?.length || 0;
    if (lenB !== lenA) return lenB - lenA;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // One entry per title, top 5
  const seenTitles = new Set();
  const top5 = [];
  for (const item of rated) {
    if (!seenTitles.has(item.titleId)) {
      seenTitles.add(item.titleId);
      top5.push({
        id: item.id,
        source: item.source,
        category: item.category,
        titleId: item.titleId,
        title: item.title,
        year: item.year,
        mediaLabel: item.mediaLabel,
        posterUrl: item.posterUrl,
        rating: item.rating,
        author: item.author,
        detailHref: item.detailHref,
      });
      if (top5.length === 5) break;
    }
  }

  return top5;
}

/**
 * Featured review for the right rail and hero backdrop
 */
export async function getFeaturedReview() {
  const featured = await getTmdbFeaturedReview();
  if (featured) return featured;

  // Fallback: pick highest rated from all pool
  const allCards = await getTmdbReviewCards();
  const fallback = allCards.find((c) => (c.rating || 0) >= 8.5) || allCards[0];
  if (!fallback) return null;

  return {
    item: fallback,
    heroBackdropUrl: fallback.backdropUrl,
  };
}

/**
 * Detailed review for modal / full review page
 */
export async function getReviewDetail(source, titleId, reviewId) {
  if (source === "mangadex") {
    return await getMangaDexDetail(titleId);
  }
  if (source === "openlibrary") {
    return await getOpenLibraryDetail(titleId);
  }
  return await getTmdbReviewDetail(titleId, reviewId);
}
