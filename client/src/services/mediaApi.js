import authorMale from "../assets/author-male.png";
import authorFemale from "../assets/author-female.png";
import { API_BASE_URL as ROOT_API_BASE_URL } from "./api";

const MANGADEX_BASE = "https://api.mangadex.org";
const MANGADEX_COVERS = "https://uploads.mangadex.org/covers";
const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org/b/id";
const API_BASE_URL = `${ROOT_API_BASE_URL}/media`;

const ITEMS_PER_PAGE = 18;

function getFallbackAuthorAvatar(name = "", bio = "") {
    const text = `${name} ${bio}`.toLowerCase();
    const isFemale =
        /\b(she|her|hers|actress|woman|female|mrs|ms|miss|jane|emily|charlotte|mary|virginia|agatha|louisa|margaret|sylvia|edith|anne|elizabeth|harper|toni|ursula|octavia|joanne|stephenie|suzanne|veronica|cassandra|sarah|colleen|rebecca|leigh|marissa|tahir|rowling)\b/i.test(
            text
        );
    return isFemale ? authorFemale : authorMale;
}

function getEnglishTitle(attrs = {}) {
    if (attrs.title?.en) return attrs.title.en;
    if (Array.isArray(attrs.altTitles)) {
        const enAlt = attrs.altTitles.find((t) => t.en);
        if (enAlt?.en) return enAlt.en;
    }
    return (
        attrs.title?.["ja-ro"] ||
        attrs.title?.["ko-ro"] ||
        attrs.title?.["zh-ro"] ||
        Object.values(attrs.title || {})[0] ||
        "Untitled"
    );
}

export const MANGADEX_GENRE_TAGS = {
    Action: "391b0423-d847-456f-aff0-8b0cfc03066b",
    Adventure: "87cc87cd-a395-47af-b27a-93258283bbc6",
    Comedy: "4d32cc48-9f00-4cca-9b5a-a839f0764984",
    Crime: "5ca48985-9a9d-4bd8-be29-80dc0303db72",
    Drama: "b9af3a63-f058-46de-a9a0-e0c13906197a",
    Fantasy: "cdc58593-87dd-415e-bbc0-2ec27bf404cc",
    Historical: "33771934-028e-4cb3-8744-691e866a923e",
    Horror: "cdad7e68-1419-41dd-bdce-27753074a640",
    Isekai: "ace04997-f6bd-436e-b261-779182193d3d",
    Magic: "a1f53773-c69a-4ce5-8cab-fffcd90b1565",
    "Martial Arts": "799c202e-7daa-44eb-9cf7-8a3c0441531e",
    Mecha: "50880a9d-5440-4732-9afb-8f457127e836",
    Medical: "c8cbe35b-1b2b-4a3f-9c37-db84c4514856",
    Mystery: "ee968100-4191-4968-93d3-f82d72be7e46",
    Psychological: "3b60b75c-a2d7-4860-ab56-05f391bb889c",
    Reincarnation: "0bc90acb-ccc1-44ca-a34a-b9f3a73259d0",
    Romance: "423e2eae-a7a2-4a8b-ac03-a8351462d71d",
    "School Life": "caaa44eb-cd40-4177-b930-79d3ef2afe87",
    "Sci-Fi": "256c8bd9-4904-4360-bf4f-508a76d67183",
    "Slice of Life": "e5301a23-ebd9-49dd-a0cb-2add944c7fe9",
    Sports: "69964a64-2f90-4d33-beeb-f3ed2875eb4c",
    Superhero: "7064a261-a137-4d3a-8848-2d385de3a99c",
    Supernatural: "eabc5b4c-6aff-42f3-b657-3e90cbd00b75",
    Survival: "5fff9cde-849c-4d78-aab0-0d52b2ee1d25",
    Thriller: "07251805-a27e-4d59-b488-f0bfbec15168",
    "Time Travel": "292e862b-2d17-4062-90a2-0356caa4ae27",
    Tragedy: "f8f62932-27da-4fe4-8ee1-6779a8c5edba",
    Wuxia: "acc803a4-c95a-4c22-86fc-eb6b582d82a2",
};

export const AVAILABLE_GENRES = Object.keys(MANGADEX_GENRE_TAGS).sort();

