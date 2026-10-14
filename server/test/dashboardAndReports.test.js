import test from "node:test"; 
import assert from "node:assert/strict"; 
import fs from "node:fs"; 
import path from "node:path"; 
import dashboardRoutes from "../src/routes/dashboardRoutes.js"; 
import reportRoutes from "../src/routes/reportRoutes.js"; 
import reviewRoutes from "../src/routes/reviewRoutes.js"; 

test("schema.sql contains review_likes and is_edited column", () => { 
  const schemaPath = path.resolve("schema.sql"); 
  const sql = fs.readFileSync(schemaPath, "utf-8"); 

  assert.match(sql, /CREATE TABLE IF NOT EXISTS review_likes/); 
  assert.match(sql, /is_edited/); 
  assert.match(sql, /CREATE TABLE IF NOT EXISTS reports/); 
}); 

test("routes are properly defined and exported", () => { 
  assert.ok(dashboardRoutes); 
  assert.ok(reportRoutes); 
  assert.ok(reviewRoutes); 
}); 
