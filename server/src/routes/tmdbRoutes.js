import express from "express"; 
import { getOrSetCache } from "../services/cacheService.js";

const router = express.Router(); 
const TMDB_BASE_URL = "https://api.themoviedb.org/3"; 

function getApiKey() { 
  const key = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || "b4ff80e1e0be756a6ca3ca60510e1231"; 
  return key ? key.toLowerCase().trim() : ""; 
} 

async function fetchTmdbApi(endpoint, params = {}) { 
  const apiKey = getApiKey(); 
  if (!apiKey) throw new Error("TMDB_API_KEY not configured on server"); 
  
  const query = new URLSearchParams({ api_key: apiKey, ...params }); 
  const res = await fetch(`${TMDB_BASE_URL}${endpoint}?${query.toString()}`); 
  if (!res.ok) { 
    const err = new Error(`TMDB error ${res.status}: ${res.statusText}`); 
    err.status = res.status; 
    throw err; 
  } 
  
  return res.json(); 
} 

router.get("/trending", async (req, res, next) => { 
  try { 
    const { type = "all", window = "week" } = req.query; 
    const cacheKey = `tmdb:trending:${type}:${window}`;
    const data = await getOrSetCache(cacheKey, 3 * 3600, () =>
      fetchTmdbApi(`/trending/${type}/${window}`)
    );
    res.json({ success: true, data }); 
  } catch (err) { 
    next(err); 
  } 
}); 

