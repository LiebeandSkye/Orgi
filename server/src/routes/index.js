import express from "express";
import healthRoutes from "./healthRoutes.js";
import tmdbRoutes from "./tmdbRoutes.js";

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/tmdb", tmdbRoutes);

export default router;