export async function fetchMangaDexByCategory(
    category = "manhwa",
    page = 1,
    query = "",
    genre = "All",
    status = "All",
    sort = "Top rated"
) {
    const genreArray = Array.isArray(genre)
        ? genre
        : (genre && genre !== "All" ? genre.split(",").map((s) => s.trim()).filter(Boolean) : []);
    const genreParamStr = genreArray.length > 0 ? genreArray.join(",") : "All";

    try {
        const proxyParams = new URLSearchParams({
            category,
            page,
            q: query,
            genre: genreParamStr,
            status,
            sort,
        });
        const proxyRes = await fetch(`${API_BASE_URL}/manga?${proxyParams.toString()}`);
        if (proxyRes.ok) {
            const proxyJson = await proxyRes.json();
            if (proxyJson.success && Array.isArray(proxyJson.data)) {
                const results = proxyJson.data;
                results.totalPages = proxyJson.totalPages || 1;
                return results;
            }
        }
    } catch {
        // Fall back to direct MangaDex API call below
    }
    const langMap = { manga: "ja", manhwa: "ko", manhua: "zh" };
    const lang = langMap[category] || "ko";
    const offset = (page - 1) * ITEMS_PER_PAGE;

    const params = new URLSearchParams();
    if (category === "manhua") {
        params.append("originalLanguage[]", "zh");
        params.append("originalLanguage[]", "zh-hk");
    } else {
        params.append("originalLanguage[]", lang);
    }
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");

    genreArray.forEach((g) => {
        if (MANGADEX_GENRE_TAGS[g]) {
            params.append("includedTags[]", MANGADEX_GENRE_TAGS[g]);
        }
    });

    if (status && status !== "All") {
        params.append("status[]", status.toLowerCase());
    }

    if (query.trim()) {
        params.append("title", query.trim());
        params.append("order[relevance]", "desc");
    } else if (sort === "Top rated") {
        params.append("order[rating]", "desc");
    } else if (sort === "Most popular") {
        params.append("order[followedCount]", "desc");
    } else if (sort === "Latest update") {
        params.append("order[latestUploadedChapter]", "desc");
    } else if (sort === "Alphabetical") {
        params.append("order[title]", "asc");
    } else {
        params.append("order[followedCount]", "desc");
    }
    params.append("contentRating[]", "safe");
    params.append("contentRating[]", "suggestive");

    const res = await fetch(`${MANGADEX_BASE}/manga?${params.toString()}`);
    if (!res.ok) throw new Error(`MangaDex error= ${res.status}`);
    const json = await res.json();
    const list = json.data || [];

    // Fetch real ratings from MangaDex statistics endpoint
    let statsMap = {};
    if (list.length > 0) {
        try {
            const statParams = new URLSearchParams();
            list.forEach((m) => statParams.append("manga[]", m.id));
            const statRes = await fetch(
                `${MANGADEX_BASE}/statistics/manga?${statParams.toString()}`
            );
            if (statRes.ok) {
                const statJson = await statRes.json();
                statsMap = statJson.statistics || {};
            }
        } catch {
            // fallback to default score if stats request fails
        }
    }

    const results = list.map((item) => {
        const attrs = item.attributes || {};
        const title = getEnglishTitle(attrs);

        const coverRel = item.relationships?.find((r) => r.type === "cover_art");
        const authorRel = item.relationships?.find((r) => r.type === "author");
        const fileName = coverRel?.attributes?.fileName;

        const rawScore = statsMap[item.id]?.rating?.bayesian;
        const rating = rawScore ? rawScore.toFixed(1) : "8.5";

        const volText = attrs.lastVolume ? `Vol. ${attrs.lastVolume}` : null;
        const chText = attrs.lastChapter ? `Ch. ${attrs.lastChapter}` : null;
        const genreList = (attrs.tags || [])
            .map((t) => t.attributes?.name?.en)
            .filter(Boolean);

        return {
            id: item.id,
            title,
            author: authorRel?.attributes?.name || category.toUpperCase(),
            cover: fileName
                ? `${MANGADEX_COVERS}/${item.id}/${fileName}.512.jpg`
                : "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover",
            backdrop: fileName
                ? `${MANGADEX_COVERS}/${item.id}/${fileName}`
                : null,
            rating,
            chapters:
                chText || volText || (attrs.status ? attrs.status.charAt(0).toUpperCase() + attrs.status.slice(1) : "Ongoing"),
            status: attrs.status
                ? attrs.status.charAt(0).toUpperCase() + attrs.status.slice(1)
                : "Ongoing",
            genres: genreList,
            genre: genreList.join(", "),
            synopsis:
                attrs.description?.en ||
                Object.values(attrs.description || {})[0] ||
                "",
            follows: statsMap[item.id]?.follows || 0,
            updatedAt: attrs.updatedAt || attrs.createdAt || "",
        };
    });

    const MAX_MANGADEX_PAGES = Math.floor(10000 / ITEMS_PER_PAGE); // 555
    const totalCount = typeof json.total === "number" ? json.total : results.length;
    let totalPages = Math.min(MAX_MANGADEX_PAGES, Math.ceil(totalCount / ITEMS_PER_PAGE));
    if (results.length < ITEMS_PER_PAGE) {
        totalPages = results.length > 0 ? page : Math.max(1, page - 1);
    } else if (page >= totalPages && results.length === ITEMS_PER_PAGE && page < MAX_MANGADEX_PAGES) {
        totalPages = page + 1;
    }
    results.totalPages = Math.max(1, totalPages);
    return results;
}

// Multi-tier client cache (Memory + SessionStorage)
const MEMORY_FEED_CACHE = new Map();
const DASHBOARD_CACHE_KEY = "orgi_books_dashboard_feeds_v3";
const POPULAR_BOOKS_CACHE_KEY = "orgi_popular_books_cache_v3";
const DASHBOARD_CACHE_TTL = 20 * 60 * 1000; // 20 minutes
const POPULAR_BOOKS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function getCachedBooksDashboardFeeds() {
    // 1. In-memory check (0ms)
    const mem = MEMORY_FEED_CACHE.get(DASHBOARD_CACHE_KEY);
    if (mem && Date.now() - mem.timestamp < DASHBOARD_CACHE_TTL && mem.data) {
        return mem.data;
    }
    // 2. SessionStorage check (0ms)
    try {
        const raw = sessionStorage.getItem(DASHBOARD_CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.timestamp < DASHBOARD_CACHE_TTL && parsed.data) {
                MEMORY_FEED_CACHE.set(DASHBOARD_CACHE_KEY, parsed);
                return parsed.data;
            }
        }
    } catch {}
    return null;
}

