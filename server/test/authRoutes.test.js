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
 
test("authRoutes oauth endpoint returns authorization url with code_verifier for google, discord, github", async () => { 
  const app = express(); 
  app.use(express.json()); 
  app.use("/api/auth", authRoutes); 
 
  const server = app.listen(0); 
  const { port } = server.address(); 
 
  try { 
    for (const provider of ["google", "discord", "github"]) { 
      const res = await fetch(`http://localhost:${port}/api/auth/oauth/${provider}`); 
      assert.equal(res.status, 200); 
      const json = await res.json(); 
      assert.equal(json.success, true); 
      assert.ok(typeof json.url === "string" && json.url.includes("provider=" + provider)); 
      assert.ok(typeof json.code_verifier === "string" && json.code_verifier.length >= 43); 
    } 
  } finally { 
    server.close(); 
  } 
}); 
 
test("authRoutes oauth endpoint rejects unsupported provider", async () => { 
  const app = express(); 
  app.use(express.json()); 
  app.use("/api/auth", authRoutes); 
  app.use((err, req, res, next) => { 
    res.status(400).json({ error: { message: err.message } }); 
  }); 
 
  const server = app.listen(0); 
  const { port } = server.address(); 
 
  try { 
    const res = await fetch(`http://localhost:${port}/api/auth/oauth/facebook`); 
    assert.equal(res.status, 400); 
    const json = await res.json(); 
    assert.match(json.error?.message, /Unsupported provider/); 
  } finally { 
    server.close(); 
  } 
}); 
 
test("authRoutes oauth-session endpoint validates code or token presence", async () => { 
  const app = express(); 
  app.use(express.json()); 
  app.use("/api/auth", authRoutes); 
  app.use((err, req, res, next) => { 
    res.status(400).json({ error: { message: err.message } }); 
  }); 
 
  const server = app.listen(0); 
  const { port } = server.address(); 
 
  try { 
    const res = await fetch(`http://localhost:${port}/api/auth/oauth-session`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({}), 
    }); 
    assert.equal(res.status, 400); 
    const json = await res.json(); 
    assert.match(json.error?.message, /token or code required/); 
  } finally { 
    server.close(); 
  } 
}); 
