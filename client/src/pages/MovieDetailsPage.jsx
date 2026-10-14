import React, { useState, useRef, useEffect } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import {
  Star,
  Plus,
  Check,
  Share2,
  ThumbsUp,
  Reply,
  MoreHorizontal,
  ChevronDown, 
  X, 
} from "lucide-react"; 
import { getMovieDetails, getMovieMedia } from "../services/tmdb"; 
import { ScoreRing } from "../components/ui/ScoreRing"; 
import { Button } from "../components/ui/Button"; 
import { ReviewSlider } from "../components/ui/ReviewSlider"; 
import MediaItems from "../components/ui/MediaItems"; 
import { fetchMediaDetails } from "../services/mediaApi"; 
import { CastCarousel } from "../components/ui/CastCarousel"; 
import { useAuth } from "../context/AuthContext"; 
import api from "../services/api"; 


const NAVBAR_AVATAR = 
  "https://i.pinimg.com/736x/2e/e4/25/2ee425db685b15db57175a0840e931b1.jpg"; 

function ReviewAvatar({ src, alt, size = "w-9 h-9" }) { 
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

export function MovieDetailsPage({
  initialTab = "Cast",
  initialCropHero = false,
}) {
  const location = useLocation(); 
  const { category, id } = useParams(); 
  const { user, userProfile } = useAuth(); 
  const isReviewsUrl = location.pathname.includes("/reviews"); 

  const currentUserAvatar = userProfile?.profile_url || user?.user_metadata?.avatar_url || NAVBAR_AVATAR; 
  const [movieData, setMovieData] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTabOverride, setSelectedTabOverride] = useState(null);
  const [cropHeroOverride, setCropHeroOverride] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadTmdbMovie() {
      setIsLoading(true);
      try {
        const data = category
          ? await fetchMediaDetails(category, id)
          : await getMovieDetails(id || 157336);

        if (mounted && data) {
          setMovieData(data);
        }
      } catch (err) {
        console.error("Failed to load media details:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadTmdbMovie();

    return () => {
      mounted = false;
    };
  }, [category, id]);

  const [mediaData, setMediaData] = useState({ 
    images: { 
      backdrops: [], 
      posters: [], 
    }, 
    videos: { 
      results: [], 
    }, 
  }); 

  useEffect(() => { 
    if (category) return; 
    const targetMovieId = id || 157336; 

    let cancelled = false; 

    async function fetchMedia() { 
      try { 
        const data = await getMovieMedia(targetMovieId); 

        if (!cancelled) { 
          setMediaData(data); 
        } 
      } catch (error) { 
        console.error("Failed to load movie media:", error); 
      } 
    } 

    fetchMedia(); 

    return () => { 
      cancelled = true; 
    }; 
  }, [category, id]); 


  const activeTab =
    selectedTabOverride !== null
      ? selectedTabOverride
      : isReviewsUrl
        ? "Reviews"
        : initialTab;

  const cropHero =
    cropHeroOverride !== null
      ? cropHeroOverride
      : isReviewsUrl
        ? true
        : initialCropHero;

  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const synopsisRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  const displaySynopsis =
    (movieData?.synopsis || "") +
    ((movieData?.id === 157336 || movieData?.title?.toLowerCase() === "interstellar") &&
    movieData?.synopsis &&
    movieData.synopsis.length < 260 &&
    !movieData.synopsis.includes("dust storms")
      ? " As mankind faces extinction through dust storms and famine, a team of astronauts embarks on humanity's farthest journey across the galaxy."
      : "");

  useEffect(() => { 
    const checkOverflow = () => { 
      if (synopsisRef.current) { 
        const height = synopsisRef.current.scrollHeight; 
        setContentHeight(height); 
        setHasOverflow(height > 80); 
      } 
    }; 
    checkOverflow(); 
    window.addEventListener("resize", checkOverflow); 
    return () => window.removeEventListener("resize", checkOverflow); 
  }, [displaySynopsis]);

  const isLongSynopsis = contentHeight === 0 || contentHeight > 82; 
  const [newThought, setNewThought] = useState(""); 
  const [selectedScore, setSelectedScore] = useState(8); 
  const [repliesExpanded, setRepliesExpanded] = useState(false); 
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false); 
  const [sortBy, setSortBy] = useState("Top"); 
  const [likedReviews, setLikedReviews] = useState({}); 
  const [visibleReviews, setVisibleReviews] = useState(4); 
  const [inCollection, setInCollection] = useState(false); 
  const [collectionLoading, setCollectionLoading] = useState(false); 
  const [isEditingUserReview, setIsEditingUserReview] = useState(false); 
  const [expandedReviews, setExpandedReviews] = useState({}); 
  const [activeMenuReviewId, setActiveMenuReviewId] = useState(null); 
  const [reportModalOpen, setReportModalOpen] = useState(false); 
  const [reportingReviewId, setReportingReviewId] = useState(null); 
  const [reportReason, setReportReason] = useState(""); 
  const [isSubmittingReport, setIsSubmittingReport] = useState(false); 
  const [communityData, setCommunityData] = useState({ 
    communityAverage: null, 
    communityVotes: 0, 
    reviews: [], 
  }); 
  const [reviewFilter, setReviewFilter] = useState("all"); 
  const [isPostingReview, setIsPostingReview] = useState(false); 
 
  useEffect(() => { 
    if (!movieData) return; 
    const currentProvider = category 
      ? (category === "manga" || category === "manhwa" || category === "manhua" ? "mangadex" : "openlibrary") 
      : "tmdb"; 
    const currentExternalId = String(category ? id : (id || 157336)); 
 
    let mounted = true; 
    async function loadCollectionAndReviews() { 
      try { 
        const [colRes, revRes] = await Promise.allSettled([ 
          api.get(`/collections/check/${currentProvider}/${currentExternalId}`), 
          api.get(`/reviews/${currentProvider}/${currentExternalId}`), 
        ]); 
 
        if (mounted) { 
          if (colRes.status === "fulfilled" && colRes.value?.success) { 
            setInCollection(!!colRes.value.data?.inCollection); 
          } 
          if (revRes.status === "fulfilled" && revRes.value?.success) { 
            const revData = revRes.value.data || {}; 
            const reviewsList = Array.isArray(revData.reviews) ? revData.reviews : []; 
            const initLikes = {}; 
            reviewsList.forEach((r) => { 
              if (r.isLiked) initLikes[r.id] = true; 
            }); 
            setLikedReviews((prev) => ({ ...initLikes, ...prev })); 
            setCommunityData({ 
              communityAverage: typeof revData.communityAverage === "number" ? revData.communityAverage : null, 
              communityVotes: typeof revData.communityVotes === "number" ? revData.communityVotes : 0, 
              reviews: reviewsList, 
            }); 
          } 
        } 
      } catch (err) { 
        console.error("Failed to load collection or review status:", err); 
      } 
    } 
    loadCollectionAndReviews(); 
 
    return () => { 
      mounted = false; 
    }; 
  }, [movieData, category, id]); 
 
  const handleToggleCollection = async () => { 
    if (!movieData) return; 
    const token = localStorage.getItem("orgi_session"); 
    if (!token) { 
      alert("Please sign in to add items to your collection."); 
      return; 
    } 
 
    const currentProvider = category 
      ? (category === "manga" || category === "manhwa" || category === "manhua" ? "mangadex" : "openlibrary") 
      : "tmdb"; 
    const currentExternalId = String(category ? id : (id || 157336)); 
    const currentType = category ? category.toUpperCase() : "MOVIE"; 
 
    setCollectionLoading(true); 
    try { 
      const res = await api.post("/collections/toggle", { 
        external_id: currentExternalId, 
        provider: currentProvider, 
        type: currentType, 
        title: movieData.title, 
        cover_url: movieData.poster || movieData.backdrop, 
      }); 
 
      if (res?.success) { 
        setInCollection(!!res.data?.inCollection); 
      } 
    } catch (err) { 
      console.error("Failed to toggle collection:", err); 
      alert(err.message || "Failed to update collection."); 
    } finally { 
      setCollectionLoading(false); 
    } 
  }; 
 
  const handlePostReview = async () => { 
    if (!newThought.trim()) return; 
    const token = localStorage.getItem("orgi_session"); 
    if (!token) { 
      alert("Please sign in to rate and review."); 
      return; 
    } 
 
    const currentProvider = category 
      ? (category === "manga" || category === "manhwa" || category === "manhua" ? "mangadex" : "openlibrary") 
      : "tmdb"; 
    const currentExternalId = String(category ? id : (id || 157336)); 
    const currentType = category ? category.toUpperCase() : "MOVIE"; 
 
    setIsPostingReview(true); 
    try { 
      const res = await api.post("/reviews", { 
        external_id: currentExternalId, 
        provider: currentProvider, 
        type: currentType, 
        title: movieData.title, 
        cover_url: movieData.poster || movieData.backdrop, 
        score: selectedScore, 
        content: newThought.trim(), 
      }); 
 
      if (res?.success) { 
        setNewThought(""); 
        setIsEditingUserReview(false); 
        const newRev = res.data; 
        setCommunityData((prev) => { 
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
      alert(err.message || "Failed to post review."); 
    } finally { 
      setIsPostingReview(false); 
    } 
  }; 

  const handleDeleteUserReview = async (reviewId) => { 
    if (!confirm("Are you sure you want to delete your review?")) return; 
    try { 
      const res = await api.delete(`/reviews/${reviewId}`); 
      if (res?.success) { 
        setCommunityData((prev) => { 
          const updated = (prev?.reviews || []).filter((r) => r.id !== reviewId); 
          const scores = updated 
            .map((r) => r.score) 
            .filter((s) => typeof s === "number" && s > 0); 
          const avg = scores.length > 0 
            ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) 
            : null; 
          return { 
            ...prev, 
            reviews: updated, 
            communityAverage: avg, 
            communityVotes: scores.length, 
          }; 
        }); 
      } 
    } catch (err) { 
      alert(err.message || "Failed to delete review"); 
    } 
  }; 

  const handleOpenReport = (reviewId) => { 
    setActiveMenuReviewId(null); 
    setReportingReviewId(reviewId); 
    setReportReason(""); 
    setReportModalOpen(true); 
  }; 

  const handleSubmitReport = async () => { 
    if (!reportReason.trim()) { 
      alert("Please enter a reason for reporting"); 
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
        alert("Report submitted for moderation. Thank you!"); 
        setReportModalOpen(false); 
      } 
    } catch (err) { 
      alert(err.message || "Failed to submit report"); 
    } finally { 
      setIsSubmittingReport(false); 
    } 
  }; 
 
  const providerScore = parseFloat(movieData?.tmdbRating) || 0; 
  const providerVotesCount = 
    typeof movieData?.tmdbVotes === "string" && (movieData.tmdbVotes.includes("K") || movieData.tmdbVotes.includes("k")) 
      ? parseFloat(movieData.tmdbVotes) * 1000 
      : parseInt(movieData?.tmdbVotes, 10) || 100; 
 
  const communityScore = communityData?.communityAverage ?? null; 
  const communityVotesCount = communityData?.communityVotes || 0; 
 
  let blendedScore = providerScore; 
  let totalVotesLabel = movieData?.tmdbVotes; 
 
  if (communityScore !== null && communityVotesCount > 0) { 
    blendedScore = Number( 
      ( 
        (providerScore * providerVotesCount + communityScore * communityVotesCount) / 
        (providerVotesCount + communityVotesCount) 
      ).toFixed(1) 
    ); 
    const totalCount = providerVotesCount + communityVotesCount; 
    totalVotesLabel = totalCount >= 1000 
      ? `${(totalCount / 1000).toFixed(1)}k ratings` 
      : `${totalCount} ratings`; 
  } 
 
  const rawProviderReviews = (movieData?.reviews || []).map((r) => ({ 
    ...r, 
    source: "provider", 
  })); 
  const userReview = communityData?.reviews?.find((r) => user?.id && r.userId === user.id); 
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

  const contentRef = useRef(null);

  const handleTabChange = (tab) => {
    setSelectedTabOverride(tab);
    if (tab === "Reviews") {
      setCropHeroOverride(true);
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      setCropHeroOverride(false);
    }
  };

  const toggleLike = async (reviewId) => { 
    const isCurrentlyLiked = Boolean(likedReviews[reviewId]); 
    setLikedReviews((prev) => ({ 
      ...prev, 
      [reviewId]: !isCurrentlyLiked, 
    })); 
    setCommunityData((prev) => ({ 
      ...prev, 
      reviews: (prev.reviews || []).map((r) => 
        r.id === reviewId 
          ? { 
              ...r, 
              likes: Math.max(0, (r.likes || 0) + (isCurrentlyLiked ? -1 : 1)), 
              isLiked: !isCurrentlyLiked, 
            } 
          : r 
      ), 
    })); 
    try { 
      await api.post(`/reviews/${reviewId}/like`); 
    } catch (err) { 
      console.warn("Failed to persist like:", err); 
    } 
  }; 

  if (isLoading || !movieData) {
    return (
      <div className="min-h-screen bg-[#000000] text-[#F5F5F5] select-none pt-12 pb-24">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] flex flex-col md:flex-row gap-12">
          <div className="w-[320px] aspect-[2/3] rounded-[12px] bg-[#0E0E0E] animate-pulse border border-[#1C1C1C] shrink-0 hidden md:block" />
          <div className="flex-1 flex flex-col gap-4 pt-4">
            <div className="w-20 h-4 rounded bg-[#161616] animate-pulse" />
            <div className="w-3/4 h-12 rounded bg-[#161616] animate-pulse" />
            <div className="w-1/2 h-5 rounded bg-[#161616] animate-pulse" />
            <div className="flex items-center gap-6 mt-4">
              <div className="w-24 h-24 rounded-full bg-[#161616] animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-[#161616] animate-pulse" />
            </div>
            <div className="w-full h-24 rounded bg-[#161616] animate-pulse mt-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-24">
      {/* HERO SECTION */}
      <section
        className={`relative w-full overflow-hidden transition-all duration-500 ${
          cropHero ? "h-[220px] md:h-[280px]" : "min-h-[580px] lg:min-h-[640px]"
        }`}
      >
        {/* Full-width dark cinematic backdrop image heavily darkened with black gradient overlay fading to pure #000 at bottom */}
        <div className="absolute inset-0 z-0">
          <img
            src={movieData.backdrop}
            alt={movieData.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-40 scale-105"
          />
          {/* Radial mint aura (5%) */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#61F1AC] opacity-[0.035] blur-[140px] pointer-events-none rounded-full" />
          {/* Black gradient overlay fading to pure #000 at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80 via-transparent to-[#000000]/80" />
        </div>

        {/* Hero Content: Two-column layout with 120px side margins */}
        <div
          className={`relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[120px] pt-10 pb-8 flex items-start gap-12 transition-transform duration-500 ${
            cropHero
              ? "-translate-y-48 opacity-40 pointer-events-none"
              : "translate-y-0 opacity-100"
          }`}
        >
          {/* LEFT: 2:3 portrait poster, 320px wide, 12px rounded corners, 1px border */}
          <div className="shrink-0 hidden md:block w-[320px]">
            <div className="relative aspect-[2/3] w-full rounded-[12px] border border-[#1C1C1C] overflow-hidden bg-[#0B0B0B] shadow-2xl group">
              <img
                src={movieData.poster}
                alt={movieData.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* RIGHT: Meta, Title, Scores, Buttons, Synopsis */}
          <div className="flex-1 flex flex-col pt-2 min-w-0">
            {/* Small muted uppercase label "MOVIE" or breadcrumb link */}
            <div className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#7A7A7A] mb-3">
              {category ? (
                <Link
                  to={`/books/${category}`}
                  className="hover:text-[#61F1AC] transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title={`Back to ${category}`}
                >
                  <span>← {movieData.type}</span>
                </Link>
              ) : (
                movieData.type
              )}
            </div>

            {/* Large light-weight white title "Interstellar" */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#F5F5F5] mb-3">
              {movieData.title}
            </h1>

            <div className="text-sm text-[#7A7A7A] font-normal tracking-normal mb-4 flex items-center gap-2">
              <span className="shrink-0 rounded-full border border-white/30 px-4 py-2 font-medium leading-6 text-white transition-all duration-200 hover:border-[#61F1AC]/40 hover:bg-white/10">
                {movieData.genres}
              </span>
            </div>

            {/* One muted meta line "2014 · Sci-Fi, Adventure · 2h 49m · PG-13" */}
            <div className="text-sm text-[#7A7A7A] font-normal tracking-normal mb-8 mx-2 flex items-center gap-2">
              <span>{movieData.year}</span>
              <span className="">·</span>
              <span>{movieData.runtime}</span>
              <span>·</span>
              <span>{movieData.certificate}</span>
            </div>

            {/* Row with two circular score rings */}
            <div className="flex items-center gap-8 mb-8">
              <ScoreRing 
                score={blendedScore} 
                label={totalVotesLabel} 
                size="lg" 
              /> 
 
              <div className="w-[1px] h-12 bg-[#1C1C1C]" /> 
 
              <ScoreRing 
                score={communityScore !== null ? communityScore : movieData.communityRating} 
                label={communityVotesCount > 0 ? `${communityVotesCount} Orgi votes` : movieData.communityVotes} 
                size="sm" 
                variant="inline" 
              /> 
            </div> 
 
            <div className="flex items-center gap-3.5 mb-8"> 
              <Button 
                variant="primary" 
                size="md" 
                className="px-5 py-2.5 rounded-[10px]" 
                onClick={() => { 
                  handleTabChange("Reviews"); 
                }} 
              > 
                <Star size={15} className="fill-black text-black" /> 
                <span>Rate this</span> 
              </Button> 
 
              <Button 
                variant={inCollection ? "mintGhost" : "outline"} 
                size="md" 
                disabled={collectionLoading} 
                className={`px-5 py-2.5 rounded-[10px] transition-all cursor-pointer ${ 
                  inCollection ? "border-[#61F1AC]/50 text-[#61F1AC] bg-[#61F1AC]/10" : "" 
                }`} 
                onClick={handleToggleCollection} 
              > 
                {inCollection ? <Check size={15} /> : <Plus size={15} />} 
                <span>{inCollection ? "In collection" : "Add to collection"}</span> 
              </Button>

              <button
                type="button"
                aria-label="Share"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert("Link copied to clipboard");
                }}
                className="w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#61F1AC]/50 hover:bg-[#141414] transition-colors cursor-pointer"
              >
                <Share2 size={15} />
              </button>
            </div>

            {/* 3-line synopsis in #B5B5B5 at 16px with mint "Read more" link */}

            <div className="max-w-2xl text-[16px] leading-relaxed text-[#B5B5B5] font-light">
              <div
                style={{
                  maxHeight: !hasOverflow || synopsisExpanded
                    ? `${contentHeight > 0 ? contentHeight + 4 : 400}px`
                    : "5rem",
                }}
                className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
              >
                <div ref={synopsisRef}>
                  <p className="font-light text-[#B5B5B5] leading-relaxed">
                    {displaySynopsis}
                  </p>
                </div>

                {/* Dark blur at the end ONLY if it has a See more button and is not expanded */}
                {hasOverflow && (
                  <div
                    className={`pointer-events-none absolute bottom-0 left-0 h-8 w-full bg-gradient-to-t from-[#000000] via-[#000000]/70 to-transparent transition-opacity duration-300 ${
                      synopsisExpanded ? "opacity-0" : "opacity-100"
                    }`}
                  />
                )}
              </div>

              {hasOverflow && (
                <button
                  type="button"
                  onClick={() => setSynopsisExpanded((prev) => !prev)}
                  className="mt-2 text-sm font-medium text-[#61F1AC] hover:text-[#61F1AC]/80 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>{synopsisExpanded ? "Show less" : "See more"}</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-500 ease-in-out ${
                      synopsisExpanded ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BELOW THE HERO: Minimal horizontal tab switcher */}
      <div
        ref={contentRef}
        className="sticky top-16 z-30 bg-[#000000]/95 backdrop-blur-md border-b border-[#1C1C1C]"
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] flex items-center justify-between">
          <div className="flex items-center gap-8 h-12">
            {["Cast", "Reviews", "Media", "Details"].map((tab) => {
              const isActive = activeTab === tab;
              const tabLabel = tab === "Cast" && category ? "Author" : tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className={`relative h-full flex items-center text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "text-[#F5F5F5]"
                      : "text-[#7A7A7A] hover:text-[#F5F5F5]"
                  }`}
                >
                  <span>{tabLabel}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#61F1AC]" />
                  )}
                </button>
              );
            })}
          </div>

          {cropHero && (
            <button
              type="button"
              onClick={() => {
                setCropHeroOverride(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-xs text-[#7A7A7A] hover:text-[#61F1AC] transition-colors"
            >
              ↑ Back to Hero
            </button>
          )}
        </div>
      </div>

      {/* TAB CONTENT (Only the active tab's content is shown, never all at once) */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-[120px] pt-12">
        {/* ======================================================== */}
        {/* 1. CAST / AUTHOR TAB CONTENT                             */}
        {/* ======================================================== */}
        {activeTab === "Cast" && (
          <div className="animate-in fade-in duration-300">
            {category && ( 
              <div className="flex items-center justify-between mb-8"> 
                <h2 className="text-xl font-light text-[#F5F5F5] tracking-tight"> 
                  Author 
                </h2> 
              </div> 
            )} 


            {category ? (
              /* Vertical Portrait Author Cards for Book, Manga, Manhwa, and Manhua */
              <div className="flex flex-wrap items-stretch gap-5">
                {(movieData.cast || []).map((member) => (
                  <div
                    key={member.id}
                    className="w-[165px] flex flex-col bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 rounded-[12px] overflow-hidden shadow-lg transition-all group"
                  >
                    {/* Top Rectangular Portrait Image */}
                    <div className="w-full h-[195px] bg-[#141414] overflow-hidden border-b border-[#1C1C1C]">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Bottom Info Box */}
                    <div className="p-3.5 flex flex-col flex-1">
                      <span className="font-semibold text-sm text-[#F5F5F5] leading-snug group-hover:text-white">
                        {member.name}
                      </span>
                      <span className="text-xs text-[#B5B5B5] mt-1">
                        {member.character}
                      </span>
                      <span className="text-xs text-[#7A7A7A] mt-1">
                        {movieData.runtime || movieData.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Horizontal scrollable row of 8 circular 88px cast portraits with subtle fade on right edge */
              <CastCarousel
                title="Cast"
                items={movieData.cast || []}
                variant="cast"
              />
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. REVIEWS TAB CONTENT (720px centered single column)     */}
        {/* =====================================================        {activeTab === "Reviews" && ( 
          <div className="max-w-[720px] mx-auto animate-in fade-in duration-300"> 
            {userReview && !isEditingUserReview ? ( 
              <div className="bg-[#0B0B0B] border border-[#61F1AC]/40 rounded-[16px] p-5 mb-8 shadow-[0_0_20px_rgba(97,241,172,0.06)] animate-in fade-in"> 
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#1C1C1C]"> 
                  <div className="flex items-center gap-3"> 
                    <ReviewAvatar 
                      src={currentUserAvatar} 
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
                      {userReview.is_edited && ( 
                        <span className="text-[11px] text-[#7A7A7A] italic"> 
                          (edited) 
                        </span> 
                      )} 
                      <span className="text-xs text-[#7A7A7A]">·</span> 
                      <span className="text-xs text-[#7A7A7A] font-light"> 
                        {userReview.time} 
                      </span> 
                    </div> 
                  </div> 

                  <div className="flex items-center gap-2"> 
                    <div className="flex items-center gap-1 text-xs font-tabular text-[#61F1AC] font-semibold bg-[#141414] px-2.5 py-1 rounded-full border border-[#222222]"> 
                      <Star size={12} className="fill-[#61F1AC]" /> 
                      <span>{userReview.score} / 10</span> 
                    </div> 
                  </div> 
                </div> 

                <p className="text-sm leading-relaxed text-[#E0E0E0] mb-4 font-light whitespace-pre-wrap"> 
                  {userReview.content} 
                </p> 

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1C1C1C]/60"> 
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { 
                      setNewThought(userReview.content || ""); 
                      setSelectedScore(userReview.score || 8); 
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
              <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-[16px] p-5 mb-8 shadow-sm"> 
                <div className="flex items-start gap-3.5 mb-4"> 
                  <ReviewAvatar 
                    src={currentUserAvatar} 
                    alt="User Avatar" 
                    size="w-9 h-9" 
                  /> 
                  <textarea 
                    value={newThought} 
                    onChange={(e) => setNewThought(e.target.value)} 
                    placeholder={isEditingUserReview ? "Update your thought…" : "Add a thought…"} 
                    rows={3} 
                    className="w-full bg-transparent text-[#F5F5F5] placeholder-[#7A7A7A] text-sm resize-none focus:outline-none" 
                  /> 
                </div> 

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#1C1C1C]/60"> 
                  <ReviewSlider 
                    value={selectedScore} 
                    onChange={setSelectedScore} 
                  /> 

                  <div className="flex items-center gap-2 self-end sm:self-center"> 
                    {isEditingUserReview && ( 
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { 
                          setIsEditingUserReview(false); 
                          setNewThought(""); 
                        }} 
                        className="px-3.5 py-1.5 rounded-lg text-xs cursor-pointer" 
                      > 
                        Cancel 
                      </Button> 
                    )} 
                    <Button 
                      variant="primary" 
                      size="sm" 
                      disabled={newThought.trim().length === 0 || isPostingReview} 
                      onClick={handlePostReview} 
                      className="px-4 py-1.5 rounded-lg text-xs cursor-pointer" 
                    > 
                      {isPostingReview ? "Saving..." : isEditingUserReview ? "Publish" : "Post"} 
                    </Button> 
                  </div> 
                </div> 
              </div> 
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

            <div className="flex flex-col divide-y divide-[#1C1C1C]"> 
              {sortedReviews.slice(0, visibleReviews).map((rev) => { 
                const isLiked = likedReviews[rev.id]; 
                const likeCount = (rev.likes || 0) + (isLiked && !rev.isLiked ? 1 : !isLiked && rev.isLiked ? -1 : 0); 
                const isExpanded = Boolean(expandedReviews[rev.id]); 
                const isLongContent = (rev.content || "").length > 130; 

                return ( 
                  <article key={rev.id} className="py-6 first:pt-0"> 
                    <div className="flex items-center justify-between mb-3"> 
                      <div className="flex items-center gap-3"> 
                        <ReviewAvatar 
                          src={rev.avatar} 
                          alt={rev.author} 
                          size="w-9 h-9" 
                        /> 
                        <div className="flex items-center gap-2 flex-wrap"> 
                          <span className="font-semibold text-sm text-[#F5F5F5]"> 
                            {rev.author} 
                          </span> 
                          {rev.source === "community" && ( 
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#61F1AC]/10 text-[#61F1AC] border border-[#61F1AC]/30"> 
                              Orgi 
                            </span> 
                          )} 
                          {rev.is_edited && ( 
                            <span className="text-[11px] text-[#7A7A7A] italic"> 
                              (edited) 
                            </span> 
                          )} 
                          <span className="text-xs text-[#7A7A7A]">·</span> 
                          <span className="text-xs text-[#7A7A7A] font-light"> 
                            {rev.time} 
                          </span> 
                        </div> 
                      </div> 

                      <div className="flex items-center gap-1 text-xs font-tabular text-[#61F1AC] font-semibold"> 
                        <Star size={12} className="fill-[#61F1AC]" /> 
                        <span>{rev.score}</span> 
                      </div> 
                    </div> 

                    <div className="mb-4"> 
                      <p className={`text-sm leading-relaxed text-[#D0D0D0] font-light ${isExpanded ? "" : "line-clamp-2"}`}> 
                        {rev.content} 
                      </p> 
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

                    {rev.source === "community" && ( 
                      <div className="flex items-center justify-between text-xs text-[#7A7A7A]"> 
                        <div className="flex items-center gap-5"> 
                          <button 
                            type="button" 
                            onClick={() => toggleLike(rev.id)} 
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${ 
                              isLiked ? "text-[#61F1AC]" : "hover:text-[#F5F5F5]" 
                            }`} 
                          > 
                            <ThumbsUp 
                              size={13} 
                              className={isLiked ? "fill-[#61F1AC]" : ""} 
                            /> 
                            <span className="font-tabular">{likeCount}</span> 
                          </button> 

                          <button 
                            type="button" 
                            className="flex items-center gap-1 hover:text-[#F5F5F5] transition-colors cursor-pointer" 
                          > 
                            <Reply size={13} /> 
                            <span>Reply</span> 
                          </button> 

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

                        {rev.repliesCount > 0 && ( 
                          <button 
                            type="button" 
                            onClick={() => setRepliesExpanded(!repliesExpanded)} 
                            className="text-xs font-medium text-[#61F1AC] hover:underline cursor-pointer flex items-center gap-1" 
                          > 
                            <span> 
                              {repliesExpanded 
                                ? "Hide replies" 
                                : `View ${rev.repliesCount} replies ⌄`} 
                            </span> 
                          </button> 
                        )} 
                      </div> 
                    )} 

                    {rev.replies && repliesExpanded && rev.source === "community" && ( 
                      <div className="mt-4 pl-11 space-y-3.5 pt-3 border-t border-[#1C1C1C]/40"> 
                        {rev.replies.map((reply) => ( 
                          <div key={reply.id} className="text-xs"> 
                            <div className="flex items-center gap-2 mb-1"> 
                              <ReviewAvatar 
                                src={reply.avatar} 
                                alt={reply.author} 
                                size="w-5 h-5" 
                              /> 
                              <span className="font-medium text-[#F5F5F5]"> 
                                {reply.author} 
                              </span> 
                              <span className="text-[#7A7A7A]">·</span> 
                              <span className="text-[#7A7A7A]"> 
                                {reply.time} 
                              </span> 
                            </div> 
                            <p className="text-[#B5B5B5] leading-relaxed pl-7"> 
                              {reply.content} 
                            </p> 
                          </div> 
                        ))} 
                      </div> 
                    )} 
                  </article> 
                ); 
              })} 
            </div> 

            <div className="flex justify-center mt-10"> 
              {visibleReviews < sortedReviews.length && ( 
                <Button 
                  variant="mintGhost" 
                  size="md" 
                  className="px-6 py-2 rounded-full text-xs font-medium" 
                  onClick={() => setVisibleReviews((prev) => prev + 4)} 
                > 
                  Load more reviews 
                </Button> 
              )} 
            </div> 
          </div> 
        )} 
/div>
        )}

        {/* ======================================================== */}
        {/* 3.  MEDIA TAB CONTENT                                   */}
        {/* ======================================================== */}
        {activeTab === "Media" && (
          <div className="animate-in fade-in duration-300">
            <MediaItems
              movieData={{
                ...movieData,
                images: mediaData.images?.backdrops?.length || mediaData.images?.posters?.length ? mediaData.images : movieData.images,
                videos: mediaData.videos?.results?.length ? mediaData.videos : movieData.videos,
              }}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. DETAILS TAB CONTENT                                   */}
        {/* ======================================================== */}
        {activeTab === "Details" && (
          <div className="max-w-[720px] mx-auto animate-in fade-in duration-300">
            <h2 className="text-xl font-light text-[#F5F5F5] tracking-tight mb-6">
              Production &amp; Technical Specifications
            </h2>
            <div className="divide-y divide-[#1C1C1C] text-sm"> 
              <div className="py-3 flex justify-between"> 
                <span className="text-[#7A7A7A]">Director</span> 
                <span className="text-[#F5F5F5]"> 
                  {movieData.details?.director || "Christopher Nolan"} 
                </span> 
              </div> 
              <div className="py-3 flex justify-between"> 
                <span className="text-[#7A7A7A]">Writers</span> 
                <span className="text-[#F5F5F5]"> 
                  {movieData.details?.writers || "Jonathan Nolan, Christopher Nolan"} 
                </span> 
              </div> 
              <div className="py-3 flex justify-between"> 
                <span className="text-[#7A7A7A]">Original Score</span> 
                <span className="text-[#F5F5F5]"> 
                  {movieData.details?.music || "Hans Zimmer"} 
                </span> 
              </div> 
              <div className="py-3 flex justify-between"> 
                <span className="text-[#7A7A7A]">Cinematography</span> 
                <span className="text-[#F5F5F5]"> 
                  {movieData.details?.cinematography || "Hoyte van Hoytema"} 
                </span> 
              </div> 
              <div className="py-3 flex justify-between"> 
                <span className="text-[#7A7A7A]">Box Office</span> 
                <span className="text-[#F5F5F5] font-tabular"> 
                  {movieData.details?.boxOffice || "$701.7M USD"} 
                </span> 
              </div> 
              <div className="py-3 flex justify-between"> 
                <span className="text-[#7A7A7A]">Aspect Ratio</span> 
                <span className="text-[#F5F5F5] font-tabular"> 
                  {movieData.details?.aspectRatio || "2.39:1 (Widescreen)"} 
                </span> 
              </div> 
              <div className="py-3 flex justify-between"> 
                <span className="text-[#7A7A7A]">Studio</span> 
                <span className="text-[#F5F5F5]"> 
                  {movieData.details?.studio || "Syncopy, Lynda Obst Productions"} 
                </span> 
              </div> 
            </div> 
          </div>
        )} 
      </main> 

      {reportModalOpen && ( 
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"> 
          <div className="w-full max-w-sm bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-6 text-[#F5F5F5]"> 
            <div className="flex items-center justify-between mb-3"> 
              <h2 className="text-base font-bold text-[#F5F5F5]">Report Review</h2> 
              <button 
                type="button" 
                onClick={() => setReportModalOpen(false)} 
                className="text-[#7A7A7A] hover:text-white cursor-pointer" 
              > 
                <X size={16} /> 
              </button> 
            </div> 
            <p className="text-xs text-[#B5B5B5] mb-4"> 
              Help us keep the community safe. Why are you reporting this review? 
            </p> 
            <textarea 
              value={reportReason} 
              onChange={(e) => setReportReason(e.target.value)} 
              placeholder="Provide reason (e.g. spam, spoiler, abusive)..." 
              rows={3} 
              className="w-full bg-[#141414] border border-[#222222] focus:border-[#61F1AC]/60 rounded-lg p-2.5 text-xs text-[#F5F5F5] placeholder-[#666666] outline-none mb-4 resize-none" 
            /> 
            <div className="flex justify-end gap-2"> 
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isSubmittingReport} 
                onClick={() => setReportModalOpen(false)} 
                className="px-3 py-1.5 text-xs cursor-pointer" 
              > 
                <span>Cancel</span> 
              </Button> 
              <Button 
                variant="primary" 
                size="sm" 
                disabled={isSubmittingReport || !reportReason.trim()} 
                onClick={handleSubmitReport} 
                className="px-3.5 py-1.5 text-xs font-semibold cursor-pointer" 
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
