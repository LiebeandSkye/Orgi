import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "orgi_review_bookmarks";

/**
 * Hook to manage review bookmarks in localStorage with optimistic toggle and toast notifications.
 */
export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const isBookmarked = useCallback(
    (id) => {
      return Boolean(bookmarks[id]);
    },
    [bookmarks]
  );

  const toggleBookmark = useCallback((item) => {
    if (!item || !item.id) return false;

    setBookmarks((prev) => {
      const next = { ...prev };
      const currentlySaved = Boolean(next[item.id]);

      if (currentlySaved) {
        delete next[item.id];
        setToastMessage("Removed from bookmarks");
      } else {
        next[item.id] = {
          id: item.id,
          title: item.title,
          posterUrl: item.posterUrl,
          savedAt: new Date().toISOString(),
        };
        setToastMessage("Saved to bookmarks");
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn("[Bookmarks] LocalStorage write error:", err);
      }

      return next;
    });
  }, []);

  return {
    isBookmarked,
    toggleBookmark,
    toastMessage,
  };
}