export function setCachedBooksDashboardFeeds(data) {
    if (!data) return;
    const entry = { data, timestamp: Date.now() };
    MEMORY_FEED_CACHE.set(DASHBOARD_CACHE_KEY, entry);
    try {
        sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(entry));
    } catch {}
}

export async function fetchBooksDashboardFeeds(onProgress) {
    const cached = getCachedBooksDashboardFeeds();
    if (cached) {
        if (typeof onProgress === "function") {
            onProgress(cached);
        }
    }

    // 1. Try fast server-aggregated Redis cache endpoint
    try {
        const serverRes = await fetch(`${API_BASE_URL}/dashboard-feeds`).catch(() => null);
        if (serverRes && serverRes.ok) {
            const serverJson = await serverRes.json();
            if (serverJson.success && serverJson.data) {
                setCachedBooksDashboardFeeds(serverJson.data);
                if (typeof onProgress === "function") {
                    onProgress(serverJson.data);
                }
                return serverJson.data;
            }
        }
    } catch {
        // Fall back to progressive client-side fetching below
    }

    const formatRoute = (item, cat) => {
        const image = item.cover || item.poster || null;
        return {
            ...item,
            cover: image,
            poster: image,
            backdrop: item.backdrop || image,
            route: `/books/${cat}/${item.id}`,
            score: item.rating || "8.5",
            type: (item.type || cat).toUpperCase(),
        };
    };

    let aggregated = cached
        ? { ...cached }
        : {
              trendingManhwa: [],
              trendingManga: [],
              trendingManhua: [],
              trendingBooks: [],
              fanFavorites: [],
          };

    // 2. Fast track: MangaDex feeds (Manhwa, Manga, Manhua, Fan Favorites resolve in ~0.8s)
    const mangaDexPromise = Promise.all([
        fetchMangaDexByCategory("manhwa", 1, "", "All", "All", "Most popular").catch(() => []),
        fetchMangaDexByCategory("manga", 1, "", "All", "All", "Most popular").catch(() => []),
        fetchMangaDexByCategory("manhua", 1, "", "All", "All", "Most popular").catch(() => []),
        fetchMangaDexByCategory("manhwa", 1, "", "All", "All", "Top rated").catch(() => []),
        fetchMangaDexByCategory("manga", 1, "", "All", "All", "Top rated").catch(() => []),
    ]).then(([tManhwa, tManga, tManhua, fvManhwa, fvManga]) => {
        const fanFavorites = [];
        const maxLen = Math.max(fvManhwa.length, fvManga.length);
        for (let i = 0; i < maxLen; i++) {
            if (fvManhwa[i]) fanFavorites.push(formatRoute(fvManhwa[i], "manhwa"));
            if (fvManga[i]) fanFavorites.push(formatRoute(fvManga[i], "manga"));
        }

        const mangaUpdate = {
            trendingManhwa: (tManhwa || []).map((m) => formatRoute(m, "manhwa")),
            trendingManga: (tManga || []).map((m) => formatRoute(m, "manga")),
            trendingManhua: (tManhua || []).map((m) => formatRoute(m, "manhua")),
            fanFavorites: fanFavorites.slice(0, 16),
        };

        aggregated = { ...aggregated, ...mangaUpdate };
        if (typeof onProgress === "function") {
            onProgress(aggregated);
        }
        return mangaUpdate;
    });

    // 3. Books track: Check local cache first so Open Library takes 0ms
    const booksPromise = (async () => {
        try {
            const raw = sessionStorage.getItem(POPULAR_BOOKS_CACHE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.timestamp < POPULAR_BOOKS_CACHE_TTL && Array.isArray(parsed.data)) {
                    const booksUpdate = { trendingBooks: parsed.data.map((b) => formatRoute(b, "novels")) };
                    aggregated = { ...aggregated, ...booksUpdate };
                    if (typeof onProgress === "function") {
                        onProgress(aggregated);
                    }
                    return booksUpdate;
                }
            }
        } catch {}

        const popularBooks = await fetchBooks(1, "").catch(() => []);
        if (Array.isArray(popularBooks) && popularBooks.length > 0) {
            try {
                sessionStorage.setItem(
                    POPULAR_BOOKS_CACHE_KEY,
                    JSON.stringify({ data: popularBooks, timestamp: Date.now() })
                );
            } catch {}
        }
        const booksUpdate = { trendingBooks: (popularBooks || []).map((b) => formatRoute(b, "novels")) };
        aggregated = { ...aggregated, ...booksUpdate };
        if (typeof onProgress === "function") {
            onProgress(aggregated);
        }
        return booksUpdate;
    })();

    await Promise.allSettled([mangaDexPromise, booksPromise]);
    setCachedBooksDashboardFeeds(aggregated);
    return aggregated;
}

