import { useState, useCallback } from "react";

const STORAGE_KEY = "orgi_review_likes";

/**
 * Hook to manage review likes in localStorage with optimistic toggle.
 */
export function useReviewLikes() {
  const [likes, setLikes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const isLiked = useCallback(
    (id) => {
      if (!id) return false;
      return Boolean(likes[id]);
    },
    [likes]
  );

  const toggleLike = useCallback((itemOrId) => {
    const id = typeof itemOrId === "object" ? itemOrId?.id : itemOrId;
    if (!id) return false;

    setLikes((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn("[ReviewLikes] LocalStorage write error:", err);
      }

      return next;
    });
  }, []);

  return {
    isLiked,
    toggleLike,
  };
}
