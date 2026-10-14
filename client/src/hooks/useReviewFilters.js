import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export const CATEGORIES = [
  { id: "all", label: "All Reviews", icon: "all" },
  { id: "movie", label: "Movies", icon: "movie" },
  { id: "series", label: "Series", icon: "series" },
  { id: "anime", label: "Anime", icon: "anime" },
  { id: "manga", label: "Manga", icon: "manga" },
  { id: "manhwa", label: "Manhwa", icon: "manhwa" },
  { id: "book", label: "Books", icon: "book" },
  { id: "novel", label: "Novels", icon: "novel" },
  { id: "light-novel", label: "Light Novels", icon: "light-novel" },
];

/**
 * Hook to manage review feed filters synchronized with URL search params.
 */
export function useReviewFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get("category") || "all";
  const sort = searchParams.get("sort") || "recent";
  const rating = searchParams.get("rating") || "all";
  const type = searchParams.get("type") || "all";
  const q = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sort && sort !== "recent") count++;
    if (rating && rating !== "all") count++;
    if (type && type !== "all") count++;
    return count;
  }, [sort, rating, type]);

  const setCategory = useCallback(
    (newCat) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (newCat === "all") {
          next.delete("category");
        } else {
          next.set("category", newCat);
        }
        // Changing category resets page, cursor and unsupported filters
        next.delete("page");
        next.delete("cursor");
        if (["manga", "manhwa", "book", "novel", "light-novel"].includes(newCat)) {
          if (next.get("type") === "friends" || next.get("type") === "following") {
            next.delete("type");
          }
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const setSort = useCallback(
    (newSort) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!newSort || newSort === "recent") {
          next.delete("sort");
        } else {
          next.set("sort", newSort);
        }
        next.delete("page");
        next.delete("cursor");
        return next;
      });
    },
    [setSearchParams]
  );

  const setRating = useCallback(
    (newRating) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!newRating || newRating === "all") {
          next.delete("rating");
        } else {
          next.set("rating", newRating);
        }
        next.delete("page");
        next.delete("cursor");
        return next;
      });
    },
    [setSearchParams]
  );

  const setType = useCallback(
    (newType) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!newType || newType === "all") {
          next.delete("type");
        } else {
          next.set("type", newType);
        }
        next.delete("page");
        next.delete("cursor");
        return next;
      });
    },
    [setSearchParams]
  );

  const setSearch = useCallback(
    (newQ) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const trimmed = (newQ || "").trim();
        if (!trimmed) {
          next.delete("q");
        } else {
          next.set("q", trimmed);
        }
        next.delete("page");
        next.delete("cursor");
        return next;
      });
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (newPage) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!newPage || newPage <= 1) {
          next.delete("page");
        } else {
          next.set("page", String(newPage));
        }
        next.delete("cursor");
        return next;
      });
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      const currentCat = prev.get("category");
      if (currentCat) next.set("category", currentCat);
      return next;
    });
  }, [setSearchParams]);

  return {
    category,
    sort,
    rating,
    type,
    q,
    page,
    activeFilterCount,
    setCategory,
    setSort,
    setRating,
    setType,
    setSearch,
    setPage,
    resetFilters,
  };
}
