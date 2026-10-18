import React, { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Star,
  Plus,
  Check,
  Share2,
  ThumbsUp,
  Reply,
  MoreHorizontal,
  ChevronDown,
  Play,
  Bookmark,
} from "lucide-react";
import api from "../services/api";
import { getSeriesDetails, getSeasonEpisodes, getMediaVideos, findTrailerKey } from "../services/tmdb"; 
import { DetailScoreRings } from "../components/ui/DetailScoreRings"; 
import { MediaReviewsTab } from "../components/reviews/MediaReviewsTab"; 
import { Button } from "../components/ui/Button"; 
import MediaItems from "../components/ui/MediaItems"; 
import Trailer from "../components/ui/Trailer"; 
import { CastCarousel } from "../components/ui/CastCarousel"; 
import EpisodesSection from "../components/ui/EpisodesSection"; 
import OverviewTab from "../components/ui/OverviewTab"; 
import { useToast } from "../context/ToastContext"; 
import { isGuestInCollection, toggleGuestCollection } from "../utils/guestCollection"; 
import { fetchMediaVerdict } from "../services/mediaApi"; 
import { AiVerdictHero } from "../components/ui/AiVerdictHero"; 
import { AiVerdictSkeleton } from "../components/ui/AiVerdictSkeleton"; 



