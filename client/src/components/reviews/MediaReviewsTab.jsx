import React, { useState, useEffect, useRef } from "react"; 
import { useLocation } from "react-router-dom"; 
import { 
  Star, 
  Heart, 
  Reply, 
  MoreHorizontal, 
  ChevronDown, 
  X, 
  Loader2, 
  Check, 
} from "lucide-react";
import { Button } from "../ui/Button";
import { ReviewSlider, AnimatedScore } from "../ui/ReviewSlider";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { getMovieReviews, getSeriesReviews } from "../../services/tmdb";
import { FormattedText } from "../common/FormattedText";
import { CommentFormattingToolbar, handleFormattingKeyDown } from "../common/CommentFormattingToolbar";
import { getReviewAuthor } from "../../utils/reviewUtils";
import { CommentThread } from "./CommentThread"; 
import { ReviewComposer } from "./ReviewComposer"; 
import { useToast } from "../../context/ToastContext"; 
 
const NAVBAR_AVATAR = 
  "https://i.pinimg.com/736x/2e/e4/25/2ee425db685b15db57175a0840e931b1.jpg";

export function ReviewAvatar({ src, alt, size = "w-9 h-9" }) {
  const [errorSrc, setErrorSrc] = useState(null);
  const effectiveSrc = !src || errorSrc === src ? NAVBAR_AVATAR : src;
  const isNavbarAvatar = effectiveSrc === NAVBAR_AVATAR;
  
  return (
    <div
      className={`${size} rounded-full overflow-hidden bg-[#141414] ring-1 ring-[#1C1C1C] shrink-0 flex items-center justify-center`}
    >
      <img
        key={src}
        src={effectiveSrc}
        alt={alt || "Avatar"}
        onError={() => setErrorSrc(src)}
        className={`w-full h-full object-cover ${
          isNavbarAvatar ? "scale-125" : ""
        }`}
      />
    </div>
  );
}

const formatReviewDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export function CommentThreadItem({ 
  comment, 
  currentUserAvatar, 
  currentUserName = "You", 
  likedReviews = {}, 
  toggleLike, 
  onPostReply, 
  allowReply = true, 
}) { 
  if (!comment) return null; 
  return ( 
    <CommentThread 
      comments={[comment]} 
      currentUserAvatar={currentUserAvatar} 
      currentUserName={currentUserName} 
      likedReviews={likedReviews} 
      onToggleLike={toggleLike} 
      onPostReply={onPostReply} 
      allowReply={allowReply} 
    /> 
  ); 
} 
 

