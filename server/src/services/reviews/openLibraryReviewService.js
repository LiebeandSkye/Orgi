import { createExcerpt } from "./excerpt.js";

const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const COVERS_BASE = "https://covers.openlibrary.org/b/id";

const olCache = {
  book: null,
  bookExpiry: 0,
  novel: null,
  novelExpiry: 0,
  "light-novel": null,
  "light-novelExpiry": 0,
};

const workDescCache = new Map();

/**
 * Fetch work description with in-memory caching
 */
async function getWorkDescription(cleanWorkId) {
  if (workDescCache.has(cleanWorkId)) {
    return workDescCache.get(cleanWorkId);
  }

  try {
    const res = await fetch(`${OPEN_LIBRARY_BASE}/works/${cleanWorkId}.json`, {
      headers: { "User-Agent": "Orgi/1.0 (reviews-feed)" },
    });
    if (!res.ok) {
      workDescCache.set(cleanWorkId, "");
      return "";
    }
    const data = await res.json();
    let desc = "";
    if (typeof data.description === "string") {
      desc = data.description;
    } else if (data.description && typeof data.description.value === "string") {
      desc = data.description.value;
    }
    workDescCache.set(cleanWorkId, desc);
    return desc;
  } catch {
    workDescCache.set(cleanWorkId, "");
    return "";
  }
}

/**
 * Fetch and build cards for Books, Novels, or Light Novels
 * @param {'book' | 'novel' | 'light-novel'} category
 * @param {number} [limit=25]
 */
export async function getOpenLibraryCards(category = "book", limit = 25) {
  const now = Date.now();
  const cacheKey = category;
  const expiryKey = `${category}Expiry`;

  if (olCache[cacheKey] && now < olCache[expiryKey]) {
    return olCache[cacheKey];
  }

  console.log(`📚 [OpenLibrary] Fetching ${category} items...`);

  let q = "subject:fiction";
  let mediaLabel = "Novel";
  if (category === "book") {
    q = "bestsellers OR fiction OR literature";
    mediaLabel = "Book";
  } else if (category === "novel") {
    q = "subject:fiction";
    mediaLabel = "Novel";
  } else if (category === "light-novel") {
    q = "subject:\"light novel\" OR subject:\"light novels\" OR \"light novel\"";
    mediaLabel = "Light Novel";
  }

  const searchUrl = `${OPEN_LIBRARY_BASE}/search.json?q=${encodeURIComponent(
    q
  )}&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count,subject,first_sentence&limit=${limit}&sort=rating`;

  let docs = [];
  try {
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "Orgi/1.0 (reviews-feed)" },
    });
    if (res.ok) {
      const data = await res.json();
      docs = data.docs || [];
    }
  } catch (err) {
    console.warn(`[OpenLibrary] Search failed for ${category}:`, err.message);
    return [];
  }

  const cards = [];
  for (const doc of docs) {
    const rawKey = doc.key || "";
    const cleanId = rawKey.replace("/works/", "");
    if (!cleanId) continue;

    // Cover
    const coverId = doc.cover_i;
    const posterUrl = coverId ? `${COVERS_BASE}/${coverId}-M.jpg` : undefined;

    // Rating: ratings_average (0-5) -> 0-10 scale. Require ratings_count >= 3.
    let ratingValue = undefined;
    if (
      typeof doc.ratings_average === "number" &&
      typeof doc.ratings_count === "number" &&
      doc.ratings_count >= 3
    ) {
      ratingValue = Math.round(doc.ratings_average * 2 * 10) / 10;
    }

    // Work description / first_sentence
    let desc = "";
    if (doc.first_sentence) {
      if (typeof doc.first_sentence === "string") {
        desc = doc.first_sentence;
      } else if (Array.isArray(doc.first_sentence) && doc.first_sentence.length > 0) {
        desc = doc.first_sentence[0];
      }
    }

    if (!desc || desc.length < 50) {
      const fetchedDesc = await getWorkDescription(cleanId);
      if (fetchedDesc) desc = fetchedDesc;
    }

    // If neither description nor first_sentence, skip title per spec
    if (!desc || desc.trim().length === 0) {
      continue;
    }

    const year = doc.first_publish_year || undefined;
    const genres = Array.isArray(doc.subject)
      ? doc.subject.slice(0, 3)
      : [category === "light-novel" ? "Light Novel" : category === "novel" ? "Fiction" : "Literature"];

    const authorNames = Array.isArray(doc.author_name) ? doc.author_name.join(", ") : undefined;

    cards.push({
      id: `openlibrary:${cleanId}:title`,
      source: "openlibrary",
      category,
      titleId: cleanId,
      title: doc.title || "Untitled",
      year: year ? parseInt(year, 10) : undefined,
      mediaLabel,
      posterUrl,
      backdropUrl: undefined,
      genres,
      rating: ratingValue,
      ratingKind: "community",
      excerpt: createExcerpt(desc, 220),
      rawContent: desc,
      excerptKind: "synopsis",
      author: authorNames ? { name: authorNames } : undefined,
      createdAt: year ? `${year}-01-01T00:00:00Z` : new Date().toISOString(),
      containsSpoilers: false,
      detailHref: `/reviews/openlibrary/${cleanId}`,
    });
  }

  olCache[cacheKey] = cards;
  olCache[expiryKey] = now + 45 * 60 * 1000; // 45 minutes
  return cards;
}

