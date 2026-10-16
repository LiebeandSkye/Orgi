import React, { useState, useRef, useEffect } from "react";
import { Star, MoreHorizontal, MessageSquare, Copy, AlertCircle, Check } from "lucide-react";
import { Avatar } from "./Avatar";
import { LikeButton } from "./LikeButton";
import { FormattedText } from "../common/FormattedText";
import { getReviewAuthor } from "../../utils/reviewUtils";

function formatRelativeTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (Number.isNaN(diffSec) || diffSec < 0) return "";
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths}mo`;
    return `${Math.floor(diffDays / 365)}y`;
}

export function ReviewCard({
    item,
    isBookmarked = false,
    onToggleBookmark,
    isLiked = false,
    onToggleLike,
    onOpenDetail,
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [reported, setReported] = useState(false);
    const [posterError, setPosterError] = useState(false);
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
        const url = `${window.location.origin}${item.detailHref || ""}`;
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

    if (!item) return null;

    const isSynopsis = item.excerptKind === "synopsis";
    const sourceLabel = item.source === "mangadex" ? "MangaDex" : "Open Library";
    const relativeTime = formatRelativeTime(item.createdAt);
    const initialLiked = Boolean(item.isLiked); 
    const delta = (isLiked ? 1 : 0) - (initialLiked ? 1 : 0); 
    const likesCount = Math.max(0, (item.likes ?? 0) + delta); 
    const hasRating = item.rating !== undefined && item.rating !== null;
    const reviewAuthor = getReviewAuthor(item, "Anonymous");

    const metaLine = [item.mediaLabel, ...(item.genres || []).slice(0, 3)]
        .filter(Boolean)
        .join(" · ");

    return (
        <article className="group relative flex gap-3 px-4 py-3 border-b border-[#1C1C1C] hover:bg-white/[0.02] transition-colors cursor-pointer select-none">
            {/* Avatar column */}
            <div className="shrink-0">
                {isSynopsis ? (
                    <Avatar name={sourceLabel} size="w-10 h-10" />
                ) : (
                    <Avatar src={reviewAuthor.avatar} name={reviewAuthor.name} size="w-10 h-10" />
                )}
            </div>

            {/* Content column */}
            <div className="flex-1 min-w-0">
                {/* Header: name · time ........ menu */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-baseline gap-1.5 min-w-0 text-[15px]">
                        <span className="font-semibold text-[#F5F5F5] truncate">
                            {isSynopsis ? sourceLabel : reviewAuthor.name}
                        </span>
                        <span
                            className="text-[#7A7A7A] shrink-0"
                            title={item.createdAt ? new Date(item.createdAt).toLocaleString() : undefined}
                        >
                            {isSynopsis ? "· Community rating" : relativeTime && `· ${relativeTime}`}
                        </span>
                    </div>

                </div>

                {/* Body: text on the left, small poster on the right */}
                <div className="flex gap-3 mt-0.5">
                    <div className="flex-1 min-w-0">
                        {/* Title · year · rating */}
                        <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                            <h3 className="text-[15px] font-semibold text-[#F5F5F5] leading-snug">
                                <button
                                    type="button"
                                    onClick={() => onOpenDetail?.(item)}
                                    className="text-left cursor-pointer hover:underline underline-offset-2 after:absolute after:inset-0 after:content-['']"
                                >
                                    {item.title}
                                </button>
                            </h3>
                            {item.year && <span className="text-sm text-[#7A7A7A]">{item.year}</span>}
                            {hasRating && (
                                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#61F1AC] font-tabular">
                                    <Star size={13} className="fill-[#61F1AC]" />
                                    {typeof item.rating === "number" ? item.rating.toFixed(1) : item.rating}
                                </span>
                            )}
                        </div>

                        {/* Excerpt */}
                        <div className="mt-1 text-[15px] leading-normal text-[#E8E8E8] line-clamp-4 break-words">
                            <FormattedText content={item.excerpt} isExcerpt={true} />
                        </div>

                        {/* Meta */}
                        {(metaLine || item.containsSpoilers) && (
                            <p className="mt-1.5 text-[13px] text-[#7A7A7A] truncate">
                                {metaLine}
                                {item.containsSpoilers && (
                                    <span>{metaLine ? " · " : ""}Contains spoilers</span>
                                )}
                            </p>
                        )}
                    </div>

                    {/* Poster */}
                    <div className="shrink-0 w-[72px] h-[104px] sm:w-[84px] sm:h-[122px] rounded-lg overflow-hidden bg-[#141414]">
                        {item.posterUrl && !posterError ? (
                            <img
                                src={item.posterUrl}
                                alt={item.title}
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                                onError={() => setPosterError(true)}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-2 text-center text-[11px] text-[#7A7A7A]">
                                {item.title}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-6 text-[13px] text-[#7A7A7A]">
                    <div className="flex items-center gap-1.5"> 
                        <MessageSquare className="group-hover:stroke-white transition-colors" size={16} /> 
                        <span className="font-tabular group-hover:text-white! transition-colors">{item.comments ?? 0}</span> 
                    </div> 
                    <LikeButton 
                        liked={isLiked} 
                        count={likesCount} 
                        onToggle={() => onToggleLike?.(item)} 
                        className="relative z-10" 
                    />
                    
                    <div className="relative z-10 shrink-0 -mr-1.5" ref={menuRef}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen((prev) => !prev);
                            }}
                            aria-label="More options"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            className="text-[#7A7A7A] hover:text-[#F5F5F5] cursor-pointer"
                        >
                            <MoreHorizontal size={16} />
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
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#F5F5F5] hover:bg-white/[0.06] rounded cursor-pointer text-left"
                                >
                                    {copied ? <Check size={13} /> : <Copy size={13} />}
                                    <span>{copied ? "Copied" : "Copy link"}</span>
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={handleReport}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#F5F5F5] hover:bg-white/[0.06] rounded cursor-pointer text-left"
                                >
                                    {reported ? <Check size={13} /> : <AlertCircle size={13} />}
                                    <span>{reported ? "Reported" : "Report"}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}