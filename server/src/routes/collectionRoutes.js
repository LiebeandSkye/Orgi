import express from "express"; 
import { collectionController } from "../controllers/collectionController.js"; 
import { requireAuth, optionalAuth } from "../middlewares/authMiddleware.js"; 
 
const router = express.Router(); 
 
router.get("/", requireAuth, collectionController.getCollection); 
router.get("/check/:provider/:externalId", optionalAuth, collectionController.checkStatus); 
router.post("/toggle", requireAuth, collectionController.toggleItem); 
router.patch("/:itemId/status", requireAuth, collectionController.updateStatus); 
 
export default router; 

