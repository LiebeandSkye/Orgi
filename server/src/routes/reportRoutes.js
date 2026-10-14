import express from "express"; 
import { reportController } from "../controllers/reportController.js"; 
import { requireAuth } from "../middlewares/authMiddleware.js"; 

const router = express.Router(); 

router.post("/", requireAuth, reportController.createReport); 
router.get("/my", requireAuth, reportController.getMyReports); 
router.get("/all", requireAuth, reportController.getAllReports); 
router.patch("/:id", requireAuth, reportController.updateReportStatus); 

export default router; 
