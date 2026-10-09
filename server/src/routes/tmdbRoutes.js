import express from "express";

const router = express.Router();
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function getApiKey() {
  return process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || "b4ff80e1e0be756a6ca3ca60510e1231";
}

async function fetchTmdbApi(endpoint, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("TMDB_API_KEY not configured on server");
  }
  const query = new URLSearchParams({
    api_key: apiKey,
    ...params
  });
  const res = await fetch(`${TMDB_BASE_URL}${endpoint}?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// GET /api/tmdb/trending
router.get("/trending", async (req, res, next) => {
  try {
    const { type = "all", window = "week" } = req.query;
    const data = await fetchTmdbApi(`/trending/${type}/${window}`);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/tmdb/movie/:id
router.get("/movie/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await fetchTmdbApi(`/movie/${id}`, {
      append_to_response: "credits,reviews,release_dates,similar"
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/tmdb/tv/:id
router.get("/tv/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await fetchTmdbApi(`/tv/${id}`, {
      append_to_response: "credits,reviews,season/1"
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/tmdb/tv/:id/season/:season
router.get("/tv/:id/season/:season", async (req, res, next) => {
  try {
    const { id, season } = req.params;
    const data = await fetchTmdbApi(`/tv/${id}/season/${season}`);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/tmdb/search
router.get("/search", async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, data: { results: [], total_results: 0 } });
    }
    const data = await fetchTmdbApi("/search/multi", { query: q.trim(), page });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