export async function fetchBooks(page = 1, query = "") {
    try {
        const proxyParams = new URLSearchParams({ page, q: query });
        const proxyRes = await fetch(`${API_BASE_URL}/books?${proxyParams.toString()}`);
        if (proxyRes.ok) {
            const proxyJson = await proxyRes.json();
            if (proxyJson.success && Array.isArray(proxyJson.data)) {
                const results = proxyJson.data;
                results.totalPages = proxyJson.totalPages || 1;
                return results;
            }
        }
    } catch {
        // Fall back to direct Open Library call below
    }
    const offset = (page - 1) * ITEMS_PER_PAGE;
    const searchQ = query.trim() ? encodeURIComponent(query.trim()) : "subject%3Afiction";
    const url = `${OPEN_LIBRARY_BASE}/search.json?q=${searchQ}&limit=${ITEMS_PER_PAGE}&page=${page}&fields=key,title,author_name,cover_i,ratings_average,ratings_count,first_publish_year,subject`;

    const res = await fetch(url);
    const json = await res.json();
    const rawItems = json.docs || [];

    const results = rawItems.map((item) => {
        const coverId = item.cover_i;
        const authorName = item.author_name?.[0] || "Unknown Author";
        const rawScore = typeof item.ratings_average === "number" ? item.ratings_average * 2 : null;
        const rating = rawScore ? rawScore.toFixed(1) : "8.4";
        return {
            id: (item.key || "").replace("/works/", ""),
            title: item.title || "Untitled",
            author: authorName,
            cover: coverId
                ? `${OPEN_LIBRARY_COVERS}/${coverId}-L.jpg`
                : "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover",
            rating,
            score: rating,
            voteCount: item.ratings_count || 0,
            chapters: item.first_publish_year ? `${item.first_publish_year}` : "Novel",
            status: "Completed",
            genres: Array.isArray(item.subject) ? item.subject : ["Fiction"],
            genre: Array.isArray(item.subject) ? item.subject.slice(0, 5).join(", ") : "Fiction",
        };
    });

    const totalCount =
        typeof json.numFound === "number"
            ? json.numFound
            : typeof json.work_count === "number"
            ? json.work_count
            : results.length;
    let totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    if (results.length < ITEMS_PER_PAGE) {
        totalPages = results.length > 0 ? page : Math.max(1, page - 1);
    } else if (page >= totalPages && results.length === ITEMS_PER_PAGE) {
        totalPages = page + 1;
    }
    results.totalPages = Math.max(1, totalPages);
    return results;
}

export async function searchMangaDex(query, category = "all", limit = 18) {
    if (!query?.trim()) return [];
    const params = new URLSearchParams();
    params.append("limit", limit);
    params.append("title", query.trim());
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");
    params.append("order[relevance]", "desc");
    params.append("contentRating[]", "safe");
    params.append("contentRating[]", "suggestive");

    if (category === "manhwa") params.append("originalLanguage[]", "ko");
    else if (category === "manga") params.append("originalLanguage[]", "ja");
    else if (category === "manhua") {
        params.append("originalLanguage[]", "zh");
        params.append("originalLanguage[]", "zh-hk");
    }

    const res = await fetch(`${MANGADEX_BASE}/manga?${params.toString()}`);
    if (!res.ok) return [];
    const json = await res.json();
    const list = json.data || [];

    return list.map((item) => {
        const attrs = item.attributes || {};
        const title = getEnglishTitle(attrs);
        const coverRel = item.relationships?.find((r) => r.type === "cover_art");
        const authorRel = item.relationships?.find((r) => r.type === "author");
        const fileName = coverRel?.attributes?.fileName;
        const origLang = attrs.originalLanguage;
        const type = origLang === "ko" ? "manhwa" : origLang === "zh" ? "manhua" : "manga";

        return {
            id: item.id,
            title,
            author: authorRel?.attributes?.name || "MangaDex",
            cover: fileName
                ? `${MANGADEX_COVERS}/${item.id}/${fileName}.512.jpg`
                : "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover",
            rating: "8.8",
            chapters: attrs.lastChapter ? `Ch. ${attrs.lastChapter}` : "Ongoing",
            type,
        };
    });
}

export async function searchBooks(query, page = 1) {
    return fetchBooks(page, query);
}

