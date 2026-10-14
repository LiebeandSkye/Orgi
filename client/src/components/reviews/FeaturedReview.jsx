import React, { useState, useEffect } from "react";
import { Star, ArrowRight } from "lucide-react";
import { Avatar } from "./Avatar";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (Number.isNaN(diffSec) || diffSec < 0) return "";
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export function FeaturedReview({ onOpenDetail }) {
  const [featured, setFeatured] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetch("/api/reviews/featured")
      .then((res) => {
        if (!res.ok) throw new Error("Featured review unavailable");
        return res.json();
      })
      .then((data) => {
        if (mounted && data.success && data.item) {
          setFeatured(data.item);
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
  }, []);

  if (error || (!isLoading && !featured)) {
    return null; // Collapse if failed/empty
  }

  if (isLoading) {
    return (
      <div className="flex flex-col mt-6">
        <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#5d6763] mb-2 px-1">
          FEATURED REVIEW
        </span>
        <div className="w-full bg-[#0b100e] border border-white/[0.07] rounded-xl p-3.5 space-y-3 animate-pulse">
          <div className="w-full aspect-[16/9] rounded-lg bg-white/[0.05]" />
          <div className="w-3/4 h-4 rounded bg-white/[0.06]" />
          <div className="w-1/2 h-3 rounded bg-white/[0.04]" />
          <div className="space-y-1.5 pt-1">
            <div className="w-full h-3 rounded bg-white/[0.04]" />
            <div className="w-5/6 h-3 rounded bg-white/[0.04]" />
          </div>
          <div className="w-28 h-8 rounded-full bg-white/[0.05]" />
        </div>
      </div>
    );
  }

  const relativeTime = formatRelativeTime(featured.createdAt);

  return (
    <div className="flex flex-col mt-6">
      <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#5d6763] mb-2 px-1">
        FEATURED REVIEW
      </span>

      <div className="w-full bg-[#0b100e] border border-white/[0.07] rounded-xl p-3.5 flex flex-col gap-3">
        {/* 16:9 Backdrop Image */}
        {featured.backdropUrl ? (
          <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-black/40 border border-white/[0.06] shrink-0">
            <img
              src={featured.backdropUrl}
              alt={featured.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
        ) : featured.posterUrl ? (
          <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-black/40 border border-white/[0.06] shrink-0">
            <img
              src={featured.posterUrl}
              alt={featured.title}
              className="w-full h-full object-cover object-top"
            />
          </div>
        ) : null}

        {/* Title & Tagline/Subline */}
        <div>
          <h4 className="text-[16px] font-medium text-[#e8ecea] leading-tight mb-0.5">
            {featured.title}
          </h4>
          <p className="text-[13px] text-[#8b9692] line-clamp-1">
            {featured.tagline ? `A review of '${featured.title}'` : (featured.genres || []).join(" · ")}
          </p>
        </div>

        {/* Reviewer Row with Score on Far Right */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.05]">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar src={featured.author?.avatarUrl} name={featured.author?.name} size="w-5 h-5" />
            <span className="text-[12px] font-medium text-[#e8ecea] truncate max-w-[120px]">
              {featured.author?.name || "Reviewer"}
            </span>
            {relativeTime && (
              <span className="text-[11px] text-[#8b9692] shrink-0">· {relativeTime}</span>
            )}
          </div>

          {featured.rating !== undefined && featured.rating !== null && (
            <div className="flex items-center gap-1 text-[12px] font-medium text-[#19d68a] shrink-0">
              <Star size={12} className="fill-[#19d68a] text-[#19d68a]" />
              <span className="font-tabular">
                {typeof featured.rating === "number" ? featured.rating.toFixed(1) : featured.rating}
              </span>
            </div>
          )}
        </div>

        {/* Excerpt clamp 4 lines */}
        <p className="text-[13px] text-[#8b9692] leading-relaxed line-clamp-4">
          {featured.excerpt}
        </p>

        {/* Action Button: Read full review */}
        <button
          type="button"
          onClick={() => onOpenDetail(featured)}
          className="inline-flex items-center justify-center gap-1.5 self-start px-4 py-2 rounded-full border border-[#19d68a] text-[#19d68a] text-[13px] font-medium hover:bg-[#19d68a]/[0.12] transition-colors cursor-pointer mt-1"
        >
          <span>Read full review</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
