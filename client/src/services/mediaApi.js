import authorMale from "../assets/author-male.png";
import authorFemale from "../assets/author-female.png";

const MANGADEX_BASE = "https://api.mangadex.org";
const MANGADEX_COVERS = "https://uploads.mangadex.org/covers";
const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org/b/id";
const API_BASE_URL = "/api/media";

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
    params.append("limit", ITEMS_PER_PAGE);
    params.append("offset", offset);
    params.append("originalLanguage[]", lang);
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
            rating,
            chapters:
                chText || volText || (attrs.status ? attrs.status.charAt(0).toUpperCase() + attrs.status.slice(1) : "Ongoing"),
            status: attrs.status
                ? attrs.status.charAt(0).toUpperCase() + attrs.status.slice(1)
                : "Ongoing",
            genres: genreList,
            genre: genreList.join(", "),
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

export async function fetchBooksDashboardFeeds() {
    try {
        const [
            trendingManhwa,
            trendingManga,
            trendingManhua,
            popularBooks,
            fanFavoritesManhwa,
            fanFavoritesManga,
        ] = await Promise.all([
            fetchMangaDexByCategory("manhwa", 1, "", "All", "All", "Most popular").catch(() => []),
            fetchMangaDexByCategory("manga", 1, "", "All", "All", "Most popular").catch(() => []),
            fetchMangaDexByCategory("manhua", 1, "", "All", "All", "Most popular").catch(() => []),
            fetchBooks(1, "").catch(() => []),
            fetchMangaDexByCategory("manhwa", 1, "", "All", "All", "Top rated").catch(() => []),
            fetchMangaDexByCategory("manga", 1, "", "All", "All", "Top rated").catch(() => []),
        ]);

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

        // Combined top rated fan favorites alternating Manhwa & Manga
        const fanFavorites = [];
        const maxLen = Math.max(fanFavoritesManhwa.length, fanFavoritesManga.length);
        for (let i = 0; i < maxLen; i++) {
            if (fanFavoritesManhwa[i]) fanFavorites.push(formatRoute(fanFavoritesManhwa[i], "manhwa"));
            if (fanFavoritesManga[i]) fanFavorites.push(formatRoute(fanFavoritesManga[i], "manga"));
        }

        return {
            trendingManhwa: (trendingManhwa || []).map((m) => formatRoute(m, "manhwa")),
            trendingManga: (trendingManga || []).map((m) => formatRoute(m, "manga")),
            trendingManhua: (trendingManhua || []).map((m) => formatRoute(m, "manhua")),
            trendingBooks: (popularBooks || []).map((b) => formatRoute(b, "novels")),
            fanFavorites: fanFavorites.slice(0, 16),
        };
    } catch (err) {
        console.error("Failed to fetch books dashboard feeds:", err);
        return {
            trendingManhwa: [],
            trendingManga: [],
            trendingManhua: [],
            trendingBooks: [],
            fanFavorites: [],
        };
    }
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
    const url = query.trim()
        ? `${OPEN_LIBRARY_BASE}/search.json?q=${encodeURIComponent(query.trim())}&limit=${ITEMS_PER_PAGE}&page=${page}`
        : `${OPEN_LIBRARY_BASE}/subjects/fiction.json?limit=${ITEMS_PER_PAGE}&offset=${offset}`;

    const res = await fetch(url);
    const json = await res.json();
    const rawItems = json.docs || json.works || [];

    const results = rawItems.map((item) => {
        const coverId = item.cover_id || item.cover_i;
        const authorName =
            item.author_name?.[0] || item.authors?.[0]?.name || "Unknown Author";
        return {
            id: (item.key || "").replace("/works/", ""),
            title: item.title || "Untitled",
            author: authorName,
            cover: coverId
                ? `${OPEN_LIBRARY_COVERS}/${coverId}-L.jpg`
                : "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover",
            rating: "8.6",
            chapters: item.first_publish_year ? `${item.first_publish_year}` : "Novel",
            status: "Completed",
            genres: Array.isArray(item.subject) ? item.subject : Array.isArray(item.subjects) ? item.subjects : ["Fiction"],
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
    else if (category === "manhua") params.append("originalLanguage[]", "zh");

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

export async function fetchMediaDetails(category, id) {
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
                return data;
            }
        }
    } catch {
        // Fall back to direct fetching below
    }
    if (category === "novels" || category === "books" || category === "light-novels") {
        const res = await fetch(`${OPEN_LIBRARY_BASE}/works/${id}.json`);
        const data = await res.json();
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

        return {
            id,
            type: "BOOK / NOVEL",
            title: data.title || "Untitled",
            year: data.first_publish_date || "Published",
            genres: (data.subjects || []).slice(0, 3).join(", ") || "Fiction",
            runtime: volumeCovers.length > 1 ? `${volumeCovers.length} Editions / Vols` : "Print / Digital",
            certificate: "All Ages",
            poster: coverUrl,
            backdrop: coverUrl,
            tmdbRating: 8.6,
            tmdbVotes: "1.2k ratings",
            communityRating: 8.8,
            communityVotes: "340 ratings",
            synopsis:
                typeof data.description === "string"
                    ? data.description
                    : data.description?.value || "No synopsis available.",
            cast: [
                { id: "author", name: authorName, character: "Author", avatar: authorAvatar }
            ],
            volumes: volumeCovers,
            reviews: [],
            details: {
                director: authorName,
                writers: authorName,
                music: "—",
                cinematography: "—",
                boxOffice: volumeCovers.length > 0 ? `${volumeCovers.length} Covers / Editions` : "—",
                aspectRatio: "Book",
                studio: "Open Library",
            },
        };
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

    const genres = (attrs.tags || [])
        .filter((t) => t.attributes?.group === "genre")
        .slice(0, 3)
        .map((t) => t.attributes?.name?.en)
        .join(", ");

    const authorName = authorRel?.attributes?.name || "Unknown Author";
    const artistName = artistRel?.attributes?.name || authorName;
    const authorBio = authorRel?.attributes?.biography?.en || "";
    const artistBio = artistRel?.attributes?.biography?.en || "";

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

    return {
        id: data.id,
        type: (category || "manhwa").toUpperCase(),
        title,
        year: attrs.year || "Ongoing",
        genres: genres || "Action, Fantasy",
        runtime: volAndChapSummary,
        certificate: (attrs.contentRating || "safe").toUpperCase(),
        poster: coverUrl,
        backdrop: coverUrl,
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
        reviews: [],
        details: {
            director: authorName,
            writers: authorName,
            music: artistName,
            cinematography: (attrs.status || "Ongoing").toUpperCase(),
            boxOffice: volumeCount ? `${volumeCount} Volumes` : "Serialized",
            aspectRatio: chapterCount ? `${chapterCount} Chapters` : (category || "manhwa").toUpperCase(),
            studio: "MangaDex",
        },
    };
}