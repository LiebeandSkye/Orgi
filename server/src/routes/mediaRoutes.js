import express from "express";
import { mediaController } from "../controllers/mediaController.js";

const router = express.Router();

router.get("/ping", mediaController.ping);
router.get("/manga", mediaController.getManga);
router.get("/books", mediaController.getBooks);
router.get("/books/subject/:subject", mediaController.getBooksBySubject);
router.get("/dashboard-feeds", mediaController.getDashboardFeeds);
router.get("/hub/:category", mediaController.getCategoryHub);
router.get("/detail/:category/:id", mediaController.getDetail); 
router.post("/verdict", mediaController.getVerdict); 
router.get("/verdict", mediaController.getVerdict); 

export default router;
