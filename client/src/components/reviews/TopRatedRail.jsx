import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { API_BASE_URL, safeFetchJson } from "../../services/api";
import { getReviewAuthor } from "../../utils/reviewUtils";

const topRailCache = new Map(); 
 
export function TopRatedRail({ category, onOpenDetail }) { 
  const catKey = category || "all"; 
  const cached = topRailCache.get(catKey); 
  const [items, setItems] = useState(() => cached || []); 
  const [isLoading, setIsLoading] = useState(() => !cached); 
  const [error, setError] = useState(null); 
 
  useEffect(() => { 
    if (topRailCache.has(catKey)) { 
      setItems(topRailCache.get(catKey)); 
      setIsLoading(false); 
      return; 
    } 
 
    let mounted = true; 
    setIsLoading(true); 
    setError(null); 
 
    const catParam = category && category !== "all" ? `?category=${category}` : ""; 
    safeFetchJson(`${API_BASE_URL}/reviews/top${catParam}`) 
      .then((data) => { 
        if (mounted && data.success) { 
          const loaded = data.items || []; 
          topRailCache.set(catKey, loaded); 
          setItems(loaded); 
        } 
      }) 
      .catch((err) => { 
        if (mounted) setError(err.message); 
      }) 
      .finally(() => { 
        if (mounted) setIsLoading(false); 
      }); 
 
    return () => { 
      mounted = false; 
    }; 
  }, [category, catKey]);

  if (error || (!isLoading && items.length === 0)) {
    return null; // Collapse gracefully if error or empty per spec
  }

  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#7A7A7A] mb-2 px-1">
        TOP RATED REVIEWS
      </span>

      <div className="w-full bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-2 flex flex-col gap-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-1.5 rounded-lg animate-pulse">
              <div className="w-[40px] h-[56px] rounded-md bg-white/[0.05] shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="w-4/5 h-3.5 rounded bg-white/[0.06]" />
                <div className="w-2/5 h-3 rounded bg-white/[0.04]" />
                <div className="w-1/4 h-3 rounded bg-white/[0.04]" />
              </div>
            </div>
          ))
        ) : (
          items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onOpenDetail(it)}
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#141414] text-left transition-colors cursor-pointer group"
            >
              <div className="w-[40px] h-[56px] rounded-md overflow-hidden bg-black/40 border border-[#1C1C1C] shrink-0">
                {it.posterUrl ? (
                  <img
                    src={it.posterUrl}
                    alt={it.title}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      if (e.currentTarget.nextElementSibling) {
                        e.currentTarget.nextElementSibling.style.display = "flex";
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : null}
                <div
                  className="w-full h-full items-center justify-center text-[9px] text-[#7A7A7A] text-center p-0.5"
                  style={{ display: it.posterUrl ? "none" : "flex" }}
                >
                  {it.title}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-medium text-[#F5F5F5] truncate group-hover:text-white transition-colors">
                  {it.title}
                </h4>
                <p className="text-[12px] text-[#B5B5B5] truncate mb-1">
                  {getReviewAuthor(it, "Community score").name}
                </p>
                {it.rating !== undefined && it.rating !== null && (
                  <div className="flex items-center gap-1 text-[12px] font-medium text-[#61F1AC]">
                    <Star size={11} className="fill-[#61F1AC] text-[#61F1AC]" />
                    <span className="font-tabular">
                      {typeof it.rating === "number" ? it.rating.toFixed(1) : it.rating}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
