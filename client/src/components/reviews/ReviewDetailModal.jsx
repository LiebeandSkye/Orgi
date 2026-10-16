import React, { useEffect, useState, useRef } from "react";
import { X, Star, ExternalLink, MessageSquare, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "./Avatar";
import api, { API_BASE_URL, safeFetchJson } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { ReviewAvatar } from "./MediaReviewsTab";
import { CommentThread } from "./CommentThread";
import { LikeButton } from "./LikeButton";
import { FormattedText } from "../common/FormattedText";
import { CommentFormattingToolbar, handleFormattingKeyDown } from "../common/CommentFormattingToolbar";
import { getReviewAuthor } from "../../utils/reviewUtils";

// Insert a reply under `targetId` anywhere in the tree.
// Only bumps repliesCount on threads that actually contain the target.
function insertReply(list, targetId, newReply) {
  let found = false;
  const next = list.map((thread) => {
    if (thread.id === targetId) {
      found = true;
      return {
        ...thread,
        replies: [...(thread.replies || []), newReply],
        repliesCount: (thread.repliesCount || 0) + 1,
      };
    }
    if (thread.replies?.length) {
      const [childList, childFound] = insertReply(thread.replies, targetId, newReply);
      if (childFound) {
        found = true;
        return {
          ...thread,
          replies: childList,
          repliesCount: (thread.repliesCount || 0) + 1,
        };
      }
    }
    return thread;
  });
  return [next, found];
}

export function ReviewDetailModal({
  item,
  isOpen,
  onClose,
  isLiked: isLikedProp,
  onToggleLike,
}) {
  const { user, userProfile } = useAuth();
  const currentUserAvatar =
    userProfile?.profile_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;
  const currentUserName =
    userProfile?.user_name ||
    user?.user_metadata?.user_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "You";

  const [detailData, setDetailData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  // State for the TOP composer only. Inline reply composers own their own state.
  const [replyText, setReplyText] = useState("");
  const replyInputRef = useRef(null);
  const [replyAnon, setReplyAnon] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [likedReviews, setLikedReviews] = useState({});
  const [localLiked, setLocalLiked] = useState(false);

  const source = item?.source || "tmdb";
  const titleId = item?.titleId;
  const idStr = item?.id != null ? String(item.id) : "";
  const isOrgi = source === "orgi" || source === "community" || idStr.startsWith("orgi:");
  const parts = idStr.includes(":") ? idStr.split(":") : [];
  const rawReviewId = parts.length >= 3 ? parts[2] : idStr;
  const reviewId = rawReviewId && rawReviewId !== "title" ? rawReviewId : "";

  useEffect(() => {
    if (!isOpen || !item) {
      setDetailData(null);
      setReplies([]);
      setIsLoading(false);
      setLoadingReplies(false);
      setLocalLiked(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setLoadingReplies(isOrgi);
    if (Array.isArray(item.replies) && item.replies.length > 0) {
      setReplies(item.replies);
    }

    const url = item.detailHref
      ? `${API_BASE_URL}${item.detailHref}`
      : `${API_BASE_URL}/reviews/${source}/${titleId}${reviewId ? `/${reviewId}` : ""}`;

    safeFetchJson(url)
      .then(async (json) => {
        if (!active) return;
        if (json?.success && json?.data) {
          setDetailData(json.data);
          if (Array.isArray(json.data.replies)) {
            setReplies(json.data.replies);
            setLoadingReplies(false);
            return;
          }
        } else {
          setDetailData({
            ...item,
            content: item.rawContent || item.excerpt,
          });
        }

        if (isOrgi && reviewId) {
          try {
            const repRes = await api.get(`/reviews/${reviewId}/replies`);
            if (active && repRes?.success && Array.isArray(repRes.data)) {
              setReplies(repRes.data);
            }
          } catch {}
        }
      })
      .catch(() => {
        if (!active) return;
        setDetailData({
          ...item,
          content: item.rawContent || item.excerpt,
        });
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
          setLoadingReplies(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, item, source, titleId, reviewId, isOrgi]);

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
  if (!data) return null;

  const isSynopsis = data.excerptKind === "synopsis";
  const sourceLabel = data.source === "mangadex" ? "MangaDex" : "Open Library";
  const reviewAuthor = getReviewAuthor(data, isSynopsis ? `${sourceLabel} Community Overview` : "Anonymous Reviewer");

  /**
   * Posts a reply and resolves to true/false so callers know whether to
   * clear/close their composer.
   *  - parentId null  -> reply to the review itself (top-level comment)
   *  - parentId <id>  -> reply to that comment/reply (tree is kept in state;
   *                      CommentThread flattens it visually)
   */
  const handlePostReply = async (parentId, targetAuthor, text, anon = false) => {
    const content = text?.trim();
    if (!content || !data) return false;
    const token = localStorage.getItem("orgi_session");
    if (!token) {
      alert("Please sign in to reply.");
      return false;
    }

    const targetReviewId = parentId || reviewId;
    setIsSubmittingReply(true);
    try {
      const category = (data.category || "").toLowerCase();
      const defaultProvider = ["manga", "manhwa", "manhua"].includes(category)
        ? "mangadex"
        : ["book", "novel"].includes(category)
          ? "openlibrary"
          : "tmdb";

      const res = await api.post("/reviews", {
        external_id: String(data.titleId),
        provider: data.source === "orgi" ? defaultProvider : data.source,
        type: (data.mediaLabel || "MOVIE").toUpperCase(),
        title: data.title,
        cover_url: data.posterUrl || data.backdropUrl,
        content,
        parent_id: targetReviewId,
        is_anonymous: anon,
      });

      if (res?.success) {
        const newReply = {
          ...res.data,
          replyToAuthor: res.data.replyToAuthor || targetAuthor || null,
        };
        setReplies((prev) => {
          if (targetReviewId === reviewId) return [...prev, newReply];
          return insertReply(prev, targetReviewId, newReply)[0];
        });
        return true;
      }
      return false;
    } catch (err) {
      alert(err.message || "Failed to post reply.");
      return false;
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleTopReply = async () => {
    const ok = await handlePostReply(null, reviewAuthor.name, replyText, replyAnon);
    if (ok) {
      setReplyText("");
      setReplyAnon(false);
    }
  };

  const toggleLike = async (rev) => {
    const revId = rev.id;
    const isCurrentlyLiked = Boolean(likedReviews[revId]);
    setLikedReviews((prev) => ({
      ...prev,
      [revId]: !isCurrentlyLiked,
    }));
    try {
      await api.post(`/reviews/${revId}/like`);
    } catch {}
  };

  const isCommunity = data.source === "orgi" || data.source === "community" || idStr.startsWith("orgi:");
  const hasRating = data.rating !== undefined && data.rating !== null;

  // Main review like (controlled by parent if it passes isLiked, otherwise local)
  const liked = isLikedProp !== undefined ? isLikedProp : localLiked;
  const baseLikes = data.likes ?? item.likes;
  const likesCount = baseLikes != null ? baseLikes + (liked ? 1 : 0) : null;
  const toggleMainLike = () => {
    if (isLikedProp === undefined) setLocalLiked((v) => !v);
    onToggleLike?.(item);
  };

  const createdDate = data.createdAt ? new Date(data.createdAt) : null;
  const hasDate = createdDate && !Number.isNaN(createdDate.getTime());
  const timestamp = hasDate
    ? `${createdDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · ${createdDate.toLocaleDateString(undefined, { dateStyle: "medium" })}`
    : "";

  let mediaRoute = data.mediaRoute;
  if (!mediaRoute) {
    if (data.source === "tmdb" || data.source === "orgi" || data.source === "community") {
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
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-6 bg-black/70 backdrop-blur-sm animate-backdrop-fade"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[600px] h-full sm:h-auto max-h-full sm:max-h-[90vh] bg-black sm:border sm:border-[#1C1C1C] sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 h-12 px-3 shrink-0 border-b border-[#1C1C1C]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close review"
            className="w-8 h-8 rounded-full text-[#F5F5F5] hover:bg-white/[0.08] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
          <h2 id="review-detail-title" className="text-[17px] font-semibold text-[#F5F5F5]">
            Review
          </h2>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-4
          [scrollbar-width:thin]
          [scrollbar-color:rgba(255,255,255,0.15)_transparent]
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-white/10
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
        >
          {/* Author */}
          <div className="flex items-center gap-3 pt-4">
            {isSynopsis ? (
              <Avatar name={sourceLabel} size="w-10 h-10" />
            ) : (
              <Avatar src={reviewAuthor.avatar} name={reviewAuthor.name} size="w-10 h-10" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-[#F5F5F5] truncate">
                {isSynopsis ? `${sourceLabel} Community Overview` : reviewAuthor.name}
              </div>
              <div className="text-[13px] text-[#7A7A7A] truncate">
                Reviewed {data.title}
                {data.year ? ` (${data.year})` : ""}
              </div>
            </div>
            {hasRating && (
              <div className="shrink-0 inline-flex items-center gap-1 text-[15px] font-semibold text-[#61F1AC] font-tabular">
                <Star size={15} className="fill-[#61F1AC]" />
                {typeof data.rating === "number" ? data.rating.toFixed(1) : data.rating}
              </div>
            )}
          </div>

          {/* Review text */}
          <div className="mt-3">
            {isLoading ? (
              <div className="space-y-2.5 py-2 animate-pulse">
                <div className="w-full h-4 rounded bg-white/[0.05]" />
                <div className="w-11/12 h-4 rounded bg-white/[0.05]" />
                <div className="w-4/5 h-4 rounded bg-white/[0.05]" />
              </div>
            ) : (
              <div className="text-[17px] leading-[1.6] text-[#F5F5F5]">
                <FormattedText content={data.content || data.rawContent || data.excerpt} />
              </div>
            )}
          </div>

          {/* Attached media */}
          <Link
            to={mediaRoute}
            onClick={onClose}
            className="mt-3 block rounded-2xl border border-[#1C1C1C] overflow-hidden hover:bg-white/[0.03] transition-colors"
          >
            {data.backdropUrl && (
              <img
                src={data.backdropUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-36 sm:h-44 object-cover"
              />
            )}
            <div className="flex items-center gap-3 p-3">
              {!data.backdropUrl && data.posterUrl && (
                <img
                  src={data.posterUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-10 h-14 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#7A7A7A] truncate">
                  {[data.mediaLabel, data.year].filter(Boolean).join(" · ")}
                </div>
                <div className="text-[15px] font-semibold text-[#F5F5F5] truncate">{data.title}</div>
                {data.tagline && (
                  <div className="text-[13px] text-[#7A7A7A] truncate">{data.tagline}</div>
                )}
              </div>
              <ChevronRight size={18} className="text-[#7A7A7A] shrink-0" />
            </div>
          </Link>

          {/* Timestamp / spoilers */}
          {(timestamp || data.containsSpoilers) && (
            <p className="mt-3 text-[13px] text-[#7A7A7A]">
              {timestamp}
              {data.containsSpoilers && <span>{timestamp ? " · " : ""}Contains spoilers</span>}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-8 mt-3 py-2.5 border-y border-[#1C1C1C] text-[13px] text-[#7A7A7A]">
            {isCommunity && (
              <div className="flex items-center gap-1.5">
                <MessageSquare size={18} />
                <span className="font-tabular">{replies.length}</span>
              </div>
            )}
            {likesCount !== null && (
              <LikeButton liked={liked} count={likesCount} onToggle={toggleMainLike} size={18} />
            )}
            {data.externalUrl && (
              <a
                href={data.externalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="ml-auto inline-flex items-center gap-1.5 hover:text-[#F5F5F5] transition-colors"
              >
                <span>Original source</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          {/* Replies */}
          {isCommunity && reviewId && (
            <div className="pb-6">
              {/* Composer (no divider, spacing does the separating) */}
              <div className="flex gap-3 pt-4 pb-2">
                <ReviewAvatar
                  src={replyAnon ? undefined : currentUserAvatar}
                  alt={currentUserName}
                  size="w-10 h-10"
                />
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={replyInputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => handleFormattingKeyDown(e, replyInputRef.current, replyText, setReplyText)}
                    placeholder="Post your reply"
                    rows={2}
                    className="w-full bg-transparent text-[#F5F5F5] placeholder-[#7A7A7A] text-[15px] resize-none outline-none leading-relaxed pt-2"
                  />
                  <CommentFormattingToolbar
                    textareaRef={replyInputRef}
                    value={replyText}
                    onChange={setReplyText}
                    className="my-1.5"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-[13px] text-[#7A7A7A] hover:text-[#F5F5F5] transition-colors">
                      <input
                        type="checkbox"
                        checked={replyAnon}
                        onChange={(e) => setReplyAnon(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-[#61F1AC] cursor-pointer"
                      />
                      <span>Anonymous</span>
                    </label>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isSubmittingReply || !replyText.trim()}
                      onClick={handleTopReply}
                      className="text-xs font-semibold px-4 py-1.5 cursor-pointer"
                    >
                      <span>{isSubmittingReply ? "Posting..." : "Reply"}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Thread */}
              {loadingReplies ? (
                <div className="space-y-6 pt-6 animate-pulse">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/[0.05] shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="w-24 h-3 rounded bg-white/[0.05]" />
                        <div className="w-4/5 h-3.5 rounded bg-white/[0.05]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : replies.length > 0 ? (
                <div className="pt-6">
                  <CommentThread
                    comments={replies}
                    currentUserAvatar={currentUserAvatar}
                    currentUserName={currentUserName}
                    likedReviews={likedReviews}
                    onToggleLike={toggleLike}
                    onPostReply={handlePostReply}
                  />
                </div>
              ) : (
                <div className="text-center py-10 text-[15px] text-[#7A7A7A]">
                  No replies yet. Start the conversation.
                </div>
              )}
            </div>
          )}

          {!(isCommunity && reviewId) && <div className="pb-4" />}
        </div>
      </div>
    </div>
  );
}