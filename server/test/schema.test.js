import test from "node:test"; 
import assert from "node:assert/strict"; 
import fs from "node:fs"; 
import path from "node:path"; 
 
test("schema.sql defines unified reviews table and 3-status user_collections", () => { 
  const schemaPath = path.resolve("schema.sql"); 
  const sql = fs.readFileSync(schemaPath, "utf-8"); 
   
  assert.match(sql, /CREATE TABLE IF NOT EXISTS reviews/); 
  assert.match(sql, /score INTEGER CHECK \(score >= 1 AND score <= 10\)/); 
  assert.match(sql, /uq_user_item_top_review/); 
  assert.match(sql, /CHECK \(status IN \('plan', 'progress', 'completed'\)\)/); 
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS ratings/); 
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS comments/); 
}); 
