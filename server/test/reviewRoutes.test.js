import test from "node:test"; 
import assert from "node:assert/strict"; 
import express from "express"; 
import reviewRoutes from "../src/routes/reviewRoutes.js"; 
 
test("reviewRoutes handles get reviews for unknown item gracefully", async () => { 
  const app = express(); 
  app.use(express.json()); 
  app.use("/api/reviews", reviewRoutes); 
 
  const server = app.listen(0); 
  const { port } = server.address(); 
 
  try { 
    const res = await fetch(`http://localhost:${port}/api/reviews/tmdb/99999999`); 
    assert.equal(res.status, 200); 
    const json = await res.json(); 
    assert.equal(json.success, true); 
    assert.equal(json.data.communityVotes, 0); 
    assert.deepEqual(json.data.reviews, []); 
  } finally { 
    server.close(); 
  } 
}); 
