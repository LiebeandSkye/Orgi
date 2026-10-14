import { useState, useEffect, useCallback } from "react";

/**
 * Hook for fetching reviews feed with page-based pagination.
 */
export function useReviewsFeed({ category, sort, rating, type, q, page = 1, limit = 25 }) {
  const [items, setItems] = useState([]);
  const [capabilities, setCapabilities] = useState({
    hasRating: true,
    hasReviewText: true,
    hasLikes: false,
    hasSocial: false,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (sort && sort !== "recent") params.set("sort", sort);
    if (rating && rating !== "all") params.set("minRating", rating);
    if (type && type !== "all") params.set("type", type);
    if (q && q.trim()) params.set("q", q.trim());
    params.set("page", String(page || 1));
    params.set("limit", String(limit || 25));

    try {
      const res = await fetch(`/api/reviews?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load reviews (${res.status})`);
      }
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load reviews");
      }

      setItems(data.items || []);
      if (data.capabilities) {
        setCapabilities(data.capabilities);
      }
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("[useReviewsFeed] Fetch error:", err);
      setError(err.message || "Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  }, [category, sort, rating, type, q, page, limit]);

  useEffect(() => {
    let cancelled = false;
    fetchReviews();
    return () => {
      cancelled = true;
    };
  }, [fetchReviews]);

  return {
    items,
    capabilities,
    total,
    totalPages,
    currentPage: page,
    pageSize: limit,
    isLoading,
    error,
    retry: fetchReviews,
  };
}