router.get("/trending-month", async (req, res, next) => {
  try {
    const { type = "all" } = req.query;
    const cacheKey = `tmdb:trending-month:${type}`;
    const data = await getOrSetCache(cacheKey, 3 * 3600, async () => {
      const now = new Date();
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const nowStr = now.toISOString().split("T")[0];
      const pastStr = past30.toISOString().split("T")[0];

      if (type === "movie") {
        const res = await fetchTmdbApi("/discover/movie", {
          sort_by: "popularity.desc",
          "primary_release_date.gte": pastStr,
          "primary_release_date.lte": nowStr
        });
        return {
          results: (res.results || []).map((m) => ({ ...m, media_type: "movie" }))
        };
      }

      if (type === "tv") {
        const res = await fetchTmdbApi("/discover/tv", {
          sort_by: "popularity.desc",
          "first_air_date.gte": pastStr,
          "first_air_date.lte": nowStr
        });
        return {
          results: (res.results || []).map((t) => ({ ...t, media_type: "tv" }))
        };
      }

      const [resM, resT] = await Promise.all([
        fetchTmdbApi("/discover/movie", {
          sort_by: "popularity.desc",
          "primary_release_date.gte": pastStr,
          "primary_release_date.lte": nowStr
        }),
        fetchTmdbApi("/discover/tv", {
          sort_by: "popularity.desc",
          "first_air_date.gte": pastStr,
          "first_air_date.lte": nowStr
        })
      ]);

      const mList = (resM.results || []).map((m) => ({ ...m, media_type: "movie" }));
      const tList = (resT.results || []).map((t) => ({ ...t, media_type: "tv" }));
      const combined = [...mList, ...tList].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      return { results: combined };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get("/top-rated", async (req, res, next) => {
  try {
    const { type = "all", page = 1 } = req.query;
    const cacheKey = `tmdb:top-rated:${type}:${page}`;
    const data = await getOrSetCache(cacheKey, 6 * 3600, async () => {
      if (type === "movie") {
        const res = await fetchTmdbApi("/movie/top_rated", { page });
        return {
          results: (res.results || []).map((m) => ({ ...m, media_type: "movie" }))
        };
      }
      if (type === "tv") {
        const res = await fetchTmdbApi("/tv/top_rated", { page });
        return {
          results: (res.results || []).map((t) => ({ ...t, media_type: "tv" }))
        };
      }

      const [resM, resT] = await Promise.all([
        fetchTmdbApi("/movie/top_rated", { page }),
        fetchTmdbApi("/tv/top_rated", { page })
      ]);

      const mList = (resM.results || []).map((m) => ({ ...m, media_type: "movie" }));
      const tList = (resT.results || []).map((t) => ({ ...t, media_type: "tv" }));
      const combined = [];
      const maxLen = Math.max(mList.length, tList.length);
      for (let i = 0; i < maxLen; i++) {
        if (mList[i]) combined.push(mList[i]);
        if (tList[i]) combined.push(tList[i]);
      }

      return { results: combined };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get("/latest", async (req, res, next) => {
  try {
    const { type = "all" } = req.query;
    const cacheKey = `tmdb:latest:${type}`;
    const data = await getOrSetCache(cacheKey, 3 * 3600, async () => {
      const now = new Date();
      const past60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const nowStr = now.toISOString().split("T")[0];
      const pastStr = past60.toISOString().split("T")[0];

      if (type === "movie") {
        const res = await fetchTmdbApi("/movie/now_playing");
        return {
          results: (res.results || []).map((m) => ({ ...m, media_type: "movie" }))
        };
      }
      if (type === "tv") {
        const res = await fetchTmdbApi("/discover/tv", {
          sort_by: "popularity.desc",
          "first_air_date.gte": pastStr,
          "first_air_date.lte": nowStr
        });
        return {
          results: (res.results || []).map((t) => ({ ...t, media_type: "tv" }))
        };
      }

      const [resM, resT] = await Promise.all([
        fetchTmdbApi("/movie/now_playing"),
        fetchTmdbApi("/discover/tv", {
          sort_by: "popularity.desc",
          "first_air_date.gte": pastStr,
          "first_air_date.lte": nowStr
        })
      ]);

      const mList = (resM.results || []).map((m) => ({ ...m, media_type: "movie" }));
      const tList = (resT.results || []).map((t) => ({ ...t, media_type: "tv" }));
      const combined = [];
      const maxLen = Math.max(mList.length, tList.length);
      for (let i = 0; i < maxLen; i++) {
        if (mList[i]) combined.push(mList[i]);
        if (tList[i]) combined.push(tList[i]);
      }

      return { results: combined };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}); 

router.get("/movie/:id", async (req, res, next) => { 
  try { 
    const { id } = req.params; 
    const cacheKey = `tmdb:movie:v2:${id}`;
    const data = await getOrSetCache(cacheKey, 24 * 3600, () =>
      fetchTmdbApi(`/movie/${id}`, { append_to_response: "credits,reviews,release_dates,similar,images,videos" })
    );
    res.json({ success: true, data }); 
  } catch (err) { 
    next(err); 
  } 
}); 

router.get("/tv/:id", async (req, res, next) => { 
  try { 
    const { id } = req.params; 
    const cacheKey = `tmdb:tv:v2:${id}`; 

    const data = await getOrSetCache(cacheKey, 24 * 3600, () =>
      fetchTmdbApi(`/tv/${id}`, { append_to_response: "credits,reviews,season/1,images,videos" })
    );
    res.json({ success: true, data }); 
  } catch (err) { 
    next(err); 
  } 
}); 

router.get("/tv/:id/season/:season", async (req, res, next) => { 
  try { 
    const { id, season } = req.params; 
    const cacheKey = `tmdb:tv:${id}:season:${season}`;
    const data = await getOrSetCache(cacheKey, 24 * 3600, () =>
      fetchTmdbApi(`/tv/${id}/season/${season}`)
    );
    res.json({ success: true, data }); 
  } catch (err) { 
    next(err); 
  } 
}); 

router.get("/search", async (req, res, next) => { 
  try { 
    const { q, page = 1 } = req.query; 
    if (!q || !q.trim()) return res.json({ success: true, data: { results: [], total_results: 0 } }); 
    const queryTerm = q.trim();
    const cacheKey = `tmdb:search:${encodeURIComponent(queryTerm.toLowerCase())}:${page}`;
    const data = await getOrSetCache(cacheKey, 3600, () =>
      fetchTmdbApi("/search/multi", { query: queryTerm, page })
    );
    res.json({ success: true, data }); 
  } catch (err) { 
    next(err); 
  } 
}); 

export default router; 
