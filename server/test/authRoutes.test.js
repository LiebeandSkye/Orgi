import test from "node:test"; 
import assert from "node:assert/strict"; 
import express from "express"; 
import authRoutes from "../src/routes/authRoutes.js"; 

test("authRoutes refresh endpoint validates refresh_token presence", async () => { 
  const app = express(); 
  app.use(express.json()); 
  app.use("/api/auth", authRoutes); 

  const server = app.listen(0); 
  const { port } = server.address(); 

  try { 
    const res = await fetch(`http://localhost:${port}/api/auth/refresh`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({}), 
    }); 
    assert.equal(res.status, 400); 
    const json = await res.json(); 
    assert.equal(json.error?.code, "REFRESH_TOKEN_REQUIRED"); 
  } finally { 
    server.close(); 
  } 
}); 

test("authRoutes refresh endpoint rejects invalid refresh_token", async () => { 
  const app = express(); 
  app.use(express.json()); 
  app.use("/api/auth", authRoutes); 

  const server = app.listen(0); 
  const { port } = server.address(); 

  try { 
    const res = await fetch(`http://localhost:${port}/api/auth/refresh`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ refresh_token: "invalid-token" }), 
    }); 
    assert.equal(res.status, 401); 
    const json = await res.json(); 
    assert.equal(json.error?.code, "INVALID_REFRESH_TOKEN"); 
  } finally { 
    server.close(); 
  } 
}); 
