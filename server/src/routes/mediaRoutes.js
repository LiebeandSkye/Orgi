import express from "express";
import { mediaController } from "../controllers/mediaController.js";

const router = express.Router();

router.get("/ping", mediaController.ping);
router.get("/manga", mediaController.getManga);
router.get("/books", mediaController.getBooks);
router.get("/detail/:category/:id", mediaController.getDetail);

export default router;
