import express from "express";

const router = express.Router();
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function fetchTmdbApi(endpoint, params = {}) {
  const apiKey = process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;
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
    const { type = "movie", window = "week" } = req.query;
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
      append_to_response: "credits,reviews,similar"
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
      append_to_response: "credits,season/1"
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/tmdb/search
router.get("/search", async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;
    const data = await fetchTmdbApi("/search/multi", { query: q || "dune", page });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
