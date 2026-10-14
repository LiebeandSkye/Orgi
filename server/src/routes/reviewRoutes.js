import express from "express"; 
import { reviewController } from "../controllers/reviewController.js"; 
import { requireAuth } from "../middlewares/authMiddleware.js"; 
import { 
  queryReviews, 
  getTopRatedReviews, 
  getFeaturedReview, 
  getReviewDetail, 
} from "../services/reviews/index.js"; 

const router = express.Router(); 

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

router.get("/top", async (req, res, next) => { 
  try { 
    const { category } = req.query; 
    const items = await getTopRatedReviews(category || "all"); 
    res.json({ success: true, items }); 
  } catch (err) { 
    next(err); 
  } 
}); 

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

router.post("/", requireAuth, reviewController.createReview); 
router.delete("/:id", requireAuth, reviewController.deleteReview); 

router.get("/:provider/:externalId", async (req, res, next) => { 
  try { 
    return reviewController.getReviews(req, res, next); 
  } catch (err) { 
    return reviewController.getReviews(req, res, next); 
  } 
}); 

router.get("/:source/:titleId/:reviewId", async (req, res, next) => { 
  try { 
    const { source, titleId, reviewId } = req.params; 
    const detail = await getReviewDetail(source, titleId, reviewId); 
    res.json({ success: true, data: detail }); 
  } catch (err) { 
    next(err); 
  } 
}); 

export default router; 
