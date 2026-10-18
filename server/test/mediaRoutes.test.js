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

    const emptyRes = await fetch(`http://localhost:${port}/api/media/verdict`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({}), 
    }); 
    assert.equal(emptyRes.status, 200); 
    const emptyJson = await emptyRes.json(); 
    assert.equal(emptyJson.success, false); 
    assert.equal(emptyJson.fallback, true); 

    const validRes = await fetch(`http://localhost:${port}/api/media/verdict`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ 
        title: "Test Movie", 
        type: "movie", 
      }), 
    }); 
    assert.equal(validRes.status, 200); 
    const validJson = await validRes.json(); 
    assert.ok(validJson.success || validJson.fallback); 
  } finally { 
    server.close(); 
  } 
}); 

