import { getOrSetCache } from "../services/cacheService.js";

const MANGADEX_BASE = "https://api.mangadex.org";
const MANGADEX_COVERS = "https://uploads.mangadex.org/covers";
const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const OPEN_LIBRARY_COVERS = "https://covers.openlibrary.org/b/id";
const ITEMS_PER_PAGE = 18;

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

export const mediaController = {
  async ping(req, res) {
    res.json({ status: "ok" });
  },

  async getManga(req, res, next) {
    try {
      const { category = "manhwa", page = 1, q = "" } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const queryStr = (q || "").trim();
      const cacheKey = `mangadex:list:${category.toLowerCase()}:${pageNum}:${encodeURIComponent(queryStr.toLowerCase())}`;

      const data = await getOrSetCache(cacheKey, 2 * 3600, async () => {
        const langMap = { manga: "ja", manhwa: "ko", manhua: "zh" };
        const lang = langMap[category.toLowerCase()] || "ko";
        const offset = (pageNum - 1) * ITEMS_PER_PAGE;

        const params = new URLSearchParams();
        params.append("limit", ITEMS_PER_PAGE);
        params.append("offset", offset);
        params.append("originalLanguage[]", lang);
        params.append("includes[]", "cover_art");
        params.append("includes[]", "author");
        if (queryStr) {
          params.append("title", queryStr);
          params.append("order[relevance]", "desc");
        } else {
          params.append("order[followedCount]", "desc");
        }
        params.append("contentRating[]", "safe");
        params.append("contentRating[]", "suggestive");

        const upstreamRes = await fetch(`${MANGADEX_BASE}/manga?${params.toString()}`);
        if (!upstreamRes.ok) {
          throw new Error(`MangaDex error: ${upstreamRes.status}`);
        }
        const json = await upstreamRes.json();
        const list = json.data || [];

        let statsMap = {};
        if (list.length > 0) {
          try {
            const statParams = new URLSearchParams();
            list.forEach((m) => statParams.append("manga[]", m.id));
            const statRes = await fetch(`${MANGADEX_BASE}/statistics/manga?${statParams.toString()}`);
            if (statRes.ok) {
              const statJson = await statRes.json();
              statsMap = statJson.statistics || {};
            }
          } catch {
            // fallback
          }
        }

        const items = list.map((item) => {
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

        const totalCount = typeof json.total === "number" ? json.total : items.length;
        let totalPages = Math.min(18, Math.ceil(totalCount / ITEMS_PER_PAGE));
        if (items.length < ITEMS_PER_PAGE) {
          totalPages = items.length > 0 ? pageNum : Math.max(1, pageNum - 1);
        }

        return { items, totalPages: Math.max(1, totalPages) };
      });

      res.json({ success: true, data: data.items, totalPages: data.totalPages });
    } catch (err) {
      next(err);
    }
  },

  async getBooks(req, res, next) {
    try {
      const { page = 1, q = "" } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const queryStr = (q || "").trim();
      const cacheKey = `books:list:${pageNum}:${encodeURIComponent(queryStr.toLowerCase())}`;

      const data = await getOrSetCache(cacheKey, 6 * 3600, async () => {
        const offset = (pageNum - 1) * ITEMS_PER_PAGE;
        const url = queryStr
          ? `${OPEN_LIBRARY_BASE}/search.json?q=${encodeURIComponent(queryStr)}&limit=${ITEMS_PER_PAGE}&page=${pageNum}`
          : `${OPEN_LIBRARY_BASE}/subjects/fiction.json?limit=${ITEMS_PER_PAGE}&offset=${offset}`;

        const upstreamRes = await fetch(url, {
          headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" },
        });
        if (!upstreamRes.ok) {
          throw new Error(`Open Library error: ${upstreamRes.status}`);
        }
        const json = await upstreamRes.json();
        const rawItems = json.docs || json.works || [];

        const items = rawItems.map((item) => {
          const coverId = item.cover_id || item.cover_i;
          const authorName = item.author_name?.[0] || item.authors?.[0]?.name || "Unknown Author";
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
            : items.length;
        let totalPages = Math.min(18, Math.ceil(totalCount / ITEMS_PER_PAGE));
        if (items.length < ITEMS_PER_PAGE) {
          totalPages = items.length > 0 ? pageNum : Math.max(1, pageNum - 1);
        }

        return { items, totalPages: Math.max(1, totalPages) };
      });

      res.json({ success: true, data: data.items, totalPages: data.totalPages });
    } catch (err) {
      next(err);
    }
  },

  async getDetail(req, res, next) {
    try {
      const { category, id } = req.params;
      const cacheKey = `media:detail:${category.toLowerCase()}:${id}`;

      const data = await getOrSetCache(cacheKey, 24 * 3600, async () => {
        const catLower = (category || "").toLowerCase();
        if (catLower === "novels" || catLower === "books" || catLower === "light-novels") {
          const upstreamRes = await fetch(`${OPEN_LIBRARY_BASE}/works/${id}.json`, {
            headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" },
          });
          if (!upstreamRes.ok) throw new Error(`Open Library detail error: ${upstreamRes.status}`);
          const bookData = await upstreamRes.json();
          const coverId = bookData.covers?.[0];
          const coverUrl = coverId
            ? `${OPEN_LIBRARY_COVERS}/${coverId}-L.jpg`
            : "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover";

          let authorName = "Unknown Author";
          let authorAvatar = null;
          let authorBio = "";
          const authorKey = bookData.authors?.[0]?.author?.key;
          if (authorKey) {
            try {
              const authorRes = await fetch(`${OPEN_LIBRARY_BASE}${authorKey}.json`, {
                headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" },
              });
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
              // fallback
            }
          }

          return {
            id,
            type: "BOOK / NOVEL",
            title: bookData.title || "Untitled",
            year: bookData.first_publish_date || "Published",
            genres: (bookData.subjects || []).slice(0, 3).join(", ") || "Fiction",
            runtime: "Print / Digital",
            certificate: "All Ages",
            poster: coverUrl,
            backdrop: coverUrl,
            tmdbRating: 8.6,
            tmdbVotes: "1.2k ratings",
            communityRating: 8.8,
            communityVotes: "340 ratings",
            synopsis:
              typeof bookData.description === "string"
                ? bookData.description
                : bookData.description?.value || "No synopsis available.",
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

        // Manga / Manhwa / Manhua
        const [mangaRes, statRes, aggRes] = await Promise.all([
          fetch(`${MANGADEX_BASE}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`),
          fetch(`${MANGADEX_BASE}/statistics/manga/${id}`).catch(() => null),
          fetch(`${MANGADEX_BASE}/manga/${id}/aggregate`).catch(() => null),
        ]);

        if (!mangaRes.ok) throw new Error(`MangaDex detail error: ${mangaRes.status}`);
        const { data: itemData } = await mangaRes.json();
        const attrs = itemData.attributes || {};

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
            // fallback
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
            // fallback
          }
        }

        const title = getEnglishTitle(attrs);
        const coverRel = itemData.relationships?.find((r) => r.type === "cover_art");
        const authorRel = itemData.relationships?.find((r) => r.type === "author");
        const artistRel = itemData.relationships?.find((r) => r.type === "artist");
        const fileName = coverRel?.attributes?.fileName;
        const coverUrl = fileName
          ? `${MANGADEX_COVERS}/${itemData.id}/${fileName}.512.jpg`
          : "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover";

        const genres = (attrs.tags || [])
          .filter((t) => t.attributes?.group === "genre")
          .slice(0, 3)
          .map((t) => t.attributes?.name?.en)
          .join(", ");

        const authorName = authorRel?.attributes?.name || "Unknown Author";
        const artistName = artistRel?.attributes?.name || authorName;

        const isSameCreator =
          authorRel?.id === artistRel?.id ||
          authorName.trim().toLowerCase() === artistName.trim().toLowerCase();

        const creatorCards = isSameCreator
          ? [{ id: "author-artist", name: authorName, character: "Author & Artist", avatar: null }]
          : [
              { id: "author", name: authorName, character: "Author", avatar: null },
              { id: "artist", name: artistName, character: "Artist", avatar: null },
            ];

        const volAndChapSummary = [
          volumeCount ? `${volumeCount} Vols` : null,
          chapterCount ? `${chapterCount} Chs` : null,
        ]
          .filter(Boolean)
          .join(" · ") || (attrs.status || "Ongoing").toUpperCase();

        return {
          id: itemData.id,
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
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
