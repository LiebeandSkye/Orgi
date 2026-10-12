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

    // Check trending-month endpoint
    const resMonth = await fetch(`http://localhost:${port}/api/tmdb/trending-month`);
    assert.equal(resMonth.status, 200);
    const jsonMonth = await resMonth.json();
    assert.equal(jsonMonth.success, true);
    assert.ok(Array.isArray(jsonMonth.data.results));

    // Check top-rated endpoint
    const resTop = await fetch(`http://localhost:${port}/api/tmdb/top-rated`);
    assert.equal(resTop.status, 200);
    const jsonTop = await resTop.json();
    assert.equal(jsonTop.success, true);
    assert.ok(Array.isArray(jsonTop.data.results));

    // Check latest endpoint
    const resLatest = await fetch(`http://localhost:${port}/api/tmdb/latest`);
    assert.equal(resLatest.status, 200);
    const jsonLatest = await resLatest.json();
    assert.equal(jsonLatest.success, true);
    assert.ok(Array.isArray(jsonLatest.data.results));
  } finally {
    server.close();
  }
});
