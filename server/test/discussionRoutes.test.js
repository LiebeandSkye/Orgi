import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import "dotenv/config";
import discussionRoutes from "../src/routes/discussionRoutes.js";

test("discussionRoutes /tv/:seriesId/season/:seasonNumber/counts returns valid structure", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/discussions", discussionRoutes);

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/api/discussions/tv/99999999/season/1/counts`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(typeof json.data, "object");
  } finally {
    server.close();
  }
});

test("discussionRoutes /tv/:seriesId/season/:seasonNumber/episode/:episodeNumber returns empty discussion for unknown episode", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/discussions", discussionRoutes);

  const server = app.listen(0);
  const { port } = server.address();

  try {
    const res = await fetch(`http://localhost:${port}/api/discussions/tv/99999999/season/1/episode/1`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.deepEqual(json.data.comments, []);
    assert.equal(json.data.totalCount, 0);
    assert.deepEqual(json.data.likedCommentIds, []);
  } finally {
    server.close();
  }
});