export function SeriesDetailsPage({
  initialTab = "Overview",
  initialCropHero = false,
}) {
  const location = useLocation();
  const { id } = useParams();
  const { showToast, openAuthModal } = useToast(); 
  const isReviewsUrl = location.pathname.includes("/reviews");
  
  const [seriesData, setSeriesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTabOverride, setSelectedTabOverride] = useState(null);
  const [cropHeroOverride, setCropHeroOverride] = useState(null);
  
  
  // Synopsis expansion state
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const synopsisRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);
  
  const [communityData, setCommunityData] = useState({ 
    communityAverage: null, 
    communityVotes: 0, 
    reviews: [], 
  }); 
  const [inCollection, setInCollection] = useState(false); 
  const [collectionLoading, setCollectionLoading] = useState(false); 
  const [showTrailerModal, setShowTrailerModal] = useState(false); 
  const [activeTrailerKey, setActiveTrailerKey] = useState(null); 
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false); 
  const [verdictData, setVerdictData] = useState(null); 
  const [verdictStatus, setVerdictStatus] = useState("loading"); 

  useEffect(() => { 
    if (!seriesData || !id) return; 

    let mounted = true; 
    setVerdictStatus("loading"); 

    async function loadVerdict() { 
      const startTime = Date.now(); 
      try { 
        const res = await fetchMediaVerdict({ 
          provider: "tmdb", 
          id: String(id), 
          title: seriesData.title, 
          type: "tv", 
          genres: seriesData.genres, 
          year: seriesData.year, 
          synopsis: seriesData.synopsis, 
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
  }, [seriesData, id]); 
 
  useEffect(() => { 
    if (!seriesData || !id) return; 
    let mounted = true; 
    async function loadCollectionAndReviews() { 
      try { 
        const token = localStorage.getItem("orgi_session"); 
        if (!token) { 
          if (mounted) { 
            setInCollection(isGuestInCollection("tmdb", String(id))); 
          } 
        } 
 
        const [colRes, revRes] = await Promise.allSettled([ 
          token ? api.get(`/collections/check/tmdb/${id}`) : Promise.resolve(null), 
          api.get(`/reviews/tmdb/${id}`), 
        ]); 
 
        if (mounted) { 
          if (colRes.status === "fulfilled" && colRes.value?.success) { 
            setInCollection(!!colRes.value.data?.inCollection); 
          } 
          if (revRes.status === "fulfilled" && revRes.value?.success) { 
            const revData = revRes.value.data || {}; 
            setCommunityData({ 
              communityAverage: typeof revData.communityAverage === "number" ? revData.communityAverage : null, 
              communityVotes: typeof revData.communityVotes === "number" ? revData.communityVotes : 0, 
              reviews: Array.isArray(revData.reviews) ? revData.reviews : [], 
            }); 
          } 
        } 
      } catch (err) { 
        console.error("Failed to load series collection or reviews:", err); 
      } 
    } 
    loadCollectionAndReviews(); 
 
    return () => { 
      mounted = false; 
    }; 
  }, [seriesData, id]); 
 
  const handleToggleCollection = async () => { 
    if (!seriesData) return; 
    const currentExternalId = String(id); 
    const token = localStorage.getItem("orgi_session"); 
    if (!token) { 
      const nextInCol = toggleGuestCollection({ 
        external_id: currentExternalId, 
        provider: "tmdb", 
        type: "SERIES", 
        title: seriesData.title, 
        cover_url: seriesData.poster || seriesData.backdrop, 
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
        provider: "tmdb", 
        type: "SERIES", 
        title: seriesData.title, 
        cover_url: seriesData.poster || seriesData.backdrop, 
      }); 
 
      if (res?.success) { 
        setInCollection(!!res.data?.inCollection); 
      } 
    } catch (err) { 
      console.error("Failed to toggle series collection:", err); 
      showToast({ message: err.message || "Failed to update collection." }); 
    } finally { 
      setCollectionLoading(false); 
    } 
  };
  
  const contentRef = useRef(null);
  
  useEffect(() => {
    let mounted = true;
    async function loadSeries() {
      if (!id) {
        setIsLoading(false);
        setError("Series ID is missing");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await getSeriesDetails(id);
        
        if (mounted && data) {
          setSeriesData(data);
        }
      } catch (err) {
        console.error("Failed to load series details:", err);
        if (mounted) {
          setError(err.message || "Failed to load series");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    
    loadSeries();
    
    return () => {
      mounted = false;
    };
  }, [id]);
  
  
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
  
  const displaySynopsis = seriesData?.synopsis || ""; 
 
  const handlePlayTrailer = async () => { 
    const immediateKey = activeTrailerKey || findTrailerKey(seriesData?.videos); 
    if (immediateKey) { 
      setActiveTrailerKey(immediateKey); 
      setShowTrailerModal(true); 
      return; 
    } 

    setIsLoadingTrailer(true); 
    try { 
      const fetchedVideos = await getMediaVideos(id, "tv"); 
      const fetchedKey = findTrailerKey(fetchedVideos); 
      if (fetchedKey) { 
        setActiveTrailerKey(fetchedKey); 
        setShowTrailerModal(true); 
      } else { 
        showToast({ message: "No official trailer available for this series." }); 
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
        // 5rem is 80px. If content is taller than 80px, it overflows and requires a See more button
        setHasOverflow(height > 80);
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [displaySynopsis]);
  
  const handleTabChange = (tab) => {
    setSelectedTabOverride(tab);
    setCropHeroOverride(false);
  };
  
  const toggleLike = (reviewId) => {
    setLikedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };
  
  
  if (error && !seriesData) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#000000] text-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-medium mb-2 text-[#F5F5F5]">Series Not Found</h2>
        <p className="text-sm text-[#7A7A7A] max-w-md mb-6">{error || "Could not find the requested TV series."}</p>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded-full text-xs font-medium text-[#000000] bg-[#61F1AC] hover:bg-[#61F1AC]/90 transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  if (isLoading || !seriesData) {
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
  
  const providerScore = parseFloat(seriesData?.tmdbRating) || 0; 
  const providerVotesCount = 
    typeof seriesData?.tmdbVotes === "string" && (seriesData.tmdbVotes.includes("K") || seriesData.tmdbVotes.includes("k")) 
      ? parseFloat(seriesData.tmdbVotes) * 1000 
      : parseInt(seriesData?.tmdbVotes, 10) || 100; 

  const communityScore = communityData?.communityAverage ?? null; 
  const communityVotesCount = communityData?.communityVotes || 0; 

  let blendedScore = providerScore; 
  let totalVotesLabel = seriesData?.tmdbVotes; 

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

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-24">
      {/* HERO SECTION */}
      <section
        className={`relative w-full overflow-hidden transition-all duration-500 ${
          cropHero ? "h-[220px] md:h-[280px]" : "min-h-[580px] lg:min-h-[640px]"
        }`}
      >
        {/* Full-width dark cinematic backdrop image heavily darkened with black gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={seriesData.backdrop}
            alt={seriesData.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-40 scale-105"
          />
          {/* Radial mint aura (3.5%) */}
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
              movieData={seriesData} 
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
              category="series" 
            /> 
          </div> 
        ) : verdictStatus === "loading" ? ( 
          <AiVerdictSkeleton 
            movieData={seriesData} 
            cropHero={cropHero} 
            category="series" 
          /> 
        ) : ( 
          <div 
            className={`relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[120px] pt-12 pb-16 flex flex-col md:flex-row gap-12 lg:gap-16 items-start transition-opacity duration-300 ${ 
              cropHero ? "opacity-0 pointer-events-none" : "opacity-100" 
            }`} 
          >
          {/* LEFT: Poster column */}
          <div className="shrink-0 w-[240px] md:w-[280px] lg:w-[320px] hidden md:block">
            <div className="aspect-[2/3] w-full rounded-[16px] overflow-hidden border border-[#1C1C1C] shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative group bg-[#0A0A0A]">
              <img
                src={seriesData.poster}
                alt={seriesData.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 border border-white/5 rounded-[16px] pointer-events-none" />
            </div>
            
            {/* Poster Caption / Metadata */}
            <div className="mt-3.5 flex flex-col gap-1 text-center">
              <span className="text-xs text-[#7A7A7A] font-light">
                {seriesData.title} Official TMDB Poster
              </span>
              <span className="text-[11px] text-[#4A4A4A]">
                {seriesData.details?.originalAirDates || seriesData.year}
              </span>
            </div>
          </div>
          
          {/* RIGHT: Meta, Title, Scores, Buttons, Synopsis */}
          <div className="flex-1 flex flex-col pt-2 min-w-0">
            {/* Small muted uppercase label "SERIES" */}
            <div className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#7A7A7A] mb-3">
              SERIES
            </div>
            
            {/* Huge clean title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#F5F5F5] mb-3">
              {seriesData.title}
            </h1>
            
            <div className="text-sm text-[#7A7A7A] font-normal tracking-normal mb-4 flex items-center gap-2">
              <span className="shrink-0 rounded-full border border-white/30 px-4 py-2 font-medium leading-6 text-white transition-all duration-200 hover:border-[#61F1AC]/40 hover:bg-white/10">
                {seriesData.genres}
              </span>
            </div>
            
            {/* Muted meta line "2008–2013 · Crime, Drama · 5 seasons · 62 episodes" */}
            <div className="text-sm text-[#7A7A7A] font-normal tracking-normal mb-8 mx-2 flex flex-wrap items-center gap-2">
              <span>{seriesData.year}</span>
              <span>·</span>
              <span>{seriesData.seasonsCount}</span>
              <span>·</span>
              <span>{seriesData.episodesCount}</span>
            </div>
            
            {/* Row with two circular score rings */}
            <DetailScoreRings 
              providerRating={seriesData.tmdbRating} 
              providerVotes={seriesData.tmdbVotes} 
              communityScore={communityData?.communityAverage ?? null} 
              communityVotesCount={communityData?.communityVotes || 0} 
              fallbackCommunityRating={seriesData.communityRating} 
              fallbackCommunityVotes={seriesData.communityVotes} 
            /> 
            
            
            <div className="flex items-center gap-3 mb-8"> 
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
            
            {/* Synopsis: dark blur appears ONLY if there is a See more button */}
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
            {["Overview", "Episodes", "Cast", "Reviews", "Media", "Details"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
                  className={`text-sm tracking-tight transition-colors relative h-full flex items-center cursor-pointer ${
                    isActive
                      ? "text-[#F5F5F5] font-medium"
                      : "text-[#7A7A7A] hover:text-[#B5B5B5]"
                  }`}
                >
                  <span>{tab}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#61F1AC]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* TAB CONTENT */}
      <main className="max-w-[1440px] mx-auto px-6 lg:px-[120px] pt-12">
        {activeTab === "Overview" && ( 
          <OverviewTab 
            id={id} 
            mediaType="SERIES" 
            seriesData={seriesData} 
            communityData={communityData} 
            onCommunityDataChange={setCommunityData} 
            onOpenReviews={() => handleTabChange("Reviews")} 
          /> 
        )} 

        {activeTab === "Episodes" && ( 
          <EpisodesSection 
            seriesId={id} 
            seriesData={seriesData} 
            inCollection={inCollection} 
            onToggleCollection={handleToggleCollection} 
            collectionLoading={collectionLoading} 
          /> 
        )} 
        
        
        {/* ======================================================== */}
        {/* 2. CAST TAB CONTENT                                      */}
        {/* ======================================================== */}
        {activeTab === "Cast" && (
          <div className="animate-in fade-in duration-300">
            <CastCarousel
              title="Cast"
              items={seriesData.cast || []}
              variant="cast"
            />
          </div>
        )}
        
        {/* ======================================================== */}
        {/* 3. REVIEWS TAB CONTENT                                   */}
        {/* ======================================================== */}
        {activeTab === "Reviews" && ( 
          <MediaReviewsTab 
            mediaId={id} 
            mediaType="SERIES" 
            mediaTitle={seriesData.title} 
            coverUrl={seriesData.poster || seriesData.backdrop} 
            provider="tmdb" 
            initialProviderReviews={seriesData.reviews} 
            initialProviderPage={seriesData.reviewsPage || 1} 
            initialTotalPages={seriesData.reviewsTotalPages || 1} 
            communityData={communityData} 
            onCommunityDataChange={setCommunityData} 
          /> 
        )} 
        
        
        {/* ======================================================== */}
        {/* 4. MEDIA TAB CONTENT                                     */}
        {/* ======================================================== */}
        {activeTab === "Media" && (
          <div className="animate-in fade-in duration-300">
            <MediaItems seriesData={seriesData} />
          </div>
        )}
        
        {/* ======================================================== */}
        {/* 5. DETAILS TAB CONTENT                                   */}
        {/* ======================================================== */}
        {activeTab === "Details" && (
          <div className="max-w-[720px] mx-auto animate-in fade-in duration-300">
            <h2 className="text-xl font-light text-[#F5F5F5] tracking-tight mb-6">
              Production &amp; Technical Specifications
            </h2>
            <div className="divide-y divide-[#1C1C1C] text-sm">
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Creator</span>
                <span className="text-[#F5F5F5]">
                  {seriesData.details?.creator || "—"}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Writers</span>
                <span className="text-[#F5F5F5]">
                  {seriesData.details?.writers || "—"}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Network</span>
                <span className="text-[#F5F5F5]">
                  {seriesData.details?.network || "—"}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Original Air Dates</span>
                <span className="text-[#F5F5F5]">
                  {seriesData.details?.originalAirDates || seriesData.year}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Studio</span>
                <span className="text-[#F5F5F5]">
                  {seriesData.details?.studio || "—"}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Genres</span>
                <span className="text-[#F5F5F5]">
                  {seriesData.genres || "Drama"}
                </span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Seasons / Episodes</span>
                <span className="text-[#F5F5F5]">
                  {seriesData.seasonsCount} · {seriesData.episodesCount}
                </span>
              </div>
            </div>
          </div>
        )}
      </main> 
 
      <Trailer 
        open={showTrailerModal} 
        videoKey={activeTrailerKey || findTrailerKey(seriesData?.videos)} 
        videoName={`${seriesData?.title || "Series"} Trailer`} 
        onClose={() => setShowTrailerModal(false)} 
      /> 
    </div> 
  ); 
} 
