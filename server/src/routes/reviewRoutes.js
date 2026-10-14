import express from "express";
import {
  queryReviews,
  getTopRatedReviews,
  getFeaturedReview,
  getReviewDetail,
} from "../services/reviews/index.js";

const router = express.Router();

/**
 * GET /api/reviews
 * Query reviews feed with filtering, sorting, and pagination
 */
router.get("/", async (req, res, next) => {
  try {
    const { category, sort, minRating, type, q, cursor, page, limit } = req.query;
    const result = await queryReviews({
      category,
      sort,
      minRating,
      type,
      q,
      cursor,
      page,
      limit,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reviews/top
 * Top rated 5 reviews for rail, follows category
 */
router.get("/top", async (req, res, next) => {
  try {
    const { category } = req.query;
    const items = await getTopRatedReviews(category || "all");
    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reviews/featured
 * #1 trending movie review + hero backdrop image
 */
router.get("/featured", async (req, res, next) => {
  try {
    const data = await getFeaturedReview();
    if (!data) {
      return res.status(404).json({ success: false, error: "No featured review found" });
    }
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reviews/:source/:titleId
 * GET /api/reviews/:source/:titleId/:reviewId
 * Full review detail
 */
const handleReviewDetail = async (req, res, next) => {
  try {
    const { source, titleId, reviewId } = req.params;
    const detail = await getReviewDetail(source, titleId, reviewId);
    res.json({ success: true, data: detail });
  } catch (err) {
    next(err);
  }
};

router.get("/:source/:titleId", handleReviewDetail);
router.get("/:source/:titleId/:reviewId", handleReviewDetail);

export default router;
