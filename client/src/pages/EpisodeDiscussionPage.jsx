import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  Clock3,
  Star,
  MessageSquare,
  Send,
  Loader2,
  RefreshCw,
  AlertCircle,
  Share2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getSeriesDetails, getSeasonEpisodes, getEpisodeDetails, getTmdbImageUrl } from "../services/tmdb";
import {
  getSeasonDiscussionCounts,
  getEpisodeDiscussion,
  postEpisodeComment,
  toggleCommentLike,
} from "../services/discussionApi";
import { CommentThread } from "../components/reviews/CommentThread";
import { Avatar } from "../components/reviews/Avatar";
import { Button } from "../components/ui/Button";
import {
  CommentFormattingToolbar,
  handleFormattingKeyDown,
} from "../components/common/CommentFormattingToolbar";

const ACTIVE_ROW = "bg-[#141a17] text-[#e8ecea]";
const IDLE_ROW = "text-[#8b9692] hover:text-[#e8ecea] hover:bg-[#101614]";

function ActiveBar() {
  return (
    <span
      className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#61F1AC]"
      aria-hidden="true"
    />
  );
}

function SeasonDropdown({ seasons, selectedSeason, onSelectSeason }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selectedSeasonObj =
    seasons.find((s) => s.season_number === selectedSeason) || seasons[0];

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleTriggerKeyDown = (e) => {
    if (
      e.key === "ArrowDown" ||
      e.key === "ArrowUp" ||
      e.key === "Enter" ||
      e.key === " "
    ) {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const handleOptionKeyDown = (e, index) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const buttons = menuRef.current?.querySelectorAll("button");
      const nextIndex = (index + 1) % seasons.length;
      buttons?.[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const buttons = menuRef.current?.querySelectorAll("button");
      const prevIndex = (index - 1 + seasons.length) % seasons.length;
      buttons?.[prevIndex]?.focus();
    } else if (e.key === "Tab") {
      setIsOpen(false);
    }
  };

  const handleSelect = (seasonNumber) => {
    onSelectSeason(seasonNumber);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative z-30">
      <button
        ref={triggerRef}
        type="button"
        id="season-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select season"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={`h-8 px-3 rounded-lg border flex items-center justify-between gap-2 text-xs font-medium transition-colors cursor-pointer select-none outline-none ${
          isOpen
            ? "border-[#61F1AC]/60 ring-1 ring-[#61F1AC]/30 bg-[#101614] text-[#F5F5F5]"
            : "border-[#252525] bg-[#141414] text-[#F5F5F5] hover:border-[#61F1AC]/50 hover:bg-[#101614]"
        }`}
      >
        <span>
          Season {selectedSeasonObj?.season_number ?? selectedSeason}
        </span>
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform duration-200 text-[#8B9692] ${
            isOpen ? "rotate-180 text-[#61F1AC]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Select season"
          className="absolute right-0 top-[calc(100%+4px)] min-w-[140px] max-h-60 overflow-y-auto bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-1 shadow-2xl z-50 flex flex-col gap-0.5 [scrollbar-width:thin] [scrollbar-color:#262626_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#262626] [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in zoom-in-95 duration-100"
        >
          {seasons.map((s, index) => {
            const isSelected = s.season_number === selectedSeason;
            return (
              <button
                key={s.season_number}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(s.season_number)}
                onKeyDown={(e) => handleOptionKeyDown(e, index)}
                className={`relative flex items-center justify-between h-8 px-3 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer overflow-hidden outline-none ${
                  isSelected
                    ? ACTIVE_ROW
                    : `${IDLE_ROW} focus-visible:bg-[#101614] focus-visible:text-[#e8ecea]`
                }`}
              >
                {isSelected && <ActiveBar />}
                <span className="truncate flex-1">
                  Season {s.season_number}
                </span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function EpisodeDiscussionPage() {
  const { id: routeSeriesId, seasonNumber: routeSeason, episodeNumber: routeEpisode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();

  const seriesId = routeSeriesId;
  const initialSeason = parseInt(routeSeason, 10) || 1;
  const initialEpisode = parseInt(routeEpisode, 10) || 1;

  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState(initialEpisode);

  // Series & Season Metadata
  const [seriesData, setSeriesData] = useState(() => location.state?.seriesData || null);
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);
  const [seasonCounts, setSeasonCounts] = useState({});
  const [loadingSeason, setLoadingSeason] = useState(true);
  const [seasonError, setSeasonError] = useState(null);

  // Current Episode Discussion
  const [currentEpisode, setCurrentEpisode] = useState(() => location.state?.episode || null);
  const [comments, setComments] = useState([]);
  const [totalCommentsCount, setTotalCommentsCount] = useState(0);
  const [likedReviews, setLikedReviews] = useState({});
  const [loadingDiscussion, setLoadingDiscussion] = useState(true);
  const [discussionError, setDiscussionError] = useState(null);

  // Top-Level Composer State
  const [newCommentText, setNewCommentText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  // Mobile navigation view: "list" (episode selector) or "discussion" (chat view)
  const [mobileView, setMobileView] = useState("discussion");

  const textareaRef = useRef(null);
  const mountedRef = useRef(true);

  // Sync state with URL params
  useEffect(() => {
    const s = parseInt(routeSeason, 10);
    const ep = parseInt(routeEpisode, 10);
    if (s && s !== selectedSeason) {
      setSelectedSeason(s);
    }
    if (ep && ep !== selectedEpisodeNumber) {
      setSelectedEpisodeNumber(ep);
    }
  }, [routeSeason, routeEpisode, selectedSeason, selectedEpisodeNumber]);

  // Update URL on episode change
  const navigateToEpisode = useCallback(
    (epNum, sNum = selectedSeason) => {
      setSelectedEpisodeNumber(epNum);
      setSelectedSeason(sNum);
      setMobileView("discussion");
      navigate(`/series/${seriesId}/season/${sNum}/episode/${epNum}/discussion`, {
        replace: true,
      });
    },
    [navigate, seriesId, selectedSeason]
  );

  // Load Series Details
  useEffect(() => {
    if (!seriesId) return;
    let active = true;

    async function loadSeries() {
      try {
        const details = await getSeriesDetails(seriesId);
        if (active && details) {
          setSeriesData(details);
        }
      } catch (err) {
        console.error("Failed to load series details:", err);
      }
    }

    if (!seriesData) {
      loadSeries();
    }

    return () => {
      active = false;
    };
  }, [seriesId, seriesData]);

  // Load Season Episodes & Discussion Counts
  useEffect(() => {
    if (!seriesId || !selectedSeason) return;
    const controller = new AbortController();
    setLoadingSeason(true);
    setSeasonError(null);

    async function loadSeasonData() {
      try {
        const [episodes, counts] = await Promise.all([
          getSeasonEpisodes(seriesId, selectedSeason),
          getSeasonDiscussionCounts(seriesId, selectedSeason),
        ]);

        if (controller.signal.aborted) return;

        setSeasonEpisodes(episodes || []);
        setSeasonCounts(counts || {});

        // If current episode metadata not loaded or mismatched, match from season episodes
        const found = (episodes || []).find((ep) => ep.episode_number === selectedEpisodeNumber);
        if (found) {
          setCurrentEpisode(found);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setSeasonError(err.message || "Failed to load episodes for this season.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingSeason(false);
        }
      }
    }

    loadSeasonData();

    return () => {
      controller.abort();
    };
  }, [seriesId, selectedSeason, selectedEpisodeNumber]);

  // Load Selected Episode Discussion
  const fetchDiscussion = useCallback(async () => {
    if (!seriesId || !selectedSeason || !selectedEpisodeNumber) return;
    setLoadingDiscussion(true);
    setDiscussionError(null);

    try {
      const result = await getEpisodeDiscussion(
        seriesId,
        selectedSeason,
        selectedEpisodeNumber
      );

      if (!mountedRef.current) return;

      setComments(result.comments || []);
      setTotalCommentsCount(result.totalCount || 0);

      const likedMap = {};
      (result.likedCommentIds || []).forEach((cId) => {
        likedMap[cId] = true;
      });
      setLikedReviews(likedMap);

      // Update season count map
      setSeasonCounts((prev) => ({
        ...prev,
        [selectedEpisodeNumber]: result.totalCount || 0,
      }));
    } catch (err) {
      if (mountedRef.current) {
        setDiscussionError(err.message || "Could not load episode discussion.");
      }
    } finally {
      if (mountedRef.current) {
        setLoadingDiscussion(false);
      }
    }
  }, [seriesId, selectedSeason, selectedEpisodeNumber]);

  useEffect(() => {
    mountedRef.current = true;
    fetchDiscussion();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchDiscussion]);

  // Fetch individual episode details if not already loaded from season
  useEffect(() => {
    if (currentEpisode && currentEpisode.episode_number === selectedEpisodeNumber) return;
    let active = true;

    getEpisodeDetails(seriesId, selectedSeason, selectedEpisodeNumber)
      .then((data) => {
        if (active && data) {
          setCurrentEpisode(data);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [seriesId, selectedSeason, selectedEpisodeNumber, currentEpisode]);

  // Available Seasons
  const availableSeasons = useMemo(() => {
    if (seriesData?.seasons && Array.isArray(seriesData.seasons)) {
      return seriesData.seasons.filter((s) => s.season_number > 0);
    }
    return [{ season_number: 1, name: "Season 1" }];
  }, [seriesData]);

  // Post Top-Level Comment
  const handlePostTopComment = async () => {
    if (!newCommentText.trim() || isSubmitting) return;

    const token = localStorage.getItem("orgi_session");
    if (!token) {
      alert("Please sign in to post a comment.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const episodeCover =
        currentEpisode?.thumbnail ||
        (currentEpisode?.still_path ? getTmdbImageUrl(currentEpisode.still_path, "w780") : "") ||
        seriesData?.poster ||
        "";

      const res = await postEpisodeComment({
        seriesId,
        seasonNumber: selectedSeason,
        episodeNumber: selectedEpisodeNumber,
        content: newCommentText.trim(),
        parentId: null,
        isAnonymous,
        seriesTitle: seriesData?.title || "",
        episodeTitle: currentEpisode?.name || currentEpisode?.title || "",
        coverUrl: episodeCover,
      });

      if (res?.success && res.data) {
        setComments((prev) => [res.data, ...prev]);
        setTotalCommentsCount((prev) => prev + 1);
        setSeasonCounts((prev) => ({
          ...prev,
          [selectedEpisodeNumber]: (prev[selectedEpisodeNumber] || 0) + 1,
        }));
        setNewCommentText("");
        setIsAnonymous(false);
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      setSubmitError(err.message || "Failed to post comment. Your draft has been kept.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Post Nested Reply
  const handlePostReply = async (parentId, targetAuthor, text, anon) => {
    const token = localStorage.getItem("orgi_session");
    if (!token) {
      alert("Please sign in to reply.");
      return false;
    }

    try {
      const replyCover =
        currentEpisode?.thumbnail ||
        (currentEpisode?.still_path ? getTmdbImageUrl(currentEpisode.still_path, "w780") : "") ||
        seriesData?.poster ||
        "";

      const res = await postEpisodeComment({
        seriesId,
        seasonNumber: selectedSeason,
        episodeNumber: selectedEpisodeNumber,
        content: text.trim(),
        parentId,
        isAnonymous: anon,
        seriesTitle: seriesData?.title || "",
        episodeTitle: currentEpisode?.name || currentEpisode?.title || "",
        coverUrl: replyCover,
      });

      if (res?.success && res.data) {
        const newReply = {
          ...res.data,
          replyToAuthor: targetAuthor || null,
        };

        // Recursively insert into comments tree
        function insertReply(list) {
          return list.map((item) => {
            if (item.id === parentId) {
              return {
                ...item,
                replies: [...(item.replies || []), newReply],
                repliesCount: (item.repliesCount || 0) + 1,
              };
            }
            if (item.replies?.length) {
              return {
                ...item,
                replies: insertReply(item.replies),
              };
            }
            return item;
          });
        }

        setComments((prev) => insertReply(prev));
        setTotalCommentsCount((prev) => prev + 1);
        setSeasonCounts((prev) => ({
          ...prev,
          [selectedEpisodeNumber]: (prev[selectedEpisodeNumber] || 0) + 1,
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to post reply:", err);
      alert(err.message || "Failed to post reply.");
      return false;
    }
  };

  // Toggle Like on Comment
  const handleToggleLike = async (comment) => {
    const token = localStorage.getItem("orgi_session");
    if (!token) {
      alert("Please sign in to like comments.");
      return;
    }

    const commentId = comment.id;
    const currentlyLiked = Boolean(likedReviews[commentId]);

    // Optimistic toggle
    setLikedReviews((prev) => ({ ...prev, [commentId]: !currentlyLiked }));

    try {
      const res = await toggleCommentLike(commentId);
      if (res && typeof res.isLiked === "boolean") {
        setLikedReviews((prev) => ({ ...prev, [commentId]: res.isLiked }));
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
      // Revert on error
      setLikedReviews((prev) => ({ ...prev, [commentId]: currentlyLiked }));
    }
  };

  const currentUserName = userProfile?.user_name || user?.email?.split("@")[0] || "You";
  const currentUserAvatar = userProfile?.profile_url || user?.user_metadata?.avatar_url || "";

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-16">
      {/* ======================================================== */}
      {/* DESKTOP TOP HEADER / BREADCRUMB                          */}
      {/* ======================================================== */}
      <header className="border-b border-[#1C1C1C] bg-[#000000]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/series/${seriesId}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#7A7A7A] hover:text-[#61F1AC] transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Series</span>
            </Link>

            <span className="text-[#333333]">/</span>

            <span className="text-xs sm:text-sm font-medium text-[#F5F5F5] truncate max-w-[180px] sm:max-w-md">
              {seriesData?.title || "TV Series"}
            </span>

            <span className="rounded-full bg-emerald-950/70 border border-[#61F1AC]/30 px-2 py-0.5 text-[11px] font-semibold text-[#61F1AC]">
              S{selectedSeason} · E{selectedEpisodeNumber}
            </span>
          </div>

          {/* Season Switcher Pills in Header */}
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
            {availableSeasons.map((season) => (
              <button
                key={season.season_number}
                type="button"
                onClick={() => {
                  setSelectedSeason(season.season_number);
                  navigateToEpisode(1, season.season_number);
                }}
                className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                  selectedSeason === season.season_number
                    ? "bg-[#61F1AC] text-black font-semibold shadow-sm"
                    : "text-[#7A7A7A] hover:text-white hover:bg-[#141414] border border-[#1C1C1C]"
                }`}
              >
                Season {season.season_number}
              </button>
            ))}
          </div>

          {/* Mobile view toggle header button */}
          <div className="md:hidden">
            {mobileView === "discussion" ? (
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#141414] border border-[#252525] text-[#61F1AC]"
              >
                <span>Episodes List</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMobileView("discussion")}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#141414] border border-[#252525] text-white"
              >
                <span>View Chat</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN TWO-PANEL RESPONSIVE CONTAINER                      */}
      {/* ======================================================== */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="md:grid md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] gap-8 items-start">
          {/* ==================================================== */}
          {/* LEFT PANEL: EPISODE NAVIGATION                       */}
          {/* ==================================================== */}
          <aside
            className={`w-full ${
              mobileView === "list" ? "block" : "hidden"
            } md:block md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#262626_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#262626] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3A3A3A] space-y-4 rounded-2xl border border-[#1C1C1C] bg-[#080A0D] p-4`}
          >
            {/* Season Selector */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1C1C1C]">
              <div>
                <h3 className="text-sm font-semibold text-white">Episodes</h3>
                <p className="text-[11px] text-[#7A7A7A]">
                  Season {selectedSeason} · {seasonEpisodes.length} episodes
                </p>
              </div>

              {availableSeasons.length > 1 && (
                <SeasonDropdown
                  seasons={availableSeasons}
                  selectedSeason={selectedSeason}
                  onSelectSeason={(newS) => {
                    setSelectedSeason(newS);
                    navigateToEpisode(1, newS);
                  }}
                />
              )}
            </div>

            {/* Episode List */}
            {loadingSeason ? (
              <div className="space-y-3 py-2 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-[#141414]" />
                ))}
              </div>
            ) : seasonError ? (
              <div className="p-4 rounded-xl border border-red-900/40 bg-red-950/20 text-xs text-red-300">
                {seasonError}
              </div>
            ) : seasonEpisodes.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#7A7A7A]">
                No episodes found for Season {selectedSeason}.
              </p>
            ) : (
              <div className="space-y-2">
                {seasonEpisodes.map((ep) => {
                  const isSelected = ep.episode_number === selectedEpisodeNumber;
                  const commentCount = seasonCounts[ep.episode_number] ?? 0;

                  return (
                    <button
                      key={ep.id || ep.episode_number}
                      type="button"
                      onClick={() => navigateToEpisode(ep.episode_number)}
                      className={`group w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-[#61F1AC]/10 border-[#61F1AC]/40 ring-1 ring-[#61F1AC]/30"
                          : "bg-[#0E1115] border-[#1C1C1C] hover:border-[#2D3139] hover:bg-[#13161B]"
                      }`}
                    >
                      {/* Thumbnail with Episode Pill */}
                      <div className="relative w-16 h-11 shrink-0 rounded-lg overflow-hidden bg-[#161616] border border-[#252525]">
                        {ep.still_path ? (
                          <img
                            src={ep.thumbnail || `https://image.tmdb.org/t/p/w300${ep.still_path}`}
                            alt={ep.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#7A7A7A] font-mono">
                            E{ep.episode_number}
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[9px] font-mono font-medium text-white">
                          E{ep.episode_number}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={`text-xs font-medium truncate ${
                              isSelected ? "text-[#61F1AC]" : "text-[#F5F5F5]"
                            }`}
                          >
                            {ep.name || `Episode ${ep.episode_number}`}
                          </p>
                        </div>

                        <div className="mt-1 flex items-center gap-2 text-[10px] text-[#7A7A7A]">
                          {ep.runtime && <span>{ep.runtime}m</span>}
                          {ep.vote_average > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[#61F1AC]">
                              <Star size={10} fill="currentColor" />
                              {Number(ep.vote_average).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Discussion Count Badge */}
                      <div
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          commentCount > 0
                            ? isSelected
                              ? "bg-[#61F1AC] text-black font-semibold"
                              : "bg-[#61F1AC]/20 text-[#61F1AC] border border-[#61F1AC]/30"
                            : "bg-[#141414] text-[#666666] border border-[#202020]"
                        }`}
                        title={`${commentCount} comments`}
                      >
                        <MessageSquare size={11} />
                        <span>{commentCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* ==================================================== */}
          {/* RIGHT PANEL: SELECTED EPISODE DISCUSSION THREAD      */}
          {/* ==================================================== */}
          <main
            className={`w-full ${
              mobileView === "discussion" ? "block" : "hidden"
            } md:block min-w-0 space-y-6`}
          >
            {/* Mobile Header Bar for Discussion Mode (Telegram-style Back) */}
            <div className="md:hidden flex items-center gap-3 p-3 bg-[#0B0B0B] rounded-xl border border-[#1C1C1C]">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className="p-1.5 rounded-lg text-[#61F1AC] hover:bg-[#1A1A1A] transition-colors"
                aria-label="Back to episode list"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {currentEpisode?.name || `Episode ${selectedEpisodeNumber}`}
                </p>
                <p className="text-[10px] text-[#7A7A7A]">
                  Season {selectedSeason} · Episode {selectedEpisodeNumber} ·{" "}
                  {totalCommentsCount} comments
                </p>
              </div>
            </div>

            {/* Episode Banner Card */}
            <div className="rounded-2xl border border-[#1C1C1C] bg-[#080A0D] overflow-hidden">
              <div className="relative aspect-[21/9] sm:aspect-[24/9] md:h-52 w-full bg-[#111111] overflow-hidden">
                {currentEpisode?.still_path || currentEpisode?.thumbnail ? (
                  <img
                    src={
                      currentEpisode.thumbnail ||
                      `https://image.tmdb.org/t/p/w1280${currentEpisode.still_path}`
                    }
                    alt={currentEpisode?.name || "Episode still"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-[#666]">
                    No episode preview image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080A0D] via-[#080A0D]/60 to-transparent" />

                {/* Banner overlay tags */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="rounded-full bg-[#61F1AC] px-2.5 py-0.5 text-xs font-bold text-black">
                        S{selectedSeason} · E{selectedEpisodeNumber}
                      </span>
                      {currentEpisode?.air_date && (
                        <span className="text-xs text-[#C5C5C5] font-light">
                          {new Date(`${currentEpisode.air_date}T00:00:00`).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white tracking-tight">
                      {currentEpisode?.name || `Episode ${selectedEpisodeNumber}`}
                    </h1>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentEpisode?.runtime && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#A0A0A0] bg-black/60 px-2.5 py-1 rounded-full border border-white/10">
                        <Clock3 size={13} />
                        {currentEpisode.runtime}m
                      </span>
                    )}
                    {currentEpisode?.vote_average > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#61F1AC] bg-emerald-950/70 px-2.5 py-1 rounded-full border border-[#61F1AC]/30">
                        <Star size={12} fill="currentColor" />
                        {Number(currentEpisode.vote_average).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Synopsis & Discussion stats */}
              <div className="p-5 sm:p-6 border-t border-[#1C1C1C]/60 space-y-4">
                {currentEpisode?.overview && (
                  <div>
                    <p
                      className={`text-sm text-[#A3ADB9] font-light leading-relaxed ${
                        synopsisExpanded ? "" : "line-clamp-2"
                      }`}
                    >
                      {currentEpisode.overview}
                    </p>
                    {currentEpisode.overview.length > 140 && (
                      <button
                        type="button"
                        onClick={() => setSynopsisExpanded((prev) => !prev)}
                        className="mt-1.5 text-xs font-medium text-[#61F1AC] hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        {synopsisExpanded ? "Show less" : "Read more"}
                        <ChevronDown
                          size={13}
                          className={`transition-transform duration-300 ${
                            synopsisExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#1C1C1C] text-xs text-[#8B949E]">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#61F1AC]" />
                    <span className="font-semibold text-white">
                      {totalCommentsCount} {totalCommentsCount === 1 ? "Discussion" : "Discussions"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      alert("Discussion link copied to clipboard!");
                    }}
                    className="inline-flex items-center gap-1.5 text-[#7A7A7A] hover:text-[#61F1AC] transition-colors cursor-pointer"
                  >
                    <Share2 size={13} />
                    <span>Share discussion</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ================================================== */}
            {/* TOP-LEVEL COMMENT COMPOSER                         */}
            {/* ================================================== */}
            <div className="rounded-2xl border border-[#1C1C1C] bg-[#080A0D] p-4 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={isAnonymous ? undefined : currentUserAvatar}
                  name={isAnonymous ? "Anonymous" : currentUserName}
                  size="w-8 h-8"
                />
                <span className="text-xs font-medium text-[#F5F5F5]">
                  {isAnonymous ? "Posting anonymously" : `Join as ${currentUserName}`}
                </span>
              </div>

              {/* Formatting Toolbar */}
              <div className="border border-[#1F2329] rounded-xl overflow-hidden bg-[#0D1015]">
                <CommentFormattingToolbar
                  textareaRef={textareaRef}
                  value={newCommentText}
                  onChange={setNewCommentText}
                  className="px-2 py-1.5 bg-[#12151B] border-b border-[#1F2329]"
                />

                <textarea
                  ref={textareaRef}
                  value={newCommentText}
                  rows={3}
                  placeholder={`What did you think of Season ${selectedSeason} Episode ${selectedEpisodeNumber}? Share your reaction or theories... (Markdown supported)`}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    handleFormattingKeyDown(e, textareaRef.current, newCommentText, setNewCommentText);
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handlePostTopComment();
                    }
                  }}
                  className="w-full resize-none bg-transparent p-3 text-sm leading-relaxed text-[#F5F5F5] placeholder-[#666B73] outline-none"
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/30 border border-red-900/50 text-xs text-red-300">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Composer Actions */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-[#8B949E] hover:text-[#F5F5F5] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-3.5 w-3.5 cursor-pointer rounded accent-[#61F1AC]"
                  />
                  <span>Post anonymously</span>
                </label>

                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-[11px] text-[#555B63]">
                    Ctrl + Enter to send
                  </span>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting || !newCommentText.trim()}
                    onClick={handlePostTopComment}
                    className="px-5 py-2 text-xs font-semibold rounded-full cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 size={13} className="animate-spin" />
                        Posting...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Send size={12} />
                        Post Comment
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* ================================================== */}
            {/* DISCUSSION THREAD / COMMENTS LIST                  */}
            {/* ================================================== */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">
                  Episode Comments
                </h2>
                <button
                  type="button"
                  onClick={fetchDiscussion}
                  disabled={loadingDiscussion}
                  className="inline-flex items-center gap-1.5 text-xs text-[#7A7A7A] hover:text-[#61F1AC] transition-colors cursor-pointer disabled:opacity-50"
                  title="Refresh comments"
                >
                  <RefreshCw
                    size={12}
                    className={loadingDiscussion ? "animate-spin text-[#61F1AC]" : ""}
                  />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingDiscussion ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-28 rounded-2xl bg-[#080A0D] border border-[#1C1C1C]"
                    />
                  ))}
                </div>
              ) : discussionError ? (
                <div className="p-6 rounded-2xl border border-red-900/40 bg-red-950/20 text-center space-y-3">
                  <p className="text-sm text-red-300">{discussionError}</p>
                  <Button variant="outline" size="sm" onClick={fetchDiscussion}>
                    Retry
                  </Button>
                </div>
              ) : comments.length === 0 ? (
                <div className="p-10 rounded-2xl border border-[#1C1C1C] bg-[#080A0D] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#141414] border border-[#252525] flex items-center justify-center mx-auto text-[#61F1AC]">
                    <MessageSquare size={22} />
                  </div>
                  <h3 className="text-base font-medium text-white">
                    No comments yet
                  </h3>
                  <p className="text-xs text-[#7A7A7A] max-w-sm mx-auto">
                    Be the first to share your thoughts, predictions, or favorite scene from this episode!
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#1C1C1C] bg-[#080A0D] p-5 sm:p-6 shadow-sm">
                  <CommentThread
                    comments={comments}
                    currentUserAvatar={currentUserAvatar}
                    currentUserName={currentUserName}
                    likedReviews={likedReviews}
                    onToggleLike={handleToggleLike}
                    onPostReply={handlePostReply}
                    allowReply={true}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default EpisodeDiscussionPage;
