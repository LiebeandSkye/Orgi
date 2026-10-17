import { useState, useEffect, useCallback, useRef } from "react"; 
import { API_BASE_URL, safeFetchJson } from "../services/api"; 
 
const feedCache = new Map(); 
 
export function useReviewsFeed({ category, sort, rating, type, q, page = 1, limit = 50 }) { 
  const cacheKey = `${category || "all"}:${sort || "recent"}:${rating || "all"}:${type || "all"}:${(q || "").trim()}:${page}:${limit}`; 
  const cached = feedCache.get(cacheKey); 
 
  const [items, setItems] = useState(() => cached?.items || []); 
  const [capabilities, setCapabilities] = useState(() => cached?.capabilities || { 
    hasRating: true, 
    hasReviewText: true, 
    hasLikes: false, 
    hasSocial: false, 
  }); 
  const [total, setTotal] = useState(() => cached?.total || 0); 
  const [totalPages, setTotalPages] = useState(() => cached?.totalPages || 1); 
  const [isLoading, setIsLoading] = useState(() => !cached); 
  const [error, setError] = useState(null); 
  const abortRef = useRef(null); 
 
  const fetchReviews = useCallback(async (signal) => { 
    const currentCached = feedCache.get(cacheKey); 
    if (currentCached) { 
      setItems(currentCached.items); 
      setCapabilities(currentCached.capabilities); 
      setTotal(currentCached.total); 
      setTotalPages(currentCached.totalPages); 
      setIsLoading(false); 
      return; 
    } 
 
    setIsLoading(true); 
    setError(null); 
 
    const params = new URLSearchParams(); 
    if (category && category !== "all") params.set("category", category); 
    if (sort && sort !== "recent") params.set("sort", sort); 
    if (rating && rating !== "all") params.set("minRating", rating); 
    if (type && type !== "all") params.set("type", type); 
    if (q && q.trim()) params.set("q", q.trim()); 
    params.set("page", String(page || 1)); 
    params.set("limit", String(limit || 50)); 
 
    try { 
      const data = await safeFetchJson(`${API_BASE_URL}/reviews?${params.toString()}`, { 
        signal, 
      }); 
      if (!data.success) { 
        throw new Error(data.error || "Failed to load reviews"); 
      } 
 
      const nextItems = data.items || []; 
      const nextCaps = data.capabilities || capabilities; 
      const nextTotal = data.total || 0; 
      const nextPages = data.totalPages || 1; 
 
      feedCache.set(cacheKey, { 
        items: nextItems, 
        capabilities: nextCaps, 
        total: nextTotal, 
        totalPages: nextPages, 
      }); 
 
      setItems(nextItems); 
      setCapabilities(nextCaps); 
      setTotal(nextTotal); 
      setTotalPages(nextPages); 
    } catch (err) { 
      if (err.name === "AbortError") return; 
      setError(err.message || "Failed to load reviews"); 
    } finally { 
      setIsLoading(false); 
    } 
  }, [cacheKey, category, sort, rating, type, q, page, limit, capabilities]); 
 
  useEffect(() => { 
    if (abortRef.current) { 
      abortRef.current.abort(); 
    } 
    const controller = new AbortController(); 
    abortRef.current = controller; 
 
    fetchReviews(controller.signal); 
 
    return () => { 
      controller.abort(); 
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
    retry: () => fetchReviews(abortRef.current?.signal), 
  }; 
}