/**
 * Get detail for an OpenLibrary work
 */
export async function getOpenLibraryDetail(cleanId) {
  const [workRes, searchRes] = await Promise.all([
    fetch(`${OPEN_LIBRARY_BASE}/works/${cleanId}.json`, {
      headers: { "User-Agent": "Orgi/1.0 (reviews-feed)" },
    }).then((r) => (r.ok ? r.json() : null)),
    fetch(
      `${OPEN_LIBRARY_BASE}/search.json?q=key:/works/${cleanId}&fields=key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count,subject&limit=1`,
      { headers: { "User-Agent": "Orgi/1.0 (reviews-feed)" } }
    ).then((r) => (r.ok ? r.json() : null)),
  ]);

  if (!workRes && !searchRes) {
    throw new Error("OpenLibrary book not found");
  }

  const doc = searchRes?.docs?.[0] || {};
  const title = workRes?.title || doc.title || "Untitled";

  let desc = "";
  if (typeof workRes?.description === "string") {
    desc = workRes.description;
  } else if (workRes?.description?.value) {
    desc = workRes.description.value;
  }

  const coverId = doc.cover_i || workRes?.covers?.[0];
  const posterUrl = coverId ? `${COVERS_BASE}/${coverId}-L.jpg` : undefined;

  let ratingValue = undefined;
  if (
    typeof doc.ratings_average === "number" &&
    typeof doc.ratings_count === "number" &&
    doc.ratings_count >= 3
  ) {
    ratingValue = Math.round(doc.ratings_average * 2 * 10) / 10;
  }

  const year = doc.first_publish_year || undefined;
  const genres = Array.isArray(doc.subject)
    ? doc.subject.slice(0, 4)
    : ["Literature"];

  const author = doc.author_name ? doc.author_name.join(", ") : "Unknown Author";

  return {
    id: `openlibrary:${cleanId}:title`,
    source: "openlibrary",
    category: "book",
    titleId: cleanId,
    title,
    tagline: `By ${author}`,
    year: year ? parseInt(year, 10) : undefined,
    mediaLabel: "Book",
    posterUrl,
    genres,
    rating: ratingValue,
    ratingKind: "community",
    content: desc || "No description available.",
    excerpt: createExcerpt(desc, 220),
    excerptKind: "synopsis",
    createdAt: year ? `${year}-01-01T00:00:00Z` : new Date().toISOString(),
    externalUrl: `https://openlibrary.org/works/${cleanId}`,
    mediaRoute: `/books/novels/${cleanId}`,
  };
}
