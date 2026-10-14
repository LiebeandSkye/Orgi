import express from "express"; 
import { reviewController } from "../controllers/reviewController.js"; 
import { requireAuth } from "../middlewares/authMiddleware.js"; 
 
const router = express.Router(); 
 
router.get("/:provider/:externalId", reviewController.getReviews); 
router.post("/", requireAuth, reviewController.createReview); 
router.delete("/:id", requireAuth, reviewController.deleteReview); 
 
export default router; 