function formatReviewContent(rawText) {
    if (!rawText) return "";
    let text = rawText
        .replace(/~{3}[\s\S]*?~{3}/g, "")
        .replace(/#+\s*/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[_*~`]/g, "")
        .replace(/\n\s*\n+/g, "\n\n")
        .trim();
    if (text.length > 900) {
        text = text.slice(0, 900) + "...";
    }
    return text;
}

function getDefaultCommunityReviews(title, type = "Novel", baseRating = 8.5, author = "") {
    const scoreNum = typeof baseRating === "number" ? baseRating : parseFloat(baseRating) || 8.5;
    const authorMention = author && author !== "Unknown Author" ? ` by ${author}` : "";

    const reviewers = [
        {
            name: "Aria_Reads",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
            time: "2 days ago",
            scoreDelta: 0.3,
            content: `An utterly compelling work! "${title}"${authorMention} has some of the finest narrative pacing I've read in recent memory. The depth of the characterization and the thematic resonance build up remarkably well towards the climactic chapters. Truly a standout addition to the ${type.toLowerCase()} medium.`,
            likes: 42,
        },
        {
            name: "Kaelen_Bookworm",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
            time: "1 week ago",
            scoreDelta: -0.1,
            content: `The world-building and descriptive atmosphere in "${title}" are top notch. You can genuinely feel the craftsmanship in every arc. Highly recommended for anyone looking for a rich, immersive story that doesn't shy away from emotional stakes.`,
            likes: 29,
        },
        {
            name: "Min_Jae",
            avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80",
            time: "2 weeks ago",
            scoreDelta: 0.5,
            content: `Easily one of my favorite discoveries this year. The narrative balance between action and quiet introspective moments is executed with surgical precision. If you're on the fence about starting "${title}", consider this your sign to jump in right now.`,
            likes: 19,
        },
        {
            name: "ElenaV",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
            time: "1 month ago",
            scoreDelta: -0.4,
            content: `Solid storytelling throughout. While the midsection takes its time setting up the overarching conflict, the payoff in the latter half more than justifies the investment. A memorable, high-caliber read.`,
            likes: 14,
        },
    ];

    return reviewers.map((r, i) => {
        const score = Math.min(10, Math.max(6.0, Number((scoreNum + r.scoreDelta).toFixed(1))));
        return {
            id: `community-rev-${i + 1}`,
            author: r.name,
            avatar: r.avatar,
            time: r.time,
            score,
            content: r.content,
            likes: r.likes,
            repliesCount: 0,
        };
    });
}

const DETAIL_CACHE = new Map();
const DETAIL_TTL = 30 * 60 * 1000; // 30 mins

function cacheAndReturnDetail(key, data) {
    if (data) {
        DETAIL_CACHE.set(key, data);
        try {
            sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
        } catch {}
    }
    return data;
}

export async function fetchMediaDetails(category, id) {
    const cacheKey = `orgi_detail_${category}_${id}`;
    if (DETAIL_CACHE.has(cacheKey)) {
        return DETAIL_CACHE.get(cacheKey);
    }
    try {
        const raw = sessionStorage.getItem(cacheKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.timestamp < DETAIL_TTL && parsed.data) {
                DETAIL_CACHE.set(cacheKey, parsed.data);
                return parsed.data;
            }
        }
    } catch {}

    try {
        const proxyRes = await fetch(`${API_BASE_URL}/detail/${encodeURIComponent(category)}/${encodeURIComponent(id)}`);
        if (proxyRes.ok) {
            const proxyJson = await proxyRes.json();
            if (proxyJson.success && proxyJson.data) {
                const data = proxyJson.data;
                if (Array.isArray(data.cast)) {
                    data.cast = data.cast.map((c) => ({
                        ...c,
                        avatar: c.avatar || getFallbackAuthorAvatar(c.name, ""),
                    }));
                }
                return cacheAndReturnDetail(cacheKey, data);
            }
        }
    } catch {
        // Fall back to direct fetching below
    }
    if (category === "novels" || category === "books" || category === "light-novels") {
        const [res, ratingsRes] = await Promise.all([
            fetch(`${OPEN_LIBRARY_BASE}/works/${id}.json`),
            fetch(`${OPEN_LIBRARY_BASE}/works/${id}/ratings.json`).catch(() => null),
        ]);
        const data = await res.json();
        let bookRating = 8.5;
        let bookVotes = "1.2k ratings";
        if (ratingsRes && ratingsRes.ok) {
            try {
                const ratingsJson = await ratingsRes.json();
                if (ratingsJson?.summary?.average) {
                    bookRating = Number((ratingsJson.summary.average * 2).toFixed(1));
                }
                if (ratingsJson?.summary?.count) {
                    bookVotes = `${ratingsJson.summary.count.toLocaleString()} ratings`;
                }
            } catch {}
        }
        const coverId = data.covers?.[0];
        const coverUrl = coverId
            ? `${OPEN_LIBRARY_COVERS}/${coverId}-L.jpg`
            : "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover";

        let authorName = "Unknown Author";
        let authorAvatar = null;
        let authorBio = "";
        const authorKey = data.authors?.[0]?.author?.key;
        if (authorKey) {
            try {
                const authorRes = await fetch(`${OPEN_LIBRARY_BASE}${authorKey}.json`);
                if (authorRes.ok) {
                    const authorData = await authorRes.json();
                    if (authorData.name) authorName = authorData.name;
                    authorBio =
                        typeof authorData.bio === "string"
                            ? authorData.bio
                            : authorData.bio?.value || "";
                    if (authorData.photos?.[0] && authorData.photos[0] > 0) {
                        authorAvatar = `https://covers.openlibrary.org/a/id/${authorData.photos[0]}-M.jpg`;
                    }
                }
            } catch {
            }
        }

        if (!authorAvatar) {
            authorAvatar = getFallbackAuthorAvatar(authorName, authorBio);
        }

        const rawCovers = Array.isArray(data.covers)
            ? data.covers.filter((cid) => cid && cid > 0)
            : [];

        let volumeCovers = rawCovers.map((cid, idx) => ({
            id: `cover-${cid}`,
            volume: rawCovers.length > 1 ? `${idx + 1}` : "1",
            title: rawCovers.length > 1 ? `Edition / Volume ${idx + 1}` : data.title || "Edition 1",
            cover: `${OPEN_LIBRARY_COVERS}/${cid}-L.jpg`,
            subtitle: data.first_publish_date || "Print / Digital",
        }));

        try {
            const editionsRes = await fetch(`${OPEN_LIBRARY_BASE}/works/${id}/editions.json?limit=24`);
            if (editionsRes.ok) {
                const editionsJson = await editionsRes.json();
                const entries = editionsJson.entries || [];
                const editionItems = [];
                const seenCovers = new Set();
                entries.forEach((ed) => {
                    const cid = ed.covers?.[0];
                    if (cid && cid > 0 && !seenCovers.has(cid)) {
                        seenCovers.add(cid);
                        editionItems.push({
                            id: ed.key || `ed-${cid}`,
                            volume: `${editionItems.length + 1}`,
                            title: ed.title || data.title || `Edition ${editionItems.length + 1}`,
                            cover: `${OPEN_LIBRARY_COVERS}/${cid}-L.jpg`,
                            subtitle: ed.publish_date || (ed.number_of_pages ? `${ed.number_of_pages} pages` : "Edition"),
                        });
                    }
                });
                if (editionItems.length > volumeCovers.length) {
                    volumeCovers = editionItems;
                }
            }
        } catch {
            // keep rawCovers fallback
        }

        let bookReviews = [];
        try {
            const aniQuery = `
              query ($search: String) {
                Media(search: $search, type: MANGA) {
                  reviews(perPage: 6, sort: [RATING_DESC]) {
                    nodes {
                      id
                      summary
                      body
                      rating
                      score
                      createdAt
                      user {
                        name
                        avatar {
                          medium
                          large
                        }
                      }
                    }
                  }
                }
              }
            `;
            const aniRes = await fetch("https://graphql.anilist.co", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: aniQuery,
                    variables: { search: data.title || "Fiction" },
                }),
            }).catch(() => null);

            if (aniRes && aniRes.ok) {
                const aniJson = await aniRes.json();
                const nodes = aniJson?.data?.Media?.reviews?.nodes || [];
                if (nodes.length > 0) {
                    bookReviews = nodes.map((node, idx) => ({
                        id: `rev-book-${node.id || idx}`,
                        author: node.user?.name || `reader_${idx + 1}`,
                        avatar: node.user?.avatar?.medium || node.user?.avatar?.large || null,
                        time: node.createdAt ? new Date(node.createdAt * 1000).toLocaleDateString() : "Recent",
                        score: typeof node.score === "number" ? Number((node.score / 10).toFixed(1)) : bookRating,
                        content: formatReviewContent(node.body || node.summary || ""),
                        likes: typeof node.rating === "number" ? node.rating : 15 + idx * 8,
                        repliesCount: 0,
                    }));
                }
            }
        } catch {
            // fallback
        }

        if (bookReviews.length === 0) {
            bookReviews = getDefaultCommunityReviews(data.title || "Untitled", "Book / Novel", bookRating, authorName);
        }

        return cacheAndReturnDetail(cacheKey, {
            id,
            type: "BOOK / NOVEL",
            title: data.title || "Untitled",
            year: data.first_publish_date || "Published",
            genres: (data.subjects || []).slice(0, 3).join(", ") || "Fiction",
            runtime: volumeCovers.length > 1 ? `${volumeCovers.length} Editions / Vols` : "Print / Digital",
            certificate: "All Ages",
            poster: coverUrl,
            backdrop: coverUrl,
            tmdbRating: bookRating,
            tmdbVotes: bookVotes,
            communityRating: bookRating,
            communityVotes: bookVotes,
            synopsis:
                typeof data.description === "string"
                    ? data.description
                    : data.description?.value || "No synopsis available.",
            cast: [
                { id: "author", name: authorName, character: "Author", avatar: authorAvatar }
            ],
            volumes: volumeCovers,
            artworks: volumeCovers.map((v) => ({
                id: v.id,
                title: v.title,
                subtitle: v.subtitle,
                type: "Edition Cover",
                file_path: v.cover,
                url: v.cover,
                format: "poster",
            })),
            images: {
                backdrops: [],
                posters: volumeCovers.map((v) => ({
                    id: v.id,
                    file_path: v.cover,
                    title: v.title,
                    subtitle: v.subtitle,
                    format: "poster",
                })),
            },
            reviews: bookReviews,
            details: {
                director: authorName,
                writers: authorName,
                music: "—",
                cinematography: "—",
                boxOffice: volumeCovers.length > 0 ? `${volumeCovers.length} Covers / Editions` : "—",
                aspectRatio: "Book",
                studio: "Open Library",
            },
        });
    }

    const [res, statRes, aggRes, coversRes] = await Promise.all([
        fetch(`${MANGADEX_BASE}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`),
        fetch(`${MANGADEX_BASE}/statistics/manga/${id}`).catch(() => null),
        fetch(`${MANGADEX_BASE}/manga/${id}/aggregate`).catch(() => null),
        fetch(`${MANGADEX_BASE}/cover?manga[]=${id}&limit=100&order[volume]=asc`).catch(() => null),
    ]);

    if (!res.ok) throw new Error(`MangaDex detail error: ${res.status}`);
    const { data } = await res.json();
    const attrs = data.attributes || {};

    let liveRating = 8.9;
    let liveFollows = "4.5k follows";
    if (statRes && statRes.ok) {
        try {
            const statData = await statRes.json();
            const mStat = statData.statistics?.[id];
            if (mStat?.rating?.bayesian) {
                liveRating = Number(mStat.rating.bayesian.toFixed(1));
            }
            if (mStat?.follows) {
                liveFollows = `${mStat.follows.toLocaleString()} follows`;
            }
        } catch {
        }
    }

    let volumeCount = attrs.lastVolume || null;
    let chapterCount = attrs.lastChapter || null;
    let volumeChapterCounts = {};
    if (aggRes && aggRes.ok) {
        try {
            const aggData = await aggRes.json();
            const volumesObj = aggData.volumes || {};
            const volKeys = Object.keys(volumesObj).filter((k) => k !== "none");
            if (volKeys.length > 0 && !volumeCount) {
                volumeCount = volKeys.length;
            }
            let totalChapters = 0;
            Object.entries(volumesObj).forEach(([vKey, v]) => {
                const cCount = Object.keys(v.chapters || {}).length;
                totalChapters += cCount;
                if (vKey !== "none") {
                    volumeChapterCounts[vKey] = cCount;
                }
            });
            if (totalChapters > 0 && !chapterCount) {
                chapterCount = totalChapters;
            }
        } catch {
        }
    }

    const title = getEnglishTitle(attrs);

    const coverRel = data.relationships?.find((r) => r.type === "cover_art");
    const authorRel = data.relationships?.find((r) => r.type === "author");
    const artistRel = data.relationships?.find((r) => r.type === "artist");
    const fileName = coverRel?.attributes?.fileName;
    const coverUrl = fileName
        ? `${MANGADEX_COVERS}/${data.id}/${fileName}.512.jpg`
        : "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover";

    let volumeCovers = [];
    let promoArtworks = [];
    if (coversRes && coversRes.ok) {
        try {
            const coversJson = await coversRes.json();
            const rawCoverList = coversJson.data || [];
            const byVol = new Map();
            rawCoverList.forEach((cItem) => {
                const cAttrs = cItem.attributes || {};
                const cFile = cAttrs.fileName;
                if (!cFile) return;
                const volNum = cAttrs.volume || "Main";
                const key = volNum === "Main" ? cItem.id : `vol-${volNum}`;
                const existing = byVol.get(key);
                if (!existing || cAttrs.locale === attrs.originalLanguage || cAttrs.locale === "en") {
                    const chCountForVol = volumeChapterCounts[volNum];
                    byVol.set(key, {
                        id: cItem.id,
                        volume: volNum,
                        title: volNum !== "Main" ? `Volume ${volNum}` : title,
                        cover: `${MANGADEX_COVERS}/${data.id}/${cFile}.512.jpg`,
                        subtitle: chCountForVol
                            ? `${chCountForVol} ${chCountForVol === 1 ? "Chapter" : "Chapters"}`
                            : cAttrs.description || (volNum !== "Main" ? `Vol. ${volNum}` : "Key Visual"),
                    });
                }
                if (!cAttrs.volume || cAttrs.volume === "none" || (cAttrs.description && cAttrs.description.trim().length > 0)) {
                    promoArtworks.push({
                        id: cItem.id,
                        title: cAttrs.description || "Official Illustration",
                        subtitle: cAttrs.locale ? `Locale: ${cAttrs.locale.toUpperCase()}` : "Special Art",
                        type: "Official Illustration",
                        file_path: `${MANGADEX_COVERS}/${data.id}/${cFile}.512.jpg`,
                        url: `${MANGADEX_COVERS}/${data.id}/${cFile}.512.jpg`,
                        format: "poster",
                    });
                }
            });
            volumeCovers = Array.from(byVol.values()).sort((a, b) => {
                const na = parseFloat(a.volume);
                const nb = parseFloat(b.volume);
                if (!isNaN(na) && !isNaN(nb)) return na - nb;
                if (!isNaN(na)) return -1;
                if (!isNaN(nb)) return 1;
                return 0;
            });
        } catch {
        }
    }

    if (volumeCovers.length === 0 && fileName) {
        volumeCovers = [
            {
                id: coverRel?.id || "cover-main",
                volume: "1",
                title: "Volume 1",
                cover: coverUrl,
                subtitle: chapterCount ? `${chapterCount} Chapters` : "Official Cover",
            },
        ];
    }

    if (!volumeCount && volumeCovers.length > 0) {
        volumeCount = volumeCovers.length;
    }

    // Fetch official banner, art, and reviews from AniList / Kitsu
    let officialArtworks = [];
    let officialBanner = null;
    let mangaReviews = [];

    const alId = attrs.links?.al;
    try {
        const aniQuery = `
          query ($id: Int, $search: String) {
            Media(id: $id, search: $search, type: MANGA) {
              bannerImage
              coverImage {
                extraLarge
                large
              }
              reviews(perPage: 8, sort: [RATING_DESC]) {
                nodes {
                  id
                  summary
                  body
                  rating
                  score
                  createdAt
                  user {
                    name
                    avatar {
                      medium
                      large
                    }
                  }
                }
              }
            }
          }
        `;
        const aniRes = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: aniQuery,
                variables: alId ? { id: parseInt(alId, 10) } : { search: title },
            }),
        }).catch(() => null);

        if (aniRes && aniRes.ok) {
            const aniJson = await aniRes.json();
            const media = aniJson?.data?.Media;
            if (media?.bannerImage) {
                officialBanner = media.bannerImage;
                officialArtworks.push({
                    id: "official-banner-anilist",
                    title: "Official Banner Art",
                    subtitle: "AniList Official Media",
                    type: "Official Banner",
                    file_path: media.bannerImage,
                    url: media.bannerImage,
                    format: "backdrop",
                });
            }
            if (media?.coverImage?.extraLarge && media.coverImage.extraLarge !== coverUrl) {
                officialArtworks.push({
                    id: "official-key-art",
                    title: "Key Visual Artwork",
                    subtitle: "Original High-Res Key Visual",
                    type: "Key Visual",
                    file_path: media.coverImage.extraLarge,
                    url: media.coverImage.extraLarge,
                    format: "poster",
                });
            }
            if (Array.isArray(media?.reviews?.nodes) && media.reviews.nodes.length > 0) {
                mangaReviews = media.reviews.nodes.map((node, idx) => ({
                    id: `rev-al-${node.id || idx}`,
                    author: node.user?.name || `reader_${idx + 1}`,
                    avatar: node.user?.avatar?.medium || node.user?.avatar?.large || null,
                    time: node.createdAt ? new Date(node.createdAt * 1000).toLocaleDateString() : "Recent",
                    score: typeof node.score === "number" ? Number((node.score / 10).toFixed(1)) : liveRating,
                    content: formatReviewContent(node.body || node.summary || "Incredible read. Highly recommended."),
                    likes: typeof node.rating === "number" ? node.rating : 12 + idx * 7,
                    repliesCount: 0,
                }));
            }
        }
    } catch {
        // Fallback gracefully
    }

    if (!officialBanner) {
        try {
            const ktRes = await fetch(`https://kitsu.io/api/edge/manga?filter[text]=${encodeURIComponent(title)}&page[limit]=1`).catch(() => null);
            if (ktRes && ktRes.ok) {
                const ktJson = await ktRes.json();
                const ktCover = ktJson?.data?.[0]?.attributes?.coverImage;
                const ktBanner = ktCover?.original || ktCover?.large;
                if (ktBanner) {
                    officialBanner = ktBanner;
                    officialArtworks.unshift({
                        id: "official-banner-kitsu",
                        title: "Official Header Artwork",
                        subtitle: "Kitsu Official Media",
                        type: "Official Banner",
                        file_path: ktBanner,
                        url: ktBanner,
                        format: "backdrop",
                    });
                }
            }
        } catch {
            // Fallback gracefully
        }
    }

    if (promoArtworks.length > 0) {
        promoArtworks.forEach((art) => {
            if (!officialArtworks.some((a) => a.file_path === art.file_path)) {
                officialArtworks.push(art);
            }
        });
    }

        const authorName = authorRel?.attributes?.name || "Unknown Author";
    const artistName = artistRel?.attributes?.name || authorName;
    const authorBio = authorRel?.attributes?.biography?.en || "";
    const artistBio = artistRel?.attributes?.biography?.en || "";

    if (mangaReviews.length === 0) {
        mangaReviews = getDefaultCommunityReviews(title, (category || "manhwa").toUpperCase(), liveRating, authorName);
    }

    const genres = (attrs.tags || [])
        .filter((t) => t.attributes?.group === "genre")
        .slice(0, 3)
        .map((t) => t.attributes?.name?.en)
        .join(", ");

    const isSameCreator =
        authorRel?.id === artistRel?.id ||
        authorName.trim().toLowerCase() === artistName.trim().toLowerCase();

    const creatorCards = isSameCreator
        ? [
            {
                id: "author-artist",
                name: authorName,
                character: "Author & Artist",
                avatar: getFallbackAuthorAvatar(authorName, authorBio),
            },
        ]
        : [
            {
                id: "author",
                name: authorName,
                character: "Author",
                avatar: getFallbackAuthorAvatar(authorName, authorBio),
            },
            {
                id: "artist",
                name: artistName,
                character: "Artist",
                avatar: getFallbackAuthorAvatar(artistName, artistBio),
            },
        ];

    const volAndChapSummary = [
        volumeCount ? `${volumeCount} Vols` : null,
        chapterCount ? `${chapterCount} Chs` : null,
    ]
        .filter(Boolean)
        .join(" · ") || (attrs.status || "Ongoing").toUpperCase();

    return cacheAndReturnDetail(cacheKey, {
        id: data.id,
        type: (category || "manhwa").toUpperCase(),
        title,
        year: attrs.year || "Ongoing",
        genres: genres || "Action, Fantasy",
        runtime: volAndChapSummary,
        certificate: (attrs.contentRating || "safe").toUpperCase(),
        poster: coverUrl,
        backdrop: officialBanner || coverUrl,
        tmdbRating: liveRating,
        tmdbVotes: liveFollows,
        communityRating: liveRating,
        communityVotes: liveFollows,
        synopsis:
            attrs.description?.en ||
            Object.values(attrs.description || {})[0] ||
            "No synopsis available.",
        cast: creatorCards,
        volumes: volumeCovers,
        artworks: officialArtworks,
        images: {
            backdrops: officialArtworks.filter((a) => a.format === "backdrop"),
            posters: volumeCovers.map((v) => ({
                id: v.id,
                file_path: v.cover,
                title: v.title,
                subtitle: v.subtitle,
                format: "poster",
            })),
        },
        reviews: mangaReviews,
        details: {
            director: authorName,
            writers: authorName,
            music: artistName,
            cinematography: (attrs.status || "Ongoing").toUpperCase(),
            boxOffice: volumeCount ? `${volumeCount} Volumes` : "Serialized",
            aspectRatio: chapterCount ? `${chapterCount} Chapters` : (category || "manhwa").toUpperCase(),
            studio: "MangaDex",
        },
    });
}