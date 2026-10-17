import express from "express";
import { discussionController } from "../controllers/discussionController.js";
import { requireAuth, optionalAuth } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/tv/:seriesId/season/:seasonNumber/counts",
  discussionController.getSeasonDiscussionCounts
);

router.get(
  "/tv/:seriesId/season/:seasonNumber/episode/:episodeNumber",
  optionalAuth,
  discussionController.getEpisodeDiscussion
);

router.post(
  "/tv/:seriesId/season/:seasonNumber/episode/:episodeNumber/comments",
  requireAuth,
  discussionController.postComment
);

router.post("/comments/:id/like", requireAuth, discussionController.toggleLike);

router.delete("/comments/:id", requireAuth, discussionController.deleteComment);

export default router;
