import React, { useState, useRef, useEffect } from "react";
import { Star, Bookmark, MoreHorizontal, Heart, MessageSquare, Copy, AlertCircle, Check } from "lucide-react";
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
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function ReviewCard({
  item,
  isBookmarked = false,
  onToggleBookmark,
  onOpenDetail,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [menuOpen]);

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}${item.detailHref}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setMenuOpen(false);
      }, 1500);
    });
  };

  const handleReport = (e) => {
    e.stopPropagation();
    setReported(true);
    setTimeout(() => {
      setReported(false);
      setMenuOpen(false);
    }, 1500);
  };

  const isSynopsis = item.excerptKind === "synopsis";
  const relativeTime = formatRelativeTime(item.createdAt);

  return (
    <article className="group relative w-full bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#333333] hover:bg-[#141414] rounded-xl p-3.5 transition-colors duration-150 flex gap-3.5 sm:gap-4 select-none">
      {/* Poster */}
      <div className="relative w-[84px] h-[120px] sm:w-[112px] sm:h-[160px] rounded-lg overflow-hidden bg-black/40 border border-[#1C1C1C] shrink-0">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-[#7A7A7A] p-2 text-center bg-[#000000]">
            {item.title}
          </div>
        )}
      </div>

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Row 1: Reviewer / Source Info */}
          <div className="flex items-center gap-2 min-w-0 h-6 mb-1.5">
            {isSynopsis ? (
              <span className="text-[12px] font-medium text-[#B5B5B5]">
                {item.source === "mangadex" ? "MangaDex" : "Open Library"} · Community rating
              </span>
            ) : (
              <>
                <Avatar src={item.author?.avatarUrl} name={item.author?.name} size="w-6 h-6" />
                <span className="text-[13px] sm:text-[14px] font-medium text-[#F5F5F5] truncate max-w-[140px] sm:max-w-[200px]">
                  {item.author?.name || "Anonymous"}
                </span>
                {relativeTime && (
                  <span
                    className="text-[12px] text-[#7A7A7A] shrink-0"
                    title={new Date(item.createdAt).toLocaleString()}
                  >
                    · {relativeTime}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Title with Stretched Link covering the card */}
          <h3 className="text-[16px] sm:text-[18px] font-medium text-[#F5F5F5] leading-snug mb-1">
            <button
              type="button"
              onClick={() => onOpenDetail(item)}
              className="text-left cursor-pointer hover:text-white transition-colors after:absolute after:inset-0 after:content-['']"
            >
              {item.title}
            </button>
          </h3>

          {/* Meta Row */}
          <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-[#B5B5B5] mb-2 font-tabular">
            {item.rating !== undefined && item.rating !== null && (
              <>
                <div className="flex items-center gap-1 text-[#61F1AC] font-medium">
                  <Star size={12} className="fill-[#61F1AC] text-[#61F1AC]" />
                  <span>{typeof item.rating === "number" ? item.rating.toFixed(1) : item.rating}</span>
                </div>
                <span className="text-[#7A7A7A]">|</span>
              </>
            )}
            <span>{item.mediaLabel}</span>
            {item.year && (
              <>
                <span>·</span>
                <span>{item.year}</span>
              </>
            )}
            {item.containsSpoilers && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20">
                Spoilers
              </span>
            )}
          </div>

          {/* Excerpt */}
          <p className="text-[13px] sm:text-[13.5px] leading-[1.55] text-[#B5B5B5] line-clamp-3 mb-2.5 break-words">
            {item.excerpt}
          </p>

          {/* Genre Chips (pills) */}
          {item.genres && item.genres.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {item.genres.slice(0, 3).map((g, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-[11px] text-[#B5B5B5] border border-[#1C1C1C] lowercase bg-transparent"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Row: Likes / Comments */}
        <div className="flex items-center gap-4 pt-1 text-[13px] text-[#7A7A7A]">
          {item.likes !== undefined && item.likes !== null && (
            <div className="flex items-center gap-1.5">
              <Heart size={14} />
              <span className="font-tabular">{item.likes}</span>
            </div>
          )}
          {item.comments !== undefined && item.comments !== null && (
            <div className="flex items-center gap-1.5">
              <MessageSquare size={14} />
              <span className="font-tabular">{item.comments}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: overflow menu (top), backdrop (lg+), bookmark (bottom) */}
      <div className="flex flex-col items-end shrink-0">
        {/* Overflow Menu (relative z-10 so it sits above stretched-link) */}
        <div className="relative z-10 h-6 flex items-center" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="p-1 rounded-md text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#141414] cursor-pointer transition-colors"
          >
            <MoreHorizontal size={17} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-36 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg p-1 shadow-2xl z-20"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-[#F5F5F5] hover:bg-[#141414] rounded cursor-pointer text-left"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-[#61F1AC]" />
                    <span className="text-[#61F1AC]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy link</span>
                  </>
                )}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleReport}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-rose-400 hover:bg-[#141414] rounded cursor-pointer text-left"
              >
                {reported ? (
                  <>
                    <Check size={13} className="text-rose-400" />
                    <span>Reported</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={13} />
                    <span>Report</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Backdrop Thumbnail (Desktop lg+ only) */}
        {item.backdropUrl && (
          <div className="hidden lg:block mt-1.5 w-[148px] h-[80px] rounded-lg overflow-hidden bg-black/40 border border-[#1C1C1C]">
            <img
              src={item.backdropUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Bookmark Button (relative z-10, pinned to bottom-right) */}
        <button
          type="button"
          aria-pressed={isBookmarked}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark review"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(item);
          }}
          className={`relative z-10 mt-auto p-1.5 -mr-1 -mb-1 rounded-md cursor-pointer transition-colors ${
            isBookmarked
              ? "text-[#61F1AC] hover:text-[#61F1AC]/80"
              : "text-[#7A7A7A] hover:text-[#F5F5F5]"
          }`}
        >
          <Bookmark
            size={17}
            className={isBookmarked ? "fill-[#61F1AC]" : ""}
          />
        </button>
      </div>
    </article>
  );
}