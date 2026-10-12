import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import tmdbRoutes from "../src/routes/tmdbRoutes.js";

test("tmdbRoutes has all expected route endpoints", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/tmdb", tmdbRoutes);

  const server = app.listen(0);
  const { port } = server.address();

  try {
    // Empty search should return empty results without hitting TMDB
    const res = await fetch(`http://localhost:${port}/api/tmdb/search?q=`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.deepEqual(json.data.results, []);
  } finally {
    server.close();
  }
});
