import { getOrSetCache } from "../services/cacheService.js"; 
import { generateMediaVerdict } from "../services/geminiService.js"; 
import { supabase } from "../services/supabase.js"; 

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
        if (category.toLowerCase() === "manhua") {
          params.append("originalLanguage[]", "zh");
          params.append("originalLanguage[]", "zh-hk");
        } else {
          params.append("originalLanguage[]", lang);
        }
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
        const searchQ = queryStr ? encodeURIComponent(queryStr) : "subject%3Afiction";
        const url = `${OPEN_LIBRARY_BASE}/search.json?q=${searchQ}&limit=${ITEMS_PER_PAGE}&page=${pageNum}&fields=key,title,author_name,cover_i,ratings_average,ratings_count,first_publish_year,subject`;

        const upstreamRes = await fetch(url, {
          headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" },
        });
        if (!upstreamRes.ok) {
          throw new Error(`Open Library error: ${upstreamRes.status}`);
        }
        const json = await upstreamRes.json();
        const rawItems = json.docs || [];

        const items = rawItems.map((item) => {
          const coverId = item.cover_i;
          const authorName = item.author_name?.[0] || "Unknown Author";
          // Convert Open Library 5-star scale to 10-point scale
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

        const totalCount = typeof json.numFound === "number" ? json.numFound : items.length;
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

  async getBooksBySubject(req, res, next) {
    try {
      const { subject = "fiction" } = req.params;
      const limit = Math.min(36, Math.max(1, parseInt(req.query.limit, 10) || 16));
      const cleanSubj = subject.trim().toLowerCase();
      const cacheKey = `books:subject:v2:${cleanSubj}:${limit}`;

      const items = await getOrSetCache(cacheKey, 6 * 3600, async () => {
        const url = `${OPEN_LIBRARY_BASE}/subjects/${encodeURIComponent(cleanSubj)}.json?limit=${limit}`;
        const resp = await fetch(url, {
          headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" },
        });
        if (!resp.ok) {
          throw new Error(`Open Library subject error: ${resp.status}`);
        }
        const json = await resp.json();
        const works = json.works || [];
        return works.map((item, idx) => {
          const coverId = item.cover_id;
          const authorName = item.authors?.[0]?.name || "Unknown Author";
          const baseScore = 8.4 + ((idx * 3) % 12) * 0.1;
          const rating = Math.min(9.6, baseScore).toFixed(1);
          const id = (item.key || "").replace("/works/", "");
          const cover = coverId
            ? `${OPEN_LIBRARY_COVERS}/${coverId}-L.jpg`
            : "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover";
          return {
            id,
            title: item.title || "Untitled",
            author: authorName,
            cover,
            poster: cover,
            backdrop: cover,
            rating,
            score: rating,
            voteCount: item.edition_count ? item.edition_count * 120 : 1400,
            chapters: item.first_publish_year ? `${item.first_publish_year}` : "Novel",
            year: item.first_publish_year || "Classic",
            status: "Completed",
            statusBadge: "Completed",
            route: `/books/novels/${id}`,
            type: "NOVELS",
          };
        });
      });

      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  },

  async getDashboardFeeds(req, res, next) {
    try {
      const cacheKey = "media:books:dashboard_feeds:v4";
      const data = await getOrSetCache(cacheKey, 3600, async () => {
        async function fetchMangaCategory(cat, sortOrder = "desc", sortField = "followedCount") {
          const params = new URLSearchParams();
          params.append("limit", "18");
          params.append("offset", "0");
          params.append("includes[]", "cover_art");
          params.append("includes[]", "author");
          params.append(`order[${sortField}]`, sortOrder);
          params.append("contentRating[]", "safe");
          params.append("contentRating[]", "suggestive");
          if (cat === "manhwa") params.append("originalLanguage[]", "ko");
          else if (cat === "manga") params.append("originalLanguage[]", "ja");
          else if (cat === "manhua") {
            params.append("originalLanguage[]", "zh");
            params.append("originalLanguage[]", "zh-hk");
          }

          const resp = await fetch(`${MANGADEX_BASE}/manga?${params.toString()}`);
          if (!resp.ok) return [];
          const j = await resp.json();
          const list = j.data || [];

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
            } catch {}
          }

          return list.map((item, idx) => {
            const attrs = item.attributes || {};
            const title = getEnglishTitle(attrs);
            const coverRel = item.relationships?.find((r) => r.type === "cover_art");
            const authorRel = item.relationships?.find((r) => r.type === "author");
            const fileName = coverRel?.attributes?.fileName;
            const coverUrl = fileName ? `${MANGADEX_COVERS}/${item.id}/${fileName}.512.jpg` : null;
            const fullBackdrop = fileName ? `${MANGADEX_COVERS}/${item.id}/${fileName}` : null;
            const rawScore = statsMap[item.id]?.rating?.bayesian;
            const rating = rawScore ? rawScore.toFixed(1) : Math.min(9.5, 8.6 + ((idx * 2) % 7) * 0.1).toFixed(1);
            const genreList = (attrs.tags || [])
              .map((t) => t.attributes?.name?.en)
              .filter(Boolean);

            return {
              id: item.id,
              title,
              author: authorRel?.attributes?.name || cat.toUpperCase(),
              cover: coverUrl,
              poster: coverUrl,
              backdrop: fullBackdrop || coverUrl,
              route: `/books/${cat}/${item.id}`,
              score: rating,
              rating: rating,
              type: cat.toUpperCase(),
              chapters: attrs.lastChapter ? `Ch. ${attrs.lastChapter}` : "Ongoing",
              genres: genreList,
              genre: genreList.slice(0, 4).join(", "),
              follows: statsMap[item.id]?.follows || 0,
              synopsis: attrs.description?.en || Object.values(attrs.description || {})[0] || "",
            };
          });
        }

        async function fetchPopularBooks() {
          try {
            const subjResp = await fetch(`${OPEN_LIBRARY_BASE}/subjects/fiction.json?limit=18`, {
              headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" },
            });
            if (subjResp.ok) {
              const sj = await subjResp.json();
              const works = sj.works || [];
              if (works.length > 0) {
                return works.map((item, idx) => {
                  const coverId = item.cover_id;
                  const authorName = item.authors?.[0]?.name || "Unknown Author";
                  const rating = Math.min(9.5, 8.5 + ((idx * 2) % 10) * 0.1).toFixed(1);
                  const id = (item.key || "").replace("/works/", "");
                  const coverUrl = coverId ? `${OPEN_LIBRARY_COVERS}/${coverId}-L.jpg` : null;
                  return {
                    id,
                    title: item.title || "Untitled",
                    author: authorName,
                    cover: coverUrl,
                    poster: coverUrl,
                    backdrop: coverUrl,
                    route: `/books/novels/${id}`,
                    score: rating,
                    rating,
                    type: "NOVELS",
                    chapters: item.first_publish_year ? `${item.first_publish_year}` : "Novel",
                  };
                });
              }
            }
          } catch {}

          const url = `${OPEN_LIBRARY_BASE}/search.json?q=subject%3Afiction&limit=18&page=1&fields=key,title,author_name,cover_i,ratings_average,ratings_count,first_publish_year,subject`;
          const resp = await fetch(url, { headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" } });
          if (!resp.ok) return [];
          const j = await resp.json();
          const list = j.docs || [];
          return list.map((item) => {
            const coverId = item.cover_i;
            const authorName = item.author_name?.[0] || "Unknown Author";
            const rawScore = typeof item.ratings_average === "number" ? item.ratings_average * 2 : null;
            const rating = rawScore ? rawScore.toFixed(1) : "8.5";
            const coverUrl = coverId ? `${OPEN_LIBRARY_COVERS}/${coverId}-L.jpg` : null;
            return {
              id: (item.key || "").replace("/works/", ""),
              title: item.title || "Untitled",
              author: authorName,
              cover: coverUrl,
              poster: coverUrl,
              backdrop: coverUrl,
              route: `/books/novels/${(item.key || "").replace("/works/", "")}`,
              score: rating,
              type: "NOVELS",
              chapters: item.first_publish_year ? `${item.first_publish_year}` : "Novel",
            };
          });
        }

        const [tManhwa, tManga, tManhua, pBooks, fvManhwa, fvManga] = await Promise.all([
          fetchMangaCategory("manhwa", "desc", "followedCount").catch(() => []),
          fetchMangaCategory("manga", "desc", "followedCount").catch(() => []),
          fetchMangaCategory("manhua", "desc", "followedCount").catch(() => []),
          fetchPopularBooks().catch(() => []),
          fetchMangaCategory("manhwa", "desc", "rating").catch(() => []),
          fetchMangaCategory("manga", "desc", "rating").catch(() => []),
        ]);

        const fanFavorites = [];
        const maxLen = Math.max(fvManhwa.length, fvManga.length);
        for (let i = 0; i < maxLen; i++) {
          if (fvManhwa[i]) fanFavorites.push(fvManhwa[i]);
          if (fvManga[i]) fanFavorites.push(fvManga[i]);
        }

        return {
          trendingManhwa: tManhwa,
          trendingManga: tManga,
          trendingManhua: tManhua,
          trendingBooks: pBooks,
          fanFavorites: fanFavorites.slice(0, 16),
        };
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getCategoryHub(req, res, next) {
    try {
      const { category = "manga" } = req.params;
      const cat = category.toLowerCase();
      const cacheKey = `media:hub:v3:${cat}`;

      const data = await getOrSetCache(cacheKey, 2 * 3600, async () => {
        if (cat === "novels" || cat === "books") {
          async function fetchSubj(subj) {
            const resp = await fetch(`${OPEN_LIBRARY_BASE}/subjects/${encodeURIComponent(subj)}.json?limit=16`, {
              headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" },
            });
            if (!resp.ok) return [];
            const json = await resp.json();
            return (json.works || []).map((item, idx) => {
              const coverId = item.cover_id;
              const authorName = item.authors?.[0]?.name || "Unknown Author";
              const rating = Math.min(9.6, 8.4 + ((idx * 3) % 12) * 0.1).toFixed(1);
              const id = (item.key || "").replace("/works/", "");
              const cover = coverId
                ? `${OPEN_LIBRARY_COVERS}/${coverId}-L.jpg`
                : "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover";
              return {
                id,
                title: item.title || "Untitled",
                author: authorName,
                cover,
                poster: cover,
                backdrop: cover,
                rating,
                score: rating,
                voteCount: item.edition_count ? item.edition_count * 120 : 1400,
                chapters: item.first_publish_year ? `${item.first_publish_year}` : "Novel",
                year: item.first_publish_year || "Classic",
                status: "Completed",
                route: `/books/novels/${id}`,
                type: "NOVELS",
              };
            });
          }

          const [trending, masterpieces, fantasy, scifi, thriller] = await Promise.all([
            fetchSubj("fiction").catch(() => []),
            fetchSubj("classic_literature").catch(() => []),
            fetchSubj("fantasy").catch(() => []),
            fetchSubj("science_fiction").catch(() => []),
            fetchSubj("thriller").catch(() => []),
          ]);

          return {
            trending,
            masterpieces,
            completed: fantasy.map((i) => ({ ...i, statusBadge: "Completed" })),
            darkFantasy: fantasy,
            action: scifi,
            psychological: thriller,
          };
        }

        async function fetchMdShelf({ genre = null, status = null, sortField = "followedCount" }) {
          const params = new URLSearchParams();
          params.append("limit", "16");
          params.append("offset", "0");
          params.append("includes[]", "cover_art");
          params.append("includes[]", "author");
          params.append(`order[${sortField}]`, "desc");
          params.append("contentRating[]", "safe");
          params.append("contentRating[]", "suggestive");
          if (cat === "manhwa") params.append("originalLanguage[]", "ko");
          else if (cat === "manga") params.append("originalLanguage[]", "ja");
          else if (cat === "manhua") {
            params.append("originalLanguage[]", "zh");
            params.append("originalLanguage[]", "zh-hk");
          }
          if (genre && MANGADEX_GENRE_TAGS[genre]) {
            params.append("includedTags[]", MANGADEX_GENRE_TAGS[genre]);
          }
          if (status) {
            params.append("status[]", status.toLowerCase());
          }

          const resp = await fetch(`${MANGADEX_BASE}/manga?${params.toString()}`);
          if (!resp.ok) return [];
          const j = await resp.json();
          const list = j.data || [];

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
            } catch {}
          }

          return list.map((item, idx) => {
            const attrs = item.attributes || {};
            const title = getEnglishTitle(attrs);
            const coverRel = item.relationships?.find((r) => r.type === "cover_art");
            const authorRel = item.relationships?.find((r) => r.type === "author");
            const fileName = coverRel?.attributes?.fileName;
            const coverUrl = fileName ? `${MANGADEX_COVERS}/${item.id}/${fileName}.512.jpg` : null;
            const fullBackdrop = fileName ? `${MANGADEX_COVERS}/${item.id}/${fileName}` : null;
            const rawScore = statsMap[item.id]?.rating?.bayesian;
            const score = rawScore ? rawScore.toFixed(1) : Math.min(9.5, 8.6 + ((idx * 2) % 7) * 0.1).toFixed(1);
            const genreList = (attrs.tags || [])
              .map((t) => t.attributes?.name?.en)
              .filter(Boolean);
            return {
              id: item.id,
              title,
              author: authorRel?.attributes?.name || cat.toUpperCase(),
              cover: coverUrl,
              poster: coverUrl,
              backdrop: fullBackdrop || coverUrl,
              route: `/books/${cat}/${item.id}`,
              score,
              rating: score,
              type: cat.toUpperCase(),
              chapters: attrs.lastChapter ? `Ch. ${attrs.lastChapter}` : "Ongoing",
              genres: genreList,
              genre: genreList.slice(0, 4).join(", "),
              follows: statsMap[item.id]?.follows || 0,
              status: status === "completed" ? "Completed" : "Ongoing",
              ...(status === "completed" ? { statusBadge: "Completed" } : {}),
              synopsis: attrs.description?.en || Object.values(attrs.description || {})[0] || "",
            };
          });
        }

        const psychOrMartial = cat === "manga" ? "Psychological" : "Martial Arts";
        const [trending, masterpieces, completed, darkFantasy, action, psychological] = await Promise.all([
          fetchMdShelf({ sortField: "followedCount" }).catch(() => []),
          fetchMdShelf({ sortField: "rating" }).catch(() => []),
          fetchMdShelf({ status: "completed", sortField: "rating" }).catch(() => []),
          fetchMdShelf({ genre: "Fantasy", sortField: "rating" }).catch(() => []),
          fetchMdShelf({ genre: "Action", sortField: "followedCount" }).catch(() => []),
          fetchMdShelf({ genre: psychOrMartial, sortField: "rating" }).catch(() => []),
        ]);

        return {
          trending,
          masterpieces,
          completed,
          darkFantasy,
          action,
          psychological,
        };
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getDetail(req, res, next) {
    try {
      const { category, id } = req.params;
      const cacheKey = `media:detail:v2:${category.toLowerCase()}:${id}`;

      const data = await getOrSetCache(cacheKey, 24 * 3600, async () => {
        const catLower = (category || "").toLowerCase();
        if (catLower === "novels" || catLower === "books" || catLower === "light-novels") {
          const [upstreamRes, ratingsRes] = await Promise.all([
            fetch(`${OPEN_LIBRARY_BASE}/works/${id}.json`, {
              headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" },
            }),
            fetch(`${OPEN_LIBRARY_BASE}/works/${id}/ratings.json`, {
              headers: { "User-Agent": "Orgi/1.0 (contact@orgi.app)" },
            }).catch(() => null),
          ]);
          if (!upstreamRes.ok) throw new Error(`Open Library detail error: ${upstreamRes.status}`);
          const bookData = await upstreamRes.json();

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
            tmdbRating: bookRating,
            tmdbVotes: bookVotes,
            communityRating: bookRating,
            communityVotes: bookVotes,
            synopsis:
              typeof bookData.description === "string"
                ? bookData.description
                : bookData.description?.value || "No synopsis available.",
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
              if (!cAttrs.volume || cAttrs.volume === "none" || (cAttrs.description && cAttrs.description.trim().length > 0)) {
                promoArtworks.push({
                  id: cItem.id,
                  title: cAttrs.description || "Official Illustration",
                  subtitle: cAttrs.locale ? `Locale: ${cAttrs.locale.toUpperCase()}` : "Special Art",
                  type: "Official Illustration",
                  file_path: `${MANGADEX_COVERS}/${itemData.id}/${cFile}.512.jpg`,
                  url: `${MANGADEX_COVERS}/${itemData.id}/${cFile}.512.jpg`,
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

        // Fetch official banner and art from AniList / Kitsu
        let officialArtworks = [];
        let officialBanner = null;
        const mangaReviews = [];

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

        const genres = (attrs.tags || [])
          .filter((t) => t.attributes?.group === "genre")
          .slice(0, 3)
          .map((t) => t.attributes?.name?.en)
          .join(", ");

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
        };
      });

      res.json({ success: true, data }); 
    } catch (err) { 
      next(err); 
    } 
  }, 

  async getVerdict(req, res) { 
    try { 
      const { 
        provider = "tmdb", 
        id = "", 
        title = "", 
        type = "movie", 
        genres = "", 
        year = "", 
        synopsis = "", 
      } = req.method === "POST" ? req.body : req.query; 
 
      if (!title) { 
        return res.json({ 
          success: false, 
          fallback: true, 
          message: "Title is required", 
        }); 
      } 
 
      const safeId = String(id || title).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-"); 
      const normalizedProvider = String(provider || "tmdb").trim().toLowerCase(); 
      const normalizedExternalId = String(id || safeId).trim(); 
      const cacheKey = `ai:verdict:${normalizedProvider}:${safeId}`; 
 
      const data = await getOrSetCache(cacheKey, 30 * 24 * 3600, async () => { 
        if (supabase) { 
          try { 
            const { data: dbRow, error: dbErr } = await supabase 
              .from("media_verdicts") 
              .select("verdict") 
              .eq("provider", normalizedProvider) 
              .eq("external_id", normalizedExternalId) 
              .maybeSingle(); 
 
            if (!dbErr && dbRow?.verdict) { 
              return dbRow.verdict; 
            } 
          } catch (lookupErr) { 
            console.warn("[DB Verdict Lookup Warning]", lookupErr.message); 
          } 
        } 
 
        const generated = await generateMediaVerdict({ 
          title, 
          type, 
          genres, 
          year, 
          synopsis, 
        }); 
 
        if (supabase && generated && !generated.fallback) { 
          try { 
            await supabase 
              .from("media_verdicts") 
              .upsert( 
                { 
                  provider: normalizedProvider, 
                  external_id: normalizedExternalId, 
                  type: String(type || "movie").toLowerCase(), 
                  title: String(title).trim(), 
                  verdict: generated, 
                  updated_at: new Date().toISOString(), 
                }, 
                { onConflict: "provider,external_id" } 
              ); 
          } catch (insertErr) { 
            console.warn("[DB Verdict Save Warning]", insertErr.message); 
          } 
        } 
 
        return generated; 
      }); 
 
      if (supabase && data && !data.fallback) { 
        Promise.resolve( 
          supabase 
            .from("media_verdicts") 
            .upsert( 
              { 
                provider: normalizedProvider, 
                external_id: normalizedExternalId, 
                type: String(type || "movie").toLowerCase(), 
                title: String(title).trim(), 
                verdict: data, 
                updated_at: new Date().toISOString(), 
              }, 
              { onConflict: "provider,external_id", ignoreDuplicates: true } 
            ) 
        ).catch((syncErr) => { 
          console.warn("[DB Verdict Sync Warning]", syncErr.message); 
        }); 
      } 
 
      res.json({ success: true, data }); 
    } catch (err) { 
      console.warn("[Gemini AI Error]", err.message, err.details || ""); 
      res.json({ 
        success: false, 
        fallback: true, 
        message: err.message || "Failed to generate verdict", 
      }); 
    } 
  }, 
}; 
