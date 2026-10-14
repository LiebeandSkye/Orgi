import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import "dotenv/config";
import reviewRoutes from "../src/routes/reviewRoutes.js";
import { createExcerpt } from "../src/services/reviews/excerpt.js";
import { scoreReview, selectBestReview } from "../src/services/reviews/bestReview.js";

test("createExcerpt strips markdown and respects word boundaries", () => {
  const text = "# Heading\nThis is **bold** text with a [link](https://example.com) and some `code`. " +
    "A wonderful experience that kept me glued to the screen for hours on end without stopping.";
  const excerpt = createExcerpt(text, 50);

  assert.ok(!excerpt.includes("#"));
  assert.ok(!excerpt.includes("**"));
  assert.ok(!excerpt.includes("[link]"));
  assert.ok(!excerpt.includes("`"));
  assert.ok(excerpt.endsWith("…"));
  assert.ok(excerpt.length <= 55);
});

test("scoreReview and selectBestReview identify best candidate", () => {
  const lowQuality = {
    content: "BAD MOVIE WATCH HERE http://spam.com http://spam2.com http://spam3.com",
    author_details: { rating: 2 },
  };

  const goodReview = {
    content: "This movie was absolutely phenomenal. The acting by the ensemble cast was top tier, and the direction showed profound mastery of tension and emotional weight.",
    author_details: { rating: 9 },
  };

  const scoreLow = scoreReview(lowQuality);
  const scoreGood = scoreReview(goodReview);

  assert.ok(scoreGood > scoreLow);

  const best = selectBestReview([lowQuality, goodReview]);
  assert.equal(best, goodReview);
});

test("reviewRoutes /api/reviews endpoints respond with expected structure", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/reviews", reviewRoutes);

  const server = app.listen(0);
  const { port } = server.address();

  try {
    // 1. Featured
    const featuredRes = await fetch(`http://localhost:${port}/api/reviews/featured`);
    assert.equal(featuredRes.status, 200);
    const featuredJson = await featuredRes.json();
    assert.equal(featuredJson.success, true);
    assert.ok(featuredJson.item?.title);
    assert.ok(featuredJson.heroBackdropUrl || featuredJson.item?.backdropUrl);

    // 2. Feed query with pagination (50 max reviews, 25 per page -> 2 pages)
    const page1Res = await fetch(`http://localhost:${port}/api/reviews?page=1&limit=25`);
    assert.equal(page1Res.status, 200);
    const page1Json = await page1Res.json();
    assert.equal(page1Json.success, true);
    assert.ok(Array.isArray(page1Json.items));
    assert.equal(page1Json.page, 1);
    assert.ok(page1Json.total <= 50);
    assert.ok(page1Json.totalPages >= 1);

    if (page1Json.totalPages > 1) {
      const page2Res = await fetch(`http://localhost:${port}/api/reviews?page=2&limit=25`);
      assert.equal(page2Res.status, 200);
      const page2Json = await page2Res.json();
      assert.equal(page2Json.success, true);
      assert.equal(page2Json.page, 2);
      assert.ok(page2Json.items.length > 0);
      assert.notEqual(page1Json.items[0]?.id, page2Json.items[0]?.id);
    }

    // 3. Top rated
    const topRes = await fetch(`http://localhost:${port}/api/reviews/top`);
    assert.equal(topRes.status, 200);
    const topJson = await topRes.json();
    assert.equal(topJson.success, true);
    assert.ok(Array.isArray(topJson.items));
    assert.ok(topJson.items.length <= 5);
  } finally {
    server.close();
  }
});
