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

const MANGADEX_GENRE_TAGS = {
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

export const mediaController = {
  async ping(req, res) {
    res.json({ status: "ok" });
  },

  async getManga(req, res, next) {
    try {
      const { category = "manhwa", page = 1, q = "", genre = "All", status = "All", sort = "Top rated" } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const queryStr = (q || "").trim();
      const genreStr = (genre || "All").trim();
      const statusStr = (status || "All").trim();
      const sortStr = (sort || "Top rated").trim();
      const cacheKey = `mangadex:list:${category.toLowerCase()}:${pageNum}:${genreStr}:${statusStr}:${sortStr}:${encodeURIComponent(queryStr.toLowerCase())}`;

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

        const genreList = genreStr && genreStr !== "All"
          ? genreStr.split(",").map((g) => g.trim()).filter(Boolean)
          : [];

        genreList.forEach((g) => {
          if (MANGADEX_GENRE_TAGS[g]) {
            params.append("includedTags[]", MANGADEX_GENRE_TAGS[g]);
          }
        });

        if (statusStr !== "All") {
          params.append("status[]", statusStr.toLowerCase());
        }

        if (queryStr) {
          params.append("title", queryStr);
          params.append("order[relevance]", "desc");
        } else if (sortStr === "Top rated") {
          params.append("order[rating]", "desc");
        } else if (sortStr === "Most popular") {
          params.append("order[followedCount]", "desc");
        } else if (sortStr === "Latest update") {
          params.append("order[latestUploadedChapter]", "desc");
        } else if (sortStr === "Alphabetical") {
          params.append("order[title]", "asc");
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
        const totalCount = typeof json.total === "number" ? json.total : items.length;
        let totalPages = Math.min(MAX_MANGADEX_PAGES, Math.ceil(totalCount / ITEMS_PER_PAGE));
        if (items.length < ITEMS_PER_PAGE) {
          totalPages = items.length > 0 ? pageNum : Math.max(1, pageNum - 1);
        } else if (pageNum >= totalPages && items.length === ITEMS_PER_PAGE && pageNum < MAX_MANGADEX_PAGES) {
          totalPages = pageNum + 1;
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
            genres: Array.isArray(item.subject) ? item.subject : Array.isArray(item.subjects) ? item.subjects : ["Fiction"],
            genre: Array.isArray(item.subject) ? item.subject.slice(0, 5).join(", ") : "Fiction",
          };
        });

        const totalCount =
          typeof json.numFound === "number"
            ? json.numFound
            : typeof json.work_count === "number"
            ? json.work_count
            : items.length;
        let totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
        if (items.length < ITEMS_PER_PAGE) {
          totalPages = items.length > 0 ? pageNum : Math.max(1, pageNum - 1);
        } else if (pageNum >= totalPages && items.length === ITEMS_PER_PAGE) {
          totalPages = pageNum + 1;
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

          const rawCovers = Array.isArray(bookData.covers)
            ? bookData.covers.filter((cid) => cid && cid > 0)
            : [];

          let volumeCovers = rawCovers.map((cid, idx) => ({
            id: `cover-${cid}`,
            volume: rawCovers.length > 1 ? `${idx + 1}` : "1",
            title: rawCovers.length > 1 ? `Edition / Volume ${idx + 1}` : bookData.title || "Edition 1",
            cover: `${OPEN_LIBRARY_COVERS}/${cid}-L.jpg`,
            subtitle: bookData.first_publish_date || "Print / Digital",
          }));

          try {
            const editionsRes = await fetch(`${OPEN_LIBRARY_BASE}/works/${id}/editions.json?limit=24`, {
              headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" },
            });
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
                    title: ed.title || bookData.title || `Edition ${editionItems.length + 1}`,
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
            title: bookData.title || "Untitled",
            year: bookData.first_publish_date || "Published",
            genres: (bookData.subjects || []).slice(0, 3).join(", ") || "Fiction",
            runtime: volumeCovers.length > 1 ? `${volumeCovers.length} Editions / Vols` : "Print / Digital",
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

        // Manga / Manhwa / Manhua
        const [mangaRes, statRes, aggRes, coversRes] = await Promise.all([
          fetch(`${MANGADEX_BASE}/manga/${id}?includes[]=cover_art&includes[]=author&includes[]=artist`),
          fetch(`${MANGADEX_BASE}/statistics/manga/${id}`).catch(() => null),
          fetch(`${MANGADEX_BASE}/manga/${id}/aggregate`).catch(() => null),
          fetch(`${MANGADEX_BASE}/cover?manga[]=${id}&limit=100&order[volume]=asc`).catch(() => null),
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
              // Prefer original language or English cover when multiple locales exist for the same volume
              if (!existing || cAttrs.locale === attrs.originalLanguage || cAttrs.locale === "en") {
                const chCountForVol = volumeChapterCounts[volNum];
                byVol.set(key, {
                  id: cItem.id,
                  volume: volNum,
                  title: volNum !== "Main" ? `Volume ${volNum}` : title,
                  cover: `${MANGADEX_COVERS}/${itemData.id}/${cFile}.512.jpg`,
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
            // fallback
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
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};
