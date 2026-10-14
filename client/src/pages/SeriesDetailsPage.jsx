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
} from "lucide-react";
import api from "../services/api";
import { getSeriesDetails, getSeasonEpisodes } from "../services/tmdb";
import { ScoreRing } from "../components/ui/ScoreRing";
import { Button } from "../components/ui/Button";
import { StarRating } from "../components/ui/StarRating";
import MediaItems from "../components/ui/MediaItems";
import { CastCarousel } from "../components/ui/CastCarousel";

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

export function SeriesDetailsPage({
  initialTab = "Episodes",
  initialCropHero = false,
}) {
  const location = useLocation();
  const { id } = useParams();
  const isReviewsUrl = location.pathname.includes("/reviews");

  const [seriesData, setSeriesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTabOverride, setSelectedTabOverride] = useState(null);
  const [cropHeroOverride, setCropHeroOverride] = useState(null);

  // Episodes & Seasons state
  const [selectedSeason, setSelectedSeason] = useState("Season 1");
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [episodesList, setEpisodesList] = useState([]);
  const [hoveredEpisodeIndex, setHoveredEpisodeIndex] = useState(0);
  const [episodeRatings, setEpisodeRatings] = useState({});

  // Synopsis expansion state
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const synopsisRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Reviews state
  const [newThought, setNewThought] = useState("");
  const [selectedStars, setSelectedStars] = useState(0);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Top");
  const [likedReviews, setLikedReviews] = useState({});
  const [visibleReviews, setVisibleReviews] = useState(4);
  const [inCollection, setInCollection] = useState(false); 
  const [collectionLoading, setCollectionLoading] = useState(false); 

  useEffect(() => { 
    if (!seriesData || !id) return; 
    let mounted = true; 
    async function loadCollectionStatus() { 
      try { 
        const colRes = await api.get(`/collections/check/tmdb/${id}`); 
        if (mounted && colRes?.success) { 
          setInCollection(!!colRes.data?.inCollection); 
        } 
      } catch (err) { 
        console.error("Failed to load series collection status:", err); 
      } 
    } 
    loadCollectionStatus(); 
    return () => { 
      mounted = false; 
    }; 
  }, [seriesData, id]); 

  const handleToggleCollection = async () => { 
    if (!seriesData) return; 
    const token = localStorage.getItem("orgi_session"); 
    if (!token) { 
      alert("Please sign in to add items to your collection."); 
      return; 
    } 

    setCollectionLoading(true); 
    try { 
      const res = await api.post("/collections/toggle", { 
        external_id: String(id), 
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
      alert(err.message || "Failed to update collection."); 
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
          if (data.episodes && data.episodes.length > 0) {
            setEpisodesList(data.episodes);
          }
          if (data.seasons && data.seasons.length > 0) {
            setSelectedSeason(data.seasons[0]);
          }
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

  const handleSeasonChange = async (season) => {
    setSelectedSeason(season);
    setSeasonDropdownOpen(false);

    const seasonNum = parseInt(season.replace("Season ", ""), 10) || 1;
    const seriesTmdbId = seriesData?.tmdbId || id;

    try {
      const liveEps = await getSeasonEpisodes(seriesTmdbId, seasonNum);
      if (liveEps && liveEps.length > 0) {
        setEpisodesList(liveEps);
      }
    } catch (err) {
      console.warn("Could not load season episodes:", err);
    }
  };

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

  const displaySynopsis = seriesData?.synopsis || "";

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

  const handleRateEpisode = (epNumber, rating) => {
    setEpisodeRatings((prev) => ({
      ...prev,
      [epNumber]: prev[epNumber] === rating ? 0 : rating,
    }));
  };

  const sortedReviews = [...(seriesData?.reviews || [])].sort((a, b) => {
    switch (sortBy) {
      case "Top":
        return (b.likes || 0) - (a.likes || 0);
      case "Newest":
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case "Highest Rated":
        return (b.score || 0) - (a.score || 0);
      case "Lowest Rated":
        return (a.score || 0) - (b.score || 0);
      default:
        return 0;
    }
  });

  const seasonsList =
    seriesData?.seasons && seriesData.seasons.length > 0
      ? seriesData.seasons
      : ["Season 1", "Season 2", "Season 3", "Season 4", "Season 5"];

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

        {/* Hero Content: Two-column layout with 120px side margins */}
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

            {/* Muted meta line "2008–2013 · Crime, Drama · 5 seasons · 62 episodes" */}
            <div className="text-sm text-[#7A7A7A] font-normal tracking-normal mb-8 flex flex-wrap items-center gap-2">
              <span>{seriesData.year}</span>
              <span>·</span>
              <span>{seriesData.genres}</span>
              <span>·</span>
              <span>{seriesData.seasonsCount}</span>
              <span>·</span>
              <span>{seriesData.episodesCount}</span>
            </div>

            {/* Row with two circular score rings */}
            <div className="flex items-center gap-8 mb-8 pb-8 border-b border-[#1C1C1C]">
              {/* Community rating with mint ring */}
              <div className="flex items-center gap-4">
                <ScoreRing
                  score={parseFloat(seriesData.communityRating) || 9.5}
                  color="#61F1AC"
                  size={64}
                  strokeWidth={4.5}
                />
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7A7A] mb-0.5">
                    Community Rating
                  </span>
                  <span className="text-xs text-[#B5B5B5] font-light">
                    {seriesData.communityVotes}
                  </span>
                </div>
              </div>

              {/* TMDB score ring */}
              <div className="flex items-center gap-4 border-l border-[#1C1C1C] pl-8">
                <ScoreRing
                  score={parseFloat(seriesData.tmdbRating) || 8.9}
                  color="#B5B5B5"
                  size={64}
                  strokeWidth={4.5}
                />
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7A7A] mb-0.5">
                    TMDB Rating
                  </span>
                  <span className="text-xs text-[#B5B5B5] font-light">
                    {seriesData.tmdbVotes}
                  </span>
                </div>
              </div>
            </div>

            {/* Row of actions: Mint primary button "Rate this", secondary "Add to list", round Share button */}
            <div className="flex items-center gap-3 mb-8">
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
      </section>

      {/* BELOW THE HERO: Minimal horizontal tab switcher */}
      <div
        ref={contentRef}
        className="sticky top-16 z-30 bg-[#000000]/95 backdrop-blur-md border-b border-[#1C1C1C]"
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] flex items-center justify-between">
          <div className="flex items-center gap-8 h-12">
            {["Episodes", "Cast", "Reviews", "Media", "Details"].map((tab) => {
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
        {/* ======================================================== */}
        {/* 1. EPISODES TAB CONTENT WITH EPISODE RATING              */}
        {/* ======================================================== */}
        {activeTab === "Episodes" && (
          <div className="animate-in fade-in duration-300 max-w-4xl">
            {/* Minimal season selector dropdown chip "Season 1 ⌄" */}
            <div className="flex items-center justify-between mb-8">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#F5F5F5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 transition-colors cursor-pointer"
                >
                  <span>{selectedSeason}</span>
                  <ChevronDown
                    size={13}
                    className={`text-[#7A7A7A] transition-transform ${
                      seasonDropdownOpen ? "rotate-180 text-[#61F1AC]" : ""
                    }`}
                  />
                </button>

                {seasonDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-36 bg-[#0B0B0B] border border-[#1C1C1C] rounded-[10px] py-1 shadow-2xl z-30">
                    {seasonsList.map((season) => (
                      <button
                        key={season}
                        type="button"
                        onClick={() => handleSeasonChange(season)}
                        className={`w-full text-left px-3.5 py-2 text-xs transition-colors cursor-pointer ${
                          selectedSeason === season
                            ? "text-[#61F1AC] bg-[#141414] font-medium"
                            : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]"
                        }`}
                      >
                        {season}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-xs text-[#7A7A7A] font-tabular">
                {episodesList.length} episodes · Official Broadcast
              </span>
            </div>

            {/* Clean vertical list of episodes with episode rating */}
            <div className="flex flex-col border-t border-[#1C1C1C]">
              {episodesList.map((ep, idx) => {
                const isHovered = hoveredEpisodeIndex === idx;
                const userRating = episodeRatings[ep.number];

                return (
                  <div
                    key={ep.number}
                    onMouseEnter={() => setHoveredEpisodeIndex(idx)}
                    className={`h-[76px] flex items-center justify-between px-4 border-b border-[#1C1C1C] cursor-pointer transition-all duration-150 ${
                      isHovered
                        ? "bg-[#0B0B0B] border-l-2 border-l-[#61F1AC]"
                        : "hover:bg-[#0B0B0B] border-l-2 border-l-transparent"
                    }`}
                  >
                    {/* Left: episode number, thumbnail, title, description */}
                    <div className="flex items-center gap-4 min-w-0 mr-4">
                      {/* Episode number "01" */}
                      <span className="text-xs font-mono font-medium text-[#7A7A7A] w-6 shrink-0 tabular-nums">
                        {ep.number}
                      </span>

                      {/* 16:9 small thumbnail with 8px radius */}
                      <div className="w-[84px] h-[48px] rounded-[8px] overflow-hidden border border-[#1C1C1C] bg-[#141414] shrink-0">
                        {ep.thumbnail ? (
                          <img
                            src={ep.thumbnail}
                            alt={ep.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#7A7A7A]">
                            EP {ep.number}
                          </div>
                        )}
                      </div>

                      {/* Title & one-line description */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-white">
                          {ep.title}
                        </span>
                        <span className="text-xs text-[#7A7A7A] truncate font-light mt-0.5">
                          {ep.description}
                        </span>
                      </div>
                    </div>

                    {/* Right: Runtime + Episode Rating */}
                    <div className="flex items-center gap-6 shrink-0">
                      <span className="text-xs text-[#7A7A7A] font-tabular hidden sm:inline">
                        {ep.runtime}
                      </span>

                      {/* Episode Rating: TMDB / Average score badge + Interactive user rating */}
                      <div className="flex items-center gap-3">
                        {/* Average episode rating badge */}
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141414] border border-[#1C1C1C] text-xs font-tabular font-medium text-[#61F1AC]"
                          title={`Episode Rating: ${ep.score}`}
                        >
                          <Star size={12} className="fill-[#61F1AC] text-[#61F1AC]" />
                          <span>{ep.score || "—"}</span>
                        </div>

                        {/* Interactive Episode Star Rating (allows users to rate this specific episode) */}
                        <div
                          className="hidden sm:flex items-center gap-0.5"
                          title={userRating ? `Your rating: ${userRating}/5` : "Rate this episode"}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {[1, 2, 3, 4, 5].map((starVal) => {
                            const isFilled = userRating && userRating >= starVal;
                            return (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => handleRateEpisode(ep.number, starVal)}
                                className="p-0.5 text-[#333333] hover:text-[#61F1AC] transition-colors cursor-pointer"
                              >
                                <Star
                                  size={11}
                                  className={
                                    isFilled
                                      ? "fill-[#61F1AC] text-[#61F1AC]"
                                      : "fill-transparent hover:fill-[#61F1AC]/50"
                                  }
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
          <div className="max-w-[720px] mx-auto animate-in fade-in duration-300">
            {/* COMPOSER CARD */}
            <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-[16px] p-5 mb-8 shadow-sm">
              <div className="flex items-start gap-3.5 mb-4">
                <ReviewAvatar
                  src={NAVBAR_AVATAR}
                  alt="User Avatar"
                  size="w-9 h-9"
                />
                <textarea
                  value={newThought}
                  onChange={(e) => setNewThought(e.target.value)}
                  placeholder="Add a thought…"
                  rows={3}
                  className="w-full bg-transparent text-[#F5F5F5] placeholder-[#7A7A7A] text-sm resize-none focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1C1C1C]/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#7A7A7A] mr-1">Your rating:</span>
                  <StarRating
                    rating={selectedStars}
                    onRate={setSelectedStars}
                    size={16}
                  />
                </div>

                <Button
                  variant="mint"
                  size="sm"
                  disabled={!newThought.trim()}
                  onClick={() => {
                    alert("Thought posted!");
                    setNewThought("");
                    setSelectedStars(0);
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs"
                >
                  Post
                </Button>
              </div>
            </div>

            {/* THIN ROW: Sort */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1C1C1C]">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7A7A]">
                {seriesData.communityVotes}
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
                          className={`w-full text-left px-3.5 py-1.5 text-xs transition-colors ${
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

            {/* REVIEW LIST */}
            <div className="flex flex-col divide-y divide-[#1C1C1C]">
              {sortedReviews.slice(0, visibleReviews).map((rev) => {
                const isLiked = likedReviews[rev.id];
                const likeCount = rev.likes + (isLiked ? 1 : 0);

                return (
                  <article key={rev.id} className="py-6 first:pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <ReviewAvatar
                          src={rev.avatar}
                          alt={rev.author}
                          size="w-8 h-8"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#F5F5F5]">
                            {rev.author}
                          </span>
                          <span className="text-[11px] text-[#7A7A7A]">
                            {rev.time}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-[#61F1AC] font-medium font-tabular">
                        <Star size={12} className="fill-[#61F1AC]" />
                        <span>{rev.score}</span>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-[#D0D0D0] mb-4 font-light">
                      {rev.content}
                    </p>

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

                        <button
                          type="button"
                          className="hover:text-[#F5F5F5] transition-colors cursor-pointer p-0.5"
                        >
                          <MoreHorizontal size={14} />
                        </button>
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
                  </article>
                );
              })}
            </div>

            {/* Load more */}
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
    </div>
  );
}
