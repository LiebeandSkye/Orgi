import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import mediaRoutes from "../src/routes/mediaRoutes.js";

test("mediaRoutes handles empty query / default response structure", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/media", mediaRoutes);

  const server = app.listen(0);
  const { port } = server.address();

  try {
    // When querying with a test request or checking routes
    const res = await fetch(`http://localhost:${port}/api/media/ping`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.status, "ok");
  } finally {
    server.close();
  }
});
