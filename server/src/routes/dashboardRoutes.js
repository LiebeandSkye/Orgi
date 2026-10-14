import express from "express"; 
import { dashboardController } from "../controllers/dashboardController.js"; 
import { requireAuth } from "../middlewares/authMiddleware.js"; 

const router = express.Router(); 

router.get("/summary", requireAuth, dashboardController.getSummary); 

export default router; 
