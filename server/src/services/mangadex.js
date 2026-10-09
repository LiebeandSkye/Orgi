const MANGADEX_BASE_URL = "https://api.mangadex.org";
const MANGADEX_COVER_BASE = "https://uploads.mangadex.org/covers";


async function fetchFromMangaDex(endpoint, params = {}) {
const queryParams = new URLSearchParams();
for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
    value.forEach((v) => queryParams.append(`${key}[]`, v));
    } else {
    queryParams.append(key, value);
    }
}
const url = `${MANGADEX_BASE_URL}${endpoint}?${queryParams.toString()}`;
const response = await fetch(url);
if (!response.ok) {
    throw new Error(`MangaDex API Error: ${response.status} ${response.statusText}`);
}
    return response.json();
}

function formatMangaDexItem(item) {
const attrs = item.attributes || {};

const title = attrs.title?.en 
    || attrs.title?.['ja-ro'] 
    || attrs.title?.['ko-ro'] 
    || Object.values(attrs.title || {})[0] 
    || "Untitled";

const overview = attrs.description?.en || Object.values(attrs.description || {})[0] || "";

const coverRel = item.relationships?.find((rel) => rel.type === "cover_art");
const coverFileName = coverRel?.attributes?.fileName;
const posterUrl = coverFileName ? `${MANGADEX_COVER_BASE}/${item.id}/${coverFileName}.512.jpg` : null;

const origLang = attrs.originalLanguage;
const type = origLang === "ko" ? "manhwa" : origLang === "zh" ? "manhua" : "manga";
return {
    id: `mangadex_${item.id}`,
    sourceID: item.id,
    source: "mangadex",
    type,
    title,
    originalTitle: Object.values(attrs.altTitles?.[0] || {})[0] || null,
    overview,
    posterUrl,
    backdropUrl: null,
    releaseDate: attrs.year ? `${attrs.year}-01-01` : null,
    rating: null, 
    language: origLang || null,
    status: attrs.status || null,
    genres: attrs.tags?.filter((t) => t.attributes?.group === "genre").map((t) => t.attributes?.name?.en) || [],
    };
}

export const mangadexService = {

async getPopularManga(limit = 20) {
    const data = await fetchFromMangaDex("/manga", {
    limit,
    "originalLanguage": ["ja"],
    "includes": ["cover_art"],
    "order[followedCount]": "desc",
    "contentRating": ["safe", "suggestive"],
    });
    return data.data.map(formatMangaDexItem);
},

async getPopularManhwa(limit = 20) {
    const data = await fetchFromMangaDex("/manga", {
    limit,
    "originalLanguage": ["ko"],
    "includes": ["cover_art"],
    "order[followedCount]": "desc",
    "contentRating": ["safe", "suggestive"],
    });
    return data.data.map(formatMangaDexItem);
},

  // Get popular Manhua (Chinese comics)
async getPopularManhua(limit = 20) {
    const data = await fetchFromMangaDex("/manga", {
    limit,
    "originalLanguage": ["zh"], // 'zh' is Chinese
    "includes": ["cover_art"],
    "order[followedCount]": "desc",
    "contentRating": ["safe", "suggestive"],
    });
    return data.data.map(formatMangaDexItem);
},

async search(query, type = "all", limit = 20) {
    const params = {
    title: query,
    limit,
    "includes": ["cover_art"],
    "order[relevance]": "desc",
    "contentRating": ["safe", "suggestive"],
    };
    if (type === "manhwa") params["originalLanguage"] = ["ko"];
    if (type === "manga") params["originalLanguage"] = ["ja"];
    const data = await fetchFromMangaDex("/manga", params);
    return data.data.map(formatMangaDexItem);
},

async getDetails(id) {
    const data = await fetchFromMangaDex(`/manga/${id}`, {
    "includes": ["cover_art", "author", "artist"],
    });
    return formatMangaDexItem(data.data);
    },
};