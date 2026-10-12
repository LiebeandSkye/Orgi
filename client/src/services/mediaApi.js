import authorMale from "../assets/author-male.png";
import authorFemale from "../assets/author-female.png";

const MANGADEX_BASE = "https://api.mangadex.org";
const MANGADEX_COVERS = "https://uploads.mangadex.org/covers";
const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org/b/id";

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

export async function fetchMangaDexByCategory(category = "manhwa", page = 1, query = "") {
    const langMap = { manga: "ja", manhwa: "ko", manhua: "zh" };
    const lang = langMap[category] || "ko";
    const offset = (page - 1) * ITEMS_PER_PAGE;

    const params = new URLSearchParams();
    params.append("limit", ITEMS_PER_PAGE);
    params.append("offset", offset);
    params.append("originalLanguage[]", lang);
    params.append("includes[]", "cover_art");
    params.append("includes[]", "author");
    if (query.trim()) {
        params.append("title", query.trim());
        params.append("order[relevance]", "desc");
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
        };
    });

    const totalCount = typeof json.total === "number" ? json.total : results.length;
    let totalPages = Math.min(18, Math.ceil(totalCount / ITEMS_PER_PAGE));
    if (results.length < ITEMS_PER_PAGE) {
        totalPages = results.length > 0 ? page : Math.max(1, page - 1);
    }
    results.totalPages = Math.max(1, totalPages);
    return results;
}

export async function fetchBooks(page = 1, query = "") {
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
        };
    });

    const totalCount =
        typeof json.numFound === "number"
            ? json.numFound
            : typeof json.work_count === "number"
            ? json.work_count
            : results.length;
    let totalPages = Math.min(18, Math.ceil(totalCount / ITEMS_PER_PAGE));
    if (results.length < ITEMS_PER_PAGE) {
        totalPages = results.length > 0 ? page : Math.max(1, page - 1);
    }
    results.totalPages = Math.max(1, totalPages);
    return results;
}

export async function fetchMediaDetails(category, id) {
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

        return {
            id,
            type: "BOOK / NOVEL",
            title: data.title || "Untitled",
            year: data.first_publish_date || "Published",
            genres: (data.subjects || []).slice(0, 3).join(", ") || "Fiction",
            runtime: "Print / Digital",
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
            reviews: [],
            details: {
                director: authorName,
                writers: authorName,
                music: "—",
                cinematography: "—",
                boxOffice: "—",
                aspectRatio: "Book",
                studio: "Open Library",
            },
        };
    }

    const [res, statRes, aggRes] = await Promise.all([
        fetch(`${MANGADEX_BASE}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`),
        fetch(`${MANGADEX_BASE}/statistics/manga/${id}`).catch(() => null),
        fetch(`${MANGADEX_BASE}/manga/${id}/aggregate`).catch(() => null),
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
    if (aggRes && aggRes.ok) {
        try {
            const aggData = await aggRes.json();
            const volumesObj = aggData.volumes || {};
            const volKeys = Object.keys(volumesObj).filter((k) => k !== "none");
            if (volKeys.length > 0 && !volumeCount) {
                volumeCount = volKeys.length;
            }
            let totalChapters = 0;
            Object.values(volumesObj).forEach((v) => {
                totalChapters += Object.keys(v.chapters || {}).length;
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