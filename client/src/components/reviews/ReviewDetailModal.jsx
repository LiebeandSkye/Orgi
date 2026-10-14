import React, { useEffect, useState } from "react";
import { X, Star, ExternalLink, Calendar, Film } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "./Avatar";

export function ReviewDetailModal({ item, isOpen, onClose }) {
  const [detailData, setDetailData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) {
      setDetailData(null);
      return;
    }

    let mounted = true;
    setIsLoading(true);

    const source = item.source || "tmdb";
    const titleId = item.titleId;
    const reviewId = item.id?.split(":")?.[2];

    const url = `/api/reviews/${source}/${titleId}${reviewId ? `/${reviewId}` : ""}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (mounted && json?.success && json?.data) {
          setDetailData(json.data);
        } else if (mounted) {
          // Fallback to item
          setDetailData({
            ...item,
            content: item.rawContent || item.excerpt,
          });
        }
      })
      .catch(() => {
        if (mounted) {
          setDetailData({
            ...item,
            content: item.rawContent || item.excerpt,
          });
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, item]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const data = detailData || item;
  const isSynopsis = data.excerptKind === "synopsis";

  // Determine media link
  let mediaRoute = data.mediaRoute;
  if (!mediaRoute) {
    if (data.source === "tmdb") {
      mediaRoute = data.category === "series" ? `/series/${data.titleId}` : `/movie/${data.titleId}`;
    } else if (data.source === "mangadex") {
      mediaRoute = `/books/${data.category || "manga"}/${data.titleId}`;
    } else {
      mediaRoute = `/books/novels/${data.titleId}`;
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-backdrop-fade"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[720px] max-h-[90vh] bg-[#0b100e] border border-white/[0.1] rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Backdrop Banner if available */}
        {data.backdropUrl && (
          <div className="relative w-full h-44 sm:h-52 overflow-hidden shrink-0">
            <img
              src={data.backdropUrl}
              alt=""
              className="w-full h-full object-cover object-center opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b100e] via-[#0b100e]/60 to-transparent" />
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close review"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/10 text-[#8b9692] hover:text-[#e8ecea] flex items-center justify-center cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          {/* Title & Reviewer Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#8b9692] uppercase tracking-wider">
              <span>{data.mediaLabel}</span>
              {data.year && (
                <>
                  <span>·</span>
                  <span>{data.year}</span>
                </>
              )}
            </div>

            <h2 id="review-detail-title" className="text-2xl sm:text-3xl font-medium text-[#e8ecea] leading-tight">
              {data.title}
            </h2>

            {data.tagline && (
              <p className="text-[14px] text-[#8b9692] italic">
                "{data.tagline}"
              </p>
            )}

            {/* Author & Score Row */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.07] mt-1">
              <div className="flex items-center gap-2.5">
                {!isSynopsis && (
                  <Avatar src={data.author?.avatarUrl} name={data.author?.name} size="w-7 h-7" />
                )}
                <div>
                  <div className="text-[14px] font-medium text-[#e8ecea]">
                    {isSynopsis
                      ? `${data.source === "mangadex" ? "MangaDex" : "Open Library"} Community Overview`
                      : data.author?.name || "Anonymous Reviewer"}
                  </div>
                  {data.createdAt && (
                    <div className="text-[11px] text-[#8b9692] flex items-center gap-1">
                      <Calendar size={11} />
                      <span>{new Date(data.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                    </div>
                  )}
                </div>
              </div>

              {data.rating !== undefined && data.rating !== null && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#19d68a]/10 border border-[#19d68a]/30 text-[#19d68a]">
                  <Star size={14} className="fill-[#19d68a] text-[#19d68a]" />
                  <span className="text-[14px] font-semibold font-tabular">
                    {typeof data.rating === "number" ? data.rating.toFixed(1) : data.rating}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Full Review Text / Synopsis */}
          <div className="pt-2 border-t border-white/[0.07]">
            {isLoading ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="w-full h-4 rounded bg-white/[0.05]" />
                <div className="w-11/12 h-4 rounded bg-white/[0.05]" />
                <div className="w-4/5 h-4 rounded bg-white/[0.05]" />
              </div>
            ) : (
              <div className="text-[14.5px] leading-[1.7] text-[#e8ecea] whitespace-pre-line space-y-4 font-normal">
                {data.content || data.rawContent || data.excerpt}
              </div>
            )}
          </div>

          {/* Action Links */}
          <div className="pt-4 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
            <Link
              to={mediaRoute}
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#19d68a] hover:bg-[#19d68a]/90 text-[#060908] font-semibold text-[13px] transition-colors cursor-pointer"
            >
              <Film size={14} />
              <span>Go to {data.mediaLabel} page</span>
            </Link>

            {data.externalUrl && (
              <a
                href={data.externalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-[13px] text-[#8b9692] hover:text-[#e8ecea] transition-colors"
              >
                <span>View original source</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
