import test from "node:test"; 
import assert from "node:assert/strict"; 
import express from "express"; 
import collectionRoutes from "../src/routes/collectionRoutes.js"; 

test("collectionRoutes has check endpoint mounted", async () => { 
  const app = express(); 
  app.use(express.json()); 
  app.use("/api/collections", collectionRoutes); 

  const server = app.listen(0); 
  const { port } = server.address(); 

  try { 
    const res = await fetch(`http://localhost:${port}/api/collections/check/tmdb/157336`); 
    assert.equal(res.status, 200); 
    const json = await res.json(); 
    assert.equal(json.success, true); 
    assert.equal(typeof json.data.inCollection, "boolean"); 
  } finally { 
    server.close(); 
  } 
}); 

test("collectionRoutes getCollection requires auth", async () => { 
  const app = express(); 
  app.use(express.json()); 
  app.use("/api/collections", collectionRoutes); 

  const server = app.listen(0); 
  const { port } = server.address(); 

  try { 
    const res = await fetch(`http://localhost:${port}/api/collections`); 
    assert.equal(res.status, 401); 
  } finally { 
    server.close(); 
  } 
}); 