export function MediaReviewsTab({
  mediaId,
  mediaType = "MOVIE",
  mediaTitle,
  coverUrl,
  provider = "tmdb",
  category,
  initialProviderReviews = [],
  initialProviderPage = 1,
  initialTotalPages = 1,
  communityData: externalCommunityData,
  onCommunityDataChange,
}) {
  const { user, userProfile } = useAuth();
  const { showToast, openAuthModal } = useToast(); 
  const currentUserAvatar = 
    userProfile?.profile_url || 
    user?.profile_url || 
    user?.user_metadata?.avatar_url || 
    user?.user_metadata?.picture || 
    NAVBAR_AVATAR; 

  const showAuthPrompt = (message = "Please sign in to continue.") => { 
    showToast({ 
      message, 
      actionText: "Sign In", 
      onAction: openAuthModal, 
    }); 
  };
  
  const [internalCommunityData, setInternalCommunityData] = useState({
    communityAverage: null,
    communityVotes: 0,
    reviews: [],
  });
  
  const communityData = externalCommunityData !== undefined ? externalCommunityData : internalCommunityData;
  
  const updateCommunityData = (updater) => {
    if (onCommunityDataChange) {
      onCommunityDataChange((prev) => {
        const updated = typeof updater === "function" ? updater(prev || communityData) : updater;
        return updated;
      });
    } else {
      setInternalCommunityData(updater);
    }
  };
  
  const [providerReviews, setProviderReviews] = useState(initialProviderReviews || []);
  const [providerPage, setProviderPage] = useState(initialProviderPage || 1);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  useEffect(() => {
    if (Array.isArray(initialProviderReviews)) {
      setProviderReviews(initialProviderReviews);
    }
    if (initialProviderPage) setProviderPage(initialProviderPage);
    if (initialTotalPages) setTotalPages(initialTotalPages);
  }, [initialProviderReviews, initialProviderPage, initialTotalPages]);
  
  const [newThought, setNewThought] = useState("");
  const newThoughtRef = useRef(null);
  const reviewLevelReplyRef = useRef(null);
  const [selectedScore, setSelectedScore] = useState(8);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isEditingUserReview, setIsEditingUserReview] = useState(false);
  const [isPostingReview, setIsPostingReview] = useState(false);
  
  const [replyingToReviewId, setReplyingToReviewId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyAnon, setReplyAnon] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  
  const [likedReviews, setLikedReviews] = useState({});
  const [expandedReviews, setExpandedReviews] = useState({});
  const [activeMenuReviewId, setActiveMenuReviewId] = useState(null);
  
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  const location = useLocation(); 
  const [highlightedReviewId, setHighlightedReviewId] = useState(null); 
  const [reviewFilter, setReviewFilter] = useState("all"); 
  const [sortBy, setSortBy] = useState("Top"); 
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false); 
  const [visibleReviews, setVisibleReviews] = useState(6); 
  
  useEffect(() => { 
    const searchParams = new URLSearchParams(location.search); 
    const targetId = searchParams.get("reviewId") || (location.hash ? location.hash.replace("#review-", "") : null); 
    if (targetId) { 
      setHighlightedReviewId(targetId); 
      if (Array.isArray(communityData?.reviews)) { 
        const targetIndex = communityData.reviews.findIndex((r) => r.id === targetId); 
        if (targetIndex >= visibleReviews) { 
          setVisibleReviews(targetIndex + 5); 
        } 
        communityData.reviews.forEach((r) => { 
          const hasDescendant = (node) => { 
            if (!Array.isArray(node.replies)) return false; 
            for (const ch of node.replies) { 
              if (ch.id === targetId || hasDescendant(ch)) return true; 
            } 
            return false; 
          }; 
          if (hasDescendant(r)) { 
            setExpandedReplies((prev) => ({ ...prev, [r.id]: true })); 
          } 
        }); 
      } 
      const timer = setTimeout(() => { 
        const el = document.getElementById(`review-${targetId}`); 
        if (el) { 
          el.scrollIntoView({ behavior: "smooth", block: "center" }); 
        } 
      }, 400); 
      const clearTimer = setTimeout(() => { 
        setHighlightedReviewId(null); 
      }, 1000); 
      return () => { 
        clearTimeout(timer); 
        clearTimeout(clearTimer); 
      }; 
    } 
  }, [location.search, location.hash, communityData]);
  
  useEffect(() => {
    if (!mediaId) return;
    let mounted = true;
    
    async function fetchCommunityReviews() {
      try {
        const res = await api.get(`/reviews/${provider}/${mediaId}`);
        if (mounted && res?.success) {
          const revData = res.data || {};
          const reviewsList = Array.isArray(revData.reviews) ? revData.reviews : [];
          const initLikes = {};
          reviewsList.forEach((r) => {
            if (r.isLiked) initLikes[r.id] = true;
          });
          if (Array.isArray(revData.likedProviderIds)) {
            revData.likedProviderIds.forEach((pid) => {
              initLikes[pid] = true;
            });
          }
          setLikedReviews((prev) => ({ ...initLikes, ...prev }));
          updateCommunityData({
            communityAverage: typeof revData.communityAverage === "number" ? revData.communityAverage : null,
            communityVotes: typeof revData.communityVotes === "number" ? revData.communityVotes : 0,
            reviews: reviewsList,
          });
        }
      } catch (err) {
        console.error("Failed to load community reviews:", err);
      }
    }
    
    fetchCommunityReviews();
    return () => {
      mounted = false;
    };
  }, [mediaId, provider]);
  
  const handlePostReview = async () => {
    if (!newThought.trim()) return;
    const token = localStorage.getItem("orgi_session");
    if (!token) {
      showAuthPrompt("Please sign in to rate and review."); 
      return;
    }
    
    setIsPostingReview(true);
    try {
      const res = await api.post("/reviews", {
        external_id: String(mediaId),
        provider,
        type: mediaType,
        title: mediaTitle,
        cover_url: coverUrl,
        score: selectedScore,
        content: newThought.trim(),
        is_anonymous: isAnonymous,
      });
      
      if (res?.success) {
        setNewThought("");
        setIsAnonymous(false);
        setIsEditingUserReview(false);
        const newRev = res.data;
        
        updateCommunityData((prev) => {
          const currentReviews = Array.isArray(prev?.reviews) ? prev.reviews : [];
          const existingIdx = currentReviews.findIndex(
            (r) => r.id === newRev.id || (r.userId && r.userId === newRev.userId)
          );
          let updatedReviews = [...currentReviews];
          if (existingIdx >= 0) {
            updatedReviews[existingIdx] = newRev;
          } else {
            updatedReviews = [newRev, ...updatedReviews];
          }
          
          const scores = updatedReviews
            .map((r) => r.score)
            .filter((s) => typeof s === "number" && s > 0);
          const avg = scores.length > 0
            ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
            : null;
          
          return {
            ...prev,
            communityAverage: avg,
            communityVotes: scores.length,
            reviews: updatedReviews,
          };
        });
      }
    } catch (err) {
      console.error("Failed to post review:", err);
      showToast({ message: err.message || "Failed to post review." }); 
    } finally {
      setIsPostingReview(false);
    }
  };
  
  const handleDeleteUserReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete your review?")) return;
    try {
      const res = await api.delete(`/reviews/${reviewId}`);
      if (res?.success) {
        updateCommunityData((prev) => {
          const updatedReviews = (prev?.reviews || []).filter((r) => r.id !== reviewId);
          const scores = updatedReviews
            .map((r) => r.score)
            .filter((s) => typeof s === "number" && s > 0);
          const avg = scores.length > 0
            ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
            : null;
          return {
            ...prev,
            communityAverage: avg,
            communityVotes: scores.length,
            reviews: updatedReviews,
          };
        });
      }
    } catch (err) {
      console.error("Failed to delete review:", err);
      showToast({ message: err.message || "Failed to delete review." }); 
    }
  };
  
  const handleToggleReplyBox = (reviewId) => { 
    const token = localStorage.getItem("orgi_session"); 
    if (!token) { 
      showAuthPrompt("Please sign in to reply."); 
      return; 
    } 
    if (replyingToReviewId === reviewId) { 
      setReplyingToReviewId(null); 
      setReplyText(""); 
    } else { 
      setReplyingToReviewId(reviewId); 
      setReplyText(""); 
    } 
  }; 
  
  function insertReplyRecursively(list, targetParentId, newReply) { 
    return list.map((item) => { 
      if (item.id === targetParentId) { 
        return { 
          ...item, 
          replies: [...(item.replies || []), newReply], 
          repliesCount: (item.repliesCount || 0) + 1, 
        }; 
      } 
      if (item.replies && item.replies.length > 0) { 
        return { 
          ...item, 
          replies: insertReplyRecursively(item.replies, targetParentId, newReply), 
          repliesCount: (item.repliesCount || 0) + 1, 
        }; 
      } 
      return item; 
    }); 
  } 
  
  const handlePostReply = async (parentId, targetAuthor, text = replyText, anon = replyAnon) => { 
    const content = typeof text === "string" ? text.trim() : (replyText || "").trim(); 
    if (!content) return false; 
    const token = localStorage.getItem("orgi_session"); 
    if (!token) { 
      showAuthPrompt("Please sign in to reply."); 
      return false; 
    } 
    
    setIsSubmittingReply(true); 
    try { 
      const res = await api.post("/reviews", { 
        external_id: String(mediaId), 
        provider, 
        type: mediaType, 
        title: mediaTitle, 
        cover_url: coverUrl, 
        content, 
        parent_id: parentId, 
        is_anonymous: anon !== undefined ? anon : replyAnon, 
      }); 
      
      if (res?.success) { 
        const newReply = { 
          ...res.data, 
          replyToAuthor: res.data.replyToAuthor || targetAuthor || null, 
        }; 
        updateCommunityData((prev) => ({ 
          ...prev, 
          reviews: insertReplyRecursively(prev?.reviews || [], parentId, newReply), 
        })); 
        setReplyText(""); 
        setReplyAnon(false); 
        setReplyingToReviewId(null); 
        setExpandedReplies((prev) => ({ ...prev, [parentId]: true })); 
        return true; 
      } 
      return false; 
    } catch (err) { 
      console.error("Failed to post reply:", err); 
      showToast({ message: err.message || "Failed to post reply." }); 
      return false; 
    } finally { 
      setIsSubmittingReply(false); 
    } 
  }; 
  
  const toggleReplies = async (reviewId) => { 
    if (loadingReplies[reviewId]) return; 
    if (expandedReplies[reviewId]) { 
      setExpandedReplies((prev) => ({ 
        ...prev, 
        [reviewId]: false, 
      })); 
      return; 
    } 
    setLoadingReplies((prev) => ({ ...prev, [reviewId]: true })); 
    await new Promise((resolve) => setTimeout(resolve, 1000)); 
    setLoadingReplies((prev) => ({ ...prev, [reviewId]: false })); 
    setExpandedReplies((prev) => ({ 
      ...prev, 
      [reviewId]: true, 
    })); 
  }; 
  
  const toggleLike = async (rev) => { 
    const token = localStorage.getItem("orgi_session"); 
    if (!token) { 
      showAuthPrompt("Please sign in to like reviews."); 
      return; 
    } 
    const revId = rev.id; 
    const isCurrentlyLiked = Boolean(likedReviews[revId]); 
    setLikedReviews((prev) => ({ 
      ...prev, 
      [revId]: !isCurrentlyLiked, 
    })); 
    
    if (rev.source === "community") {
      function updateLikesRecursively(list) {
        return list.map((item) => {
          if (item.id === revId) {
            return {
              ...item,
              likes: Math.max(0, (item.likes || 0) + (isCurrentlyLiked ? -1 : 1)),
              isLiked: !isCurrentlyLiked,
            };
          }
          if (item.replies && item.replies.length > 0) {
            return {
              ...item,
              replies: updateLikesRecursively(item.replies),
            };
          }
          return item;
        });
      }
      
      updateCommunityData((prev) => ({
        ...prev,
        reviews: updateLikesRecursively(prev?.reviews || []),
      }));
      
      try {
        await api.post(`/reviews/${revId}/like`);
      } catch (err) {
        console.warn("Failed to persist like:", err);
      }
    } else {
      setProviderReviews((prev) =>
        prev.map((r) =>
          r.id === revId
            ? {
                ...r,
                likes: Math.max(0, (r.likes || 0) + (isCurrentlyLiked ? -1 : 1)),
                isLiked: !isCurrentlyLiked,
              }
            : r
        )
      );
      
      try {
        await api.post("/reviews/provider/like", {
          external_id: String(mediaId),
          provider,
          type: mediaType,
          title: mediaTitle,
          cover_url: coverUrl,
          provider_review_id: String(revId),
          author_name: rev.author,
          author_avatar: rev.avatar,
          content: rev.content,
          score: rev.score,
        });
      } catch (err) {
        console.warn("Failed to persist provider like:", err);
      }
    }
  };
  
  const handleOpenReport = (reviewId) => {
    setReportingReviewId(reviewId);
    setReportReason("");
    setReportModalOpen(true);
    setActiveMenuReviewId(null);
  };
  
  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      showToast({ message: "Please provide a reason for the report." }); 
      return;
    }
    const token = localStorage.getItem("orgi_session");
    if (!token) {
      showAuthPrompt("Please sign in to submit a report."); 
      return;
    }
    
    setIsSubmittingReport(true);
    try {
      const res = await api.post("/reports", {
        target_type: "review",
        target_id: reportingReviewId,
        reason: reportReason.trim(),
      });
      if (res?.success) {
        showToast({ message: "Report submitted for moderation. Thank you!" }); 
        setReportModalOpen(false);
      }
    } catch (err) {
      showToast({ message: err.message || "Failed to submit report" }); 
    } finally {
      setIsSubmittingReport(false);
    }
  };
  
  const handleLoadMoreReviews = async () => {
    const nextLimit = visibleReviews + 4;
    setVisibleReviews(nextLimit);
    
    if (provider === "tmdb" && providerPage < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        const nextPage = providerPage + 1;
        const fetchFn = mediaType === "SERIES" ? getSeriesReviews : getMovieReviews;
        const res = await fetchFn(mediaId, nextPage);
        
        if (res && Array.isArray(res.results) && res.results.length > 0) {
          setProviderReviews((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const additions = res.results.filter((r) => !existingIds.has(r.id));
            return [...prev, ...additions];
          });
          setProviderPage(res.page || nextPage);
          setTotalPages(res.totalPages || totalPages);
        }
      } catch (err) {
        console.warn("Failed to fetch more provider reviews:", err);
      } finally {
        setIsLoadingMore(false);
      }
    }
  };
  
  const userReview = communityData?.reviews?.find((r) => user?.id && r.userId === user.id);
  
  const rawProviderReviews = (providerReviews || []).map((r) => ({
    ...r,
    source: "provider",
  }));
  
  const allReviews = [
    ...(Array.isArray(communityData?.reviews) ? communityData.reviews : []),
    ...rawProviderReviews,
  ];
  
  const filteredReviews = allReviews.filter((r) => {
    if (reviewFilter === "community") return r.source === "community";
    if (reviewFilter === "provider") return r.source === "provider";
    return true;
  });
  
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case "Top":
        return (b.likes || 0) - (a.likes || 0);
      case "Newest":
        return new Date(b.time || b.createdAt || 0) - new Date(a.time || a.createdAt || 0);
      case "Highest Rated":
        return (b.score || 0) - (a.score || 0);
      case "Lowest Rated":
        return (a.score || 0) - (b.score || 0);
      default:
        return 0;
    }
  });
  
  const hasMoreToDisplay = visibleReviews < sortedReviews.length || (provider === "tmdb" && providerPage < totalPages);
  
  return (
    <div className="max-w-[720px] mx-auto animate-in fade-in duration-300">
      {userReview && !isEditingUserReview ? ( 
        <div 
          id={`review-${userReview.id}`} 
          className={`bg-[#0B0B0B] border border-[#61F1AC]/40 rounded-[16px] p-5 mb-8 shadow-[0_0_20px_rgba(97,241,172,0.06)] animate-in fade-in transition-all duration-500 ${ 
            highlightedReviewId === userReview.id ? "ring-2 ring-[#61F1AC] shadow-[0_0_25px_rgba(97,241,172,0.25)]" : "" 
          }`} 
        >
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#1C1C1C]">
            <div className="flex items-center gap-3">
              <ReviewAvatar
                src={userReview.isAnonymous ? NAVBAR_AVATAR : currentUserAvatar}
                alt={userReview.author || user?.user_metadata?.user_name}
                size="w-9 h-9"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-[#F5F5F5]">
                  {userReview.author || "You"}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#61F1AC]/15 text-[#61F1AC] border border-[#61F1AC]/40">
                  Your Review
                </span>
                {userReview.isAnonymous && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#141414] text-[#888888] border border-[#262626]">
                    Anonymous
                  </span>
                )}
                {userReview.is_edited && (
                  <span className="text-[11px] text-[#7A7A7A] italic">(edited)</span>
                )}
                <span className="text-xs text-[#7A7A7A]">·</span>
                <span className="text-xs text-[#7A7A7A] font-light">
                  {formatReviewDate(userReview.time)}
                </span>
              </div>
            </div>
            
            {/* Minimal rating: star + animated number, no pill, no border */}
            <AnimatedScore value={userReview.score} />
          </div>
          
          <div className="text-sm leading-relaxed text-[#E0E0E0] mb-4 font-light">
            <FormattedText content={userReview.content} />
          </div>
          
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1C1C1C]/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewThought(userReview.content || "");
                setSelectedScore(userReview.score || 8);
                setIsAnonymous(Boolean(userReview.isAnonymous));
                setIsEditingUserReview(true);
              }}
              className="px-3 py-1 rounded-lg text-xs cursor-pointer hover:border-[#61F1AC]/50"
            >
              <span>Edit Review</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteUserReview(userReview.id)}
              className="px-3 py-1 rounded-lg text-xs text-[#7A7A7A] hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
            >
              <span>Delete</span>
            </Button>
          </div>
        </div>
      ) : ( 
        <ReviewComposer 
          avatar={currentUserAvatar} 
          content={newThought} 
          onChangeContent={setNewThought} 
          score={selectedScore} 
          onChangeScore={setSelectedScore} 
          isAnonymous={isAnonymous} 
          onChangeAnonymous={setIsAnonymous} 
          isEditing={isEditingUserReview} 
          isSubmitting={isPostingReview} 
          onSubmit={handlePostReview} 
          onCancel={isEditingUserReview ? () => { 
            setIsEditingUserReview(false); 
            setNewThought(""); 
            setIsAnonymous(false); 
          } : undefined} 
          className="mb-8" 
        /> 
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#1C1C1C]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: "all", label: "All" },
            { key: "community", label: "Community (Ours)" },
            { key: "provider", label: category ? "Provider" : "TMDB" },
          ].map((f) => {
            const isActive = reviewFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setReviewFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#61F1AC] text-black font-semibold"
                    : "bg-[#0B0B0B] border border-[#1C1C1C] text-[#B5B5B5] hover:text-white hover:border-[#61F1AC]/40"
                }`}
              >
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7A7A]">
            {sortedReviews.length} {sortedReviews.length === 1 ? "review" : "reviews"}
          </span>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/40 hover:text-[#F5F5F5] transition-colors cursor-pointer"
            >
              <span>Sort: {sortBy}</span>
              <ChevronDown size={12} className="text-[#7A7A7A]" />
            </button>
            
            {sortDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-32 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg py-1 shadow-xl z-20">
                {["Top", "Newest", "Highest Rated", "Lowest Rated"].map(
                  (opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSortBy(opt);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        sortBy === opt
                          ? "text-[#61F1AC] bg-[#141414]"
                          : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]"
                      }`}
                    >
                      {opt}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {sortedReviews.length === 0 && (
        <div className="py-12 px-6 text-center rounded-[16px] border border-dashed border-[#1C1C1C] bg-[#0B0B0B]/50">
          <p className="text-sm text-[#E0E0E0] font-medium mb-1">
            No reviews yet for this title. Be the first to share your thoughts!
          </p>
          <p className="text-xs text-[#7A7A7A] font-light">
            Write a review above to start the community discussion.
          </p>
        </div>
      )}
      <div className="flex flex-col divide-y divide-[#1C1C1C]">
        {sortedReviews.slice(0, visibleReviews).map((rev) => {
          const isLiked = Boolean(likedReviews[rev.id]);
          const likeCount = (rev.likes || 0) + (isLiked && !rev.isLiked ? 1 : !isLiked && rev.isLiked ? -1 : 0);
          const isExpanded = Boolean(expandedReviews[rev.id]);
          const isLongContent = (rev.content || "").length > 130;
          const revAuthor = getReviewAuthor(rev, "Reviewer");
          
          return ( 
            <article 
              key={rev.id} 
              id={`review-${rev.id}`} 
              className={`py-6 first:pt-0 transition-all duration-300 rounded-2xl ${ 
                highlightedReviewId === rev.id 
                  ? "ring-2 ring-[#61F1AC] shadow-[0_0_20px_rgba(97,241,172,0.15)]" 
                  : "" 
              }`} 
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <ReviewAvatar
                    src={revAuthor.avatar}
                    alt={revAuthor.name}
                    size="w-9 h-9"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#F5F5F5]">
                      {revAuthor.name}
                    </span>
                    {rev.source === "community" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#61F1AC]/10 text-[#61F1AC] border border-[#61F1AC]/30">
                        Orgi
                      </span>
                    )}
                    {rev.isAnonymous && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#141414] text-[#888888] border border-[#262626]">
                        Anonymous
                      </span>
                    )}
                    {rev.is_edited && (
                      <span className="text-[11px] text-[#7A7A7A] italic">
                        (edited)
                      </span>
                    )}
                    <span className="text-xs text-[#7A7A7A]">·</span>
                    <span className="text-xs text-[#7A7A7A] font-light">
                      {formatReviewDate(rev.time || rev.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-xs font-tabular text-[#61F1AC] font-semibold">
                  <Star size={12} className="fill-[#61F1AC]" />
                  <span>{rev.score}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <div className={`text-sm leading-relaxed text-[#D0D0D0] font-light ${isExpanded ? "" : "line-clamp-2"}`}>
                  <FormattedText content={rev.content} isExcerpt={!isExpanded} />
                </div>
                {isLongContent && (
                  <button
                    type="button"
                    onClick={() => setExpandedReviews((prev) => ({ ...prev, [rev.id]: !isExpanded }))}
                    className="text-[11px] text-[#61F1AC] hover:underline mt-1 cursor-pointer font-medium"
                  >
                    {isExpanded ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-[#7A7A7A]">
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    onClick={() => toggleLike(rev)}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isLiked ? "text-rose-500 hover:text-rose-400" : "hover:text-[#F5F5F5]"
                    }`}
                  >
                    <Heart
                      size={14}
                      className={isLiked ? "fill-rose-500 text-rose-500" : ""}
                    />
                    <span className="font-tabular text-xs">{likeCount}</span>
                  </button>
                  
                  {rev.source === "community" && (
                    <button
                      type="button"
                      onClick={() => handleToggleReplyBox(rev.id)}
                      className={`flex items-center gap-1 transition-colors cursor-pointer ${
                        replyingToReviewId === rev.id ? "text-[#61F1AC]" : "hover:text-[#F5F5F5]"
                      }`}
                    >
                      <Reply size={13} />
                      <span>Reply</span>
                    </button>
                  )}
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuReviewId(activeMenuReviewId === rev.id ? null : rev.id)}
                      className="hover:text-[#F5F5F5] transition-colors cursor-pointer p-0.5"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    
                    {activeMenuReviewId === rev.id && (
                      <div className="absolute left-0 top-full mt-1 w-32 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg py-1 shadow-2xl z-20">
                        <button
                          type="button"
                          onClick={() => handleOpenReport(rev.id)}
                          className="w-full text-left px-3 py-1.5 text-xs text-[#B5B5B5] hover:text-red-400 hover:bg-[#141414] transition-colors cursor-pointer"
                        >
                          Report Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {rev.repliesCount > 0 && rev.source === "community" && ( 
                  <button 
                    type="button" 
                    disabled={Boolean(loadingReplies[rev.id])} 
                    onClick={() => toggleReplies(rev.id)} 
                    className="text-xs font-medium text-[#61F1AC] hover:underline cursor-pointer flex items-center gap-1.5 disabled:opacity-60" 
                  > 
                    {loadingReplies[rev.id] ? ( 
                      <> 
                        <Loader2 size={13} className="animate-spin text-[#61F1AC]" /> 
                        <span>Loading replies...</span> 
                      </> 
                    ) : ( 
                      <span> 
                        {expandedReplies[rev.id] 
                          ? "Hide replies" 
                          : `View ${rev.repliesCount} ${rev.repliesCount === 1 ? "reply" : "replies"}`} 
                      </span> 
                    )} 
                  </button> 
                )} 
              </div> 
              
              {replyingToReviewId === rev.id && rev.source === "community" && ( 
                <div className="mt-3.5 pl-4 sm:pl-8"> 
                  <div className="bg-[#0B0B0B] border border-[#1C1C1C] focus-within:border-[#61F1AC]/50 rounded-2xl p-4 transition-colors"> 
                    <div className="flex items-start gap-2.5 mb-2.5"> 
                      <ReviewAvatar 
                        src={replyAnon ? NAVBAR_AVATAR : currentUserAvatar} 
                        alt="Your Avatar" 
                        size="w-6 h-6" 
                      /> 
                      <div className="flex-1 min-w-0">
                        <textarea 
                          ref={reviewLevelReplyRef}
                          value={replyText} 
                          onChange={(e) => setReplyText(e.target.value)} 
                          onKeyDown={(e) => handleFormattingKeyDown(e, reviewLevelReplyRef.current, replyText, setReplyText)}
                          placeholder={`Reply to ${revAuthor.name}…`} 
                          rows={2} 
                          className="w-full bg-transparent text-[#F5F5F5] placeholder-[#666666] text-xs resize-none outline-none leading-relaxed" 
                          autoFocus 
                        /> 
                        <CommentFormattingToolbar
                          textareaRef={reviewLevelReplyRef}
                          value={replyText}
                          onChange={setReplyText}
                          className="mt-1"
                        />
                      </div>
                    </div> 
                    <div className="flex items-center justify-between pt-2 border-t border-[#1C1C1C]"> 
                      <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-[#7A7A7A] hover:text-[#F5F5F5]"> 
                        <input 
                          type="checkbox" 
                          checked={replyAnon} 
                          onChange={(e) => setReplyAnon(e.target.checked)} 
                          className="w-3 h-3 rounded border-[#2C2C2C] bg-[#141414] accent-[#61F1AC] cursor-pointer" 
                        /> 
                        <span>Anonymous</span> 
                      </label> 
                      <div className="flex items-center gap-2"> 
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { 
                            setReplyingToReviewId(null); 
                            setReplyText(""); 
                          }} 
                          className="text-xs px-2.5 py-1 text-[#7A7A7A] hover:text-[#F5F5F5] cursor-pointer" 
                        > 
                          Cancel 
                        </Button> 
                        <Button 
                          variant="primary" 
                          size="sm" 
                          disabled={isSubmittingReply || !replyText.trim()} 
                          onClick={() => handlePostReply(rev.id, revAuthor.name)} 
                          className="text-xs font-semibold px-3.5 py-1 cursor-pointer" 
                        > 
                          <span>{isSubmittingReply ? "Posting..." : "Reply"}</span> 
                        </Button> 
                      </div> 
                    </div> 
                  </div> 
                </div> 
              )} 
              
              {rev.replies && expandedReplies[rev.id] && rev.source === "community" && ( 
                <div className="mt-3.5 pl-4 sm:pl-8 pt-3 border-t border-[#1C1C1C]/40"> 
                  <CommentThread 
                    comments={rev.replies} 
                    currentUserAvatar={currentUserAvatar} 
                    currentUserName={userProfile?.user_name || user?.user_name || "You"} 
                    likedReviews={likedReviews} 
                    onToggleLike={toggleLike} 
                    onPostReply={(parentId, targetAuthor, text, anon) => 
                      handlePostReply(parentId || rev.id, targetAuthor, text, anon) 
                    } 
                  /> 
                </div> 
              )} 
            </article>
          );
        })}
      </div>
      
      {hasMoreToDisplay && (
        <div className="flex justify-center mt-10">
          <Button
            variant="mintGhost"
            size="md"
            className="px-6 py-2 rounded-full text-xs font-medium cursor-pointer"
            disabled={isLoadingMore}
            onClick={handleLoadMoreReviews}
          >
            {isLoadingMore ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Loading more...
              </span>
            ) : (
              <span>Load more reviews</span>
            )}
          </Button>
        </div>
      )}
      
      {reportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setReportModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0D0D0D] border border-[#222222] rounded-2xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setReportModalOpen(false)}
              className="absolute top-4 right-4 text-[#7A7A7A] hover:text-[#F5F5F5] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-base font-semibold text-[#F5F5F5] mb-2">
              Report this Review
            </h3>
            <p className="text-xs text-[#7A7A7A] mb-4">
              Help us keep the community clean. Please specify why this review violates guidelines.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Hate speech, spoiler without warning, spam..."
              rows={3}
              className="w-full bg-[#141414] border border-[#222222] focus:border-[#61F1AC]/50 rounded-xl p-3 text-xs text-[#F5F5F5] placeholder-[#555555] outline-none mb-4 resize-none"
            />
            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReportModalOpen(false)}
                className="text-xs px-3 py-1.5 text-[#7A7A7A] hover:text-[#F5F5F5]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isSubmittingReport || !reportReason.trim()}
                onClick={handleSubmitReport}
                className="text-xs font-semibold px-4 py-1.5"
              >
                <span>{isSubmittingReport ? "Submitting..." : "Submit Report"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}