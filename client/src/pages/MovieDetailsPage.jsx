import React, { useState, useRef, useEffect } from "react";
import { useLocation, useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  Plus,
  Check,
  Share2,
  ChevronDown,
  ThumbsUp,
  Reply,
  MoreHorizontal,
  X,
  Play,
  Bookmark,
} from "lucide-react";
import { getMovieDetails, getMovieMedia, getMediaVideos, findTrailerKey } from "../services/tmdb";
import { DetailScoreRings } from "../components/ui/DetailScoreRings";
import { Button } from "../components/ui/Button";
import { MediaReviewsTab } from "../components/reviews/MediaReviewsTab";
import MediaItems from "../components/ui/MediaItems";
import Trailer from "../components/ui/Trailer";
import { fetchMediaDetails, fetchMediaVerdict } from "../services/mediaApi"; 
import { AiVerdictHero } from "../components/ui/AiVerdictHero"; 
import { AiVerdictSkeleton } from "../components/ui/AiVerdictSkeleton"; 
import { CastCarousel } from "../components/ui/CastCarousel"; 
import { useAuth } from "../context/AuthContext"; 
import { useToast } from "../context/ToastContext"; 
import { isGuestInCollection, toggleGuestCollection } from "../utils/guestCollection"; 
import api from "../services/api"; 
import OverviewTab from "../components/ui/OverviewTab";



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
  initialTab = "Overview",
  initialCropHero = false,
}) {
  const location = useLocation(); 
  const navigate = useNavigate(); 
  const { showToast, openAuthModal } = useToast(); 
  const { category, id } = useParams(); 
  const { user, userProfile } = useAuth(); 
  const isReviewsUrl = location.pathname.includes("/reviews"); 
  
  const currentUserAvatar = userProfile?.profile_url || user?.user_metadata?.avatar_url || NAVBAR_AVATAR; 
  const [movieData, setMovieData] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTabOverride, setSelectedTabOverride] = useState(null);
  const [cropHeroOverride, setCropHeroOverride] = useState(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [activeTrailerKey, setActiveTrailerKey] = useState(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  
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

  const [verdictData, setVerdictData] = useState(null); 
  const [verdictStatus, setVerdictStatus] = useState("loading"); 

  useEffect(() => { 
    if (!movieData) return; 

    let mounted = true; 
    setVerdictStatus("loading"); 

    async function loadVerdict() { 
      const startTime = Date.now(); 
      try { 
        const provider = category 
          ? (category === "manga" || category === "manhwa" || category === "manhua" ? "mangadex" : "openlibrary") 
          : "tmdb"; 
        const targetExternalId = String(category ? id : (id || 157336)); 
        const res = await fetchMediaVerdict({ 
          provider, 
          id: targetExternalId, 
          title: movieData.title, 
          type: movieData.type || category || "movie", 
          genres: movieData.genres, 
          year: movieData.year, 
          synopsis: movieData.synopsis, 
        }); 

        const elapsed = Date.now() - startTime; 
        if (elapsed < 2500) { 
          await new Promise((resolve) => setTimeout(resolve, 2500 - elapsed)); 
        } 

        if (mounted) { 
          if (res?.success && res.data) { 
            setVerdictData(res.data); 
            setVerdictStatus("success"); 
          } else { 
            setVerdictStatus("fallback"); 
          } 
        } 
      } catch { 
        const elapsed = Date.now() - startTime; 
        if (elapsed < 2500) { 
          await new Promise((resolve) => setTimeout(resolve, 2500 - elapsed)); 
        } 
        if (mounted) { 
          setVerdictStatus("fallback"); 
        } 
      } 
    } 

    loadVerdict(); 

    return () => { 
      mounted = false; 
    }; 
  }, [movieData, category, id]); 
  
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
  
  
  const searchParams = new URLSearchParams(location.search); 
  const isReviewsParam = searchParams.get("tab")?.toLowerCase() === "reviews"; 
  const shouldOpenReviews = isReviewsUrl || isReviewsParam; 
  
  const activeTab = 
    selectedTabOverride !== null 
      ? selectedTabOverride 
      : shouldOpenReviews 
        ? "Reviews" 
        : initialTab; 
  
  const cropHero = 
    cropHeroOverride !== null 
      ? cropHeroOverride 
      : shouldOpenReviews 
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

  const handlePlayTrailer = async () => { 
    const immediateKey = activeTrailerKey || findTrailerKey(mediaData?.videos) || findTrailerKey(movieData?.videos); 
    if (immediateKey) { 
      setActiveTrailerKey(immediateKey); 
      setShowTrailerModal(true); 
      return; 
    } 

    setIsLoadingTrailer(true); 
    try { 
      const targetId = id || 157336; 
      const fetchedVideos = await getMediaVideos(targetId, "movie"); 
      const fetchedKey = findTrailerKey(fetchedVideos); 
      if (fetchedKey) { 
        setActiveTrailerKey(fetchedKey); 
        setShowTrailerModal(true); 
      } else { 
        showToast({ message: "No official trailer available for this movie." }); 
      } 
    } catch { 
      showToast({ message: "Unable to load trailer right now." }); 
    } finally { 
      setIsLoadingTrailer(false); 
    } 
  }; 
  
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
  const [inCollection, setInCollection] = useState(false); 
  const [collectionLoading, setCollectionLoading] = useState(false); 
  const [communityData, setCommunityData] = useState({ 
    communityAverage: null, 
    communityVotes: 0, 
    reviews: [], 
  }); 
 
  useEffect(() => { 
    if (!movieData) return; 
    const currentProvider = category 
      ? (category === "manga" || category === "manhwa" || category === "manhua" ? "mangadex" : "openlibrary") 
      : "tmdb"; 
    const currentExternalId = String(category ? id : (id || 157336)); 
 
    let mounted = true; 
    async function loadCollectionAndReviews() { 
      try { 
        const token = localStorage.getItem("orgi_session"); 
        if (!token) { 
          if (mounted) { 
            setInCollection(isGuestInCollection(currentProvider, currentExternalId)); 
          } 
        } 
 
        const [colRes, revRes] = await Promise.allSettled([ 
          token ? api.get(`/collections/check/${currentProvider}/${currentExternalId}`) : Promise.resolve(null), 
          api.get(`/reviews/${currentProvider}/${currentExternalId}`), 
        ]); 
 
        if (mounted) { 
          if (colRes.status === "fulfilled" && colRes.value?.success) { 
            setInCollection(!!colRes.value.data?.inCollection); 
          } 
          if (revRes.status === "fulfilled" && revRes.value?.success) { 
            const revData = revRes.value.data || {}; 
            const reviewsList = Array.isArray(revData.reviews) ? revData.reviews : []; 
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
    const currentProvider = category 
      ? (category === "manga" || category === "manhwa" || category === "manhua" ? "mangadex" : "openlibrary") 
      : "tmdb"; 
    const currentExternalId = String(category ? id : (id || 157336)); 
    const currentType = category ? category.toUpperCase() : "MOVIE"; 
    const token = localStorage.getItem("orgi_session"); 

    if (!token) { 
      const nextInCol = toggleGuestCollection({ 
        external_id: currentExternalId, 
        provider: currentProvider, 
        type: currentType, 
        title: movieData.title, 
        cover_url: movieData.poster || movieData.backdrop, 
      }); 
      setInCollection(nextInCol); 
      showToast({ 
        message: nextInCol ? "Added to local collection." : "Removed from local collection.", 
        actionText: "Sign In to Sync", 
        onAction: openAuthModal, 
      }); 
      return; 
    } 
 
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
      showToast({ message: err.message || "Failed to update collection." }); 
    } finally { 
      setCollectionLoading(false); 
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
 
  const contentRef = useRef(null); 
 
  const handleTabChange = (tab) => { 
    setSelectedTabOverride(tab); 
    setCropHeroOverride(false); 
  }; 
 
  
  if (isLoading) {
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

  if (!movieData) {
    return (
      <div className="min-h-[70vh] bg-[#000000] text-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-xl font-bold mb-2">Title Not Found</div>
        <p className="text-sm text-[#7A7A7A] mb-6 max-w-md">We could not load details for this title. It might have been moved or is unavailable in our database.</p>
        <Link to="/" className="px-5 py-2.5 rounded-full bg-[#61F1AC] text-black font-semibold text-xs">
          Return Home
        </Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-24">
      {/* HERO SECTION */}
      <section 
        className={`relative w-full overflow-hidden transition-all duration-500 ${ 
          cropHero ? "h-[220px] md:h-[280px]" : "min-h-[580px] lg:min-h-[660px] pb-6" 
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
        
        {verdictStatus === "success" && verdictData ? ( 
          <div 
            className={`relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[120px] pt-10 pb-8 transition-transform duration-500 ${ 
              cropHero 
                ? "-translate-y-48 opacity-100 pointer-events-none" 
                : "translate-y-0 opacity-100" 
            }`} 
          > 
            <AiVerdictHero 
              movieData={movieData} 
              verdictData={verdictData} 
              blendedScore={blendedScore} 
              totalVotesLabel={totalVotesLabel} 
              inCollection={inCollection} 
              collectionLoading={collectionLoading} 
              onToggleCollection={handleToggleCollection} 
              onPlayTrailer={handlePlayTrailer} 
              isLoadingTrailer={isLoadingTrailer} 
              onOpenReviews={() => handleTabChange("Reviews")} 
              onShare={() => { 
                navigator.clipboard?.writeText(window.location.href); 
                showToast({ message: "Link copied to clipboard." }); 
              }} 
              category={category} 
            /> 
          </div> 
        ) : verdictStatus === "loading" ? ( 
          <AiVerdictSkeleton 
            movieData={movieData} 
            cropHero={cropHero} 
            category={category} 
          /> 
        ) : ( 
          <div 
            className={`relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[120px] pt-10 pb-8 flex items-start gap-12 transition-transform duration-500 ${ 
              cropHero 
                ? "-translate-y-48 opacity-100 pointer-events-none" 
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
            
            <DetailScoreRings 
              blendedScore={blendedScore} 
              totalVotesLabel={totalVotesLabel} 
              communityScore={communityScore !== null ? communityScore : movieData.communityRating} 
            /> 

            {category ? ( 
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
                    showToast({ message: "Link copied to clipboard." }); 
                  }} 
                  className="w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#61F1AC]/50 hover:bg-[#141414] transition-colors cursor-pointer" 
                > 
                  <Share2 size={15} /> 
                </button> 
              </div> 
            ) : ( 
              <div className="flex items-center gap-3.5 mb-8"> 
                <Button 
                  variant="primary" 
                  size="md" 
                  disabled={isLoadingTrailer} 
                  className="px-5 py-2.5 rounded-[10px]" 
                  onClick={handlePlayTrailer} 
                > 
                  <Play size={15} className="fill-black text-black" /> 
                  <span>{isLoadingTrailer ? "Loading..." : "Trailer"}</span> 
                </Button> 

                <Button 
                  variant="outline" 
                  size="md" 
                  className="px-5 py-2.5 rounded-[10px] transition-all cursor-pointer hover:border-[#61F1AC]/50 hover:text-white" 
                  onClick={() => { 
                    handleTabChange("Reviews"); 
                  }} 
                > 
                  <Star size={15} className="text-[#61F1AC]" /> 
                  <span>Rate</span> 
                </Button> 

                <button 
                  type="button" 
                  aria-label={inCollection ? "Remove from collection" : "Add to collection"} 
                  disabled={collectionLoading} 
                  onClick={handleToggleCollection} 
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${ 
                    inCollection 
                      ? "border-[#61F1AC]/50 text-[#61F1AC] bg-[#61F1AC]/10" 
                      : "border-[#1C1C1C] text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#61F1AC]/50 hover:bg-[#141414]" 
                  }`} 
                > 
                  <Bookmark size={15} className={inCollection ? "fill-[#61F1AC]" : ""} /> 
                </button> 

                <button 
                  type="button" 
                  aria-label="Share" 
                  onClick={() => { 
                    navigator.clipboard?.writeText(window.location.href); 
                    showToast({ message: "Link copied to clipboard." });  
                  }} 
                  className="w-10 h-10 rounded-full border border-[#1C1C1C] flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#61F1AC]/50 hover:bg-[#141414] transition-colors cursor-pointer" 
                > 
                  <Share2 size={15} /> 
                </button> 
              </div> 
            )} 
            
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
      )} 
      </section> 

      
      {/* BELOW THE HERO: Minimal horizontal tab switcher */}
      <div
        ref={contentRef}
        className="sticky top-16 z-30 bg-[#000000]/95 backdrop-blur-md border-b border-[#1C1C1C]"
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] flex items-center justify-between">
          <div className="flex items-center gap-8 h-12">
            {["Overview", "Cast", "Reviews", "Media", "Details"].map((tab) => {
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
        </div>
      </div>
      
      {/* TAB CONTENT (Only the active tab's content is shown, never all at once) */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-[120px] pt-12">
        {activeTab === "Overview" && (
          <OverviewTab
            id={category ? id : id || 157336}
            category={category}
            mediaType={movieData.type}
            movieData={movieData}
            communityData={communityData}
            onCommunityDataChange={setCommunityData}
            onOpenReviews={() => handleTabChange("Reviews")}
          />
        )}

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
        {activeTab === "Reviews" && (
          <MediaReviewsTab
            mediaId={category ? id : (id || 157336)}
            mediaType={category ? category.toUpperCase() : "MOVIE"}
            mediaTitle={movieData.title}
            coverUrl={movieData.poster || movieData.backdrop}
            provider={
              category
                ? (category === "manga" || category === "manhwa" || category === "manhua" ? "mangadex" : "openlibrary")
                : "tmdb"
            }
            category={category}
            initialProviderReviews={movieData.reviews}
            initialProviderPage={movieData.reviewsPage || 1}
            initialTotalPages={movieData.reviewsTotalPages || 1}
            communityData={communityData}
            onCommunityDataChange={setCommunityData}
          />
        )} 
        
        {activeTab === "Media" && (
          <div className="animate-in fade-in duration-300">
            <MediaItems
              movieData={{
                ...movieData,
                images: mediaData.images?.backdrops?.length || mediaData.images?.posters?.length ? mediaData.images : movieData.images,
                videos: (Array.isArray(mediaData.videos) && mediaData.videos.length > 0)
                  ? mediaData.videos
                  : (mediaData.videos?.results?.length ? mediaData.videos : movieData?.videos),
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
 
      {!category && ( 
        <Trailer 
          open={showTrailerModal} 
          videoKey={activeTrailerKey || findTrailerKey(mediaData?.videos) || findTrailerKey(movieData?.videos)} 
          videoName={`${movieData?.title || "Movie"} Trailer`} 
          onClose={() => setShowTrailerModal(false)} 
        /> 
      )} 
    </div> 
  ); 
} 

