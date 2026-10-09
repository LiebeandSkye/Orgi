import React, { useState, useEffect } from "react";
import { Star, Plus, Share2, ChevronDown, ThumbsUp, Reply, MoreHorizontal } from "lucide-react";
import { BREAKING_BAD_DATA } from "../data/mockData";
import { getSeriesDetails, getSeasonEpisodes } from "../services/tmdb";
import { ScoreRing } from "../components/ui/ScoreRing";
import { Button } from "../components/ui/Button";
import { StarRating } from "../components/ui/StarRating";

export function BreakingBadPage() {
  const [seriesData, setSeriesData] = useState(BREAKING_BAD_DATA);
  const [activeTab, setActiveTab] = useState("Episodes");
  const [selectedSeason, setSelectedSeason] = useState("Season 1");
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [hoveredEpisodeIndex, setHoveredEpisodeIndex] = useState(0); // Row 0 shows hover state by default as requested
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [episodesList, setEpisodesList] = useState(BREAKING_BAD_DATA.episodes);
  const [newThought, setNewThought] = useState("");
  const [selectedStars, setSelectedStars] = useState(0);
  const [likedReviews, setLikedReviews] = useState({});

  const seasonsList = ["Season 1", "Season 2", "Season 3", "Season 4", "Season 5"];

  useEffect(() => {
    let mounted = true;
    async function loadTmdbSeries() {
      try {
        const live = await getSeriesDetails(1396);
        if (mounted && live) {
          setSeriesData((prev) => ({
            ...prev,
            ...live,
            details: live.details || prev.details,
            cast: live.cast || prev.cast,
            reviews: live.reviews || prev.reviews
          }));
          if (live.episodes && live.episodes.length > 0) {
            setEpisodesList(live.episodes);
          }
        }
      } catch {
        // Fall back to curated data
      }
    }
    loadTmdbSeries();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSeasonChange = async (season) => {
    setSelectedSeason(season);
    setSeasonDropdownOpen(false);
    const seasonNum = parseInt(season.replace("Season ", ""), 10) || 1;
    try {
      const liveEps = await getSeasonEpisodes(1396, seasonNum);
      if (liveEps && liveEps.length > 0) {
        setEpisodesList(liveEps);
      }
    } catch {
      // Keep existing
    }
  };

  const toggleLike = (reviewId) => {
    setLikedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-24 select-none">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden min-h-[580px] lg:min-h-[640px]">
        {/* Full-width dark cinematic backdrop image */}
        <div className="absolute inset-0 z-0">
          <img
            src={seriesData.backdrop}
            alt="Breaking Bad Backdrop"
            className="w-full h-full object-cover object-center opacity-30 scale-105"
          />
          {/* Faint 5% radial mint aura */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#61F1AC] opacity-[0.035] blur-[140px] pointer-events-none rounded-full" />
          {/* Black gradient overlay fading to pure #000 at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/80 via-transparent to-[#000000]/80" />
        </div>

        {/* Hero Content: Two-column layout with 120px side margins */}
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-[120px] pt-10 pb-8 flex items-start gap-12">
          {/* LEFT: 2:3 portrait poster, 320px wide, 12px rounded corners, 1px border */}
          <div className="shrink-0 hidden md:block w-[320px]">
            <div className="relative aspect-[2/3] w-full rounded-[12px] border border-[#1C1C1C] overflow-hidden bg-[#0B0B0B] shadow-2xl">
              <img
                src={seriesData.poster}
                alt="Breaking Bad Poster"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>

          {/* RIGHT: Meta, Title, Scores, Buttons, Synopsis */}
          <div className="flex-1 flex flex-col pt-2 min-w-0">
            {/* Small muted uppercase label "SERIES" */}
            <div className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#7A7A7A] mb-3">
              {seriesData.type}
            </div>

            {/* Large light-weight white title "Breaking Bad" */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#F5F5F5] mb-3">
              {seriesData.title}
            </h1>

            {/* One muted meta line "2008–2013 · Crime, Drama · 5 seasons · 62 episodes" */}
            <div className="text-sm text-[#7A7A7A] font-normal tracking-normal mb-8 flex items-center gap-2">
              <span>{seriesData.year}</span>
              <span>·</span>
              <span>{seriesData.genres}</span>
              <span>·</span>
              <span>{seriesData.seasonsCount}</span>
              <span>·</span>
              <span>{seriesData.episodesCount}</span>
            </div>

            {/* Row with two circular score rings */}
            <div className="flex items-center gap-8 mb-8">
              <ScoreRing
                score={seriesData.tmdbRating}
                label={seriesData.tmdbVotes}
                size="lg"
              />

              <div className="w-[1px] h-12 bg-[#1C1C1C]" />

              <ScoreRing
                score={seriesData.communityRating}
                label={seriesData.communityVotes}
                size="sm"
                variant="inline"
              />
            </div>

            {/* Button row: solid mint #61F1AC primary button, ghost outline, share */}
            <div className="flex items-center gap-3.5 mb-8">
              <Button
                variant="primary"
                size="md"
                className="px-5 py-2.5 rounded-[10px]"
                onClick={() => {
                  setActiveTab("Reviews");
                }}
              >
                <Star size={15} className="fill-black text-black" />
                <span>Rate this</span>
              </Button>

              <Button
                variant="outline"
                size="md"
                className="px-5 py-2.5 rounded-[10px]"
                onClick={() => alert("Added to your series list")}
              >
                <Plus size={15} />
                <span>Add to list</span>
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
              <p className={synopsisExpanded ? "" : "line-clamp-3"}>
                {seriesData.synopsis}
                {!synopsisExpanded && " As their crystal meth empire expands, Walter grapples with ruthless cartels, DEA agent brother-in-law Hank Schrader, and his own moral decay."}
              </p>
              <button
                type="button"
                onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                className="mt-1 text-sm font-medium text-[#61F1AC] hover:underline cursor-pointer inline-block"
              >
                {synopsisExpanded ? "Show less" : "Read more"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TAB SWITCHER: four tabs "Episodes", "Cast", "Reviews", "Details", with "Episodes" active */}
      <div className="sticky top-16 z-30 bg-[#000000]/95 backdrop-blur-md border-b border-[#1C1C1C]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] flex items-center justify-between">
          <div className="flex items-center gap-8 h-12">
            {["Episodes", "Cast", "Reviews", "Details"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative h-full flex items-center text-sm font-medium transition-colors cursor-pointer ${
                    isActive ? "text-[#F5F5F5]" : "text-[#7A7A7A] hover:text-[#F5F5F5]"
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
        {/* 1. EPISODES TAB CONTENT                                  */}
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
                {episodesList.length} episodes · AMC Official Broadcast
              </span>
            </div>

            {/* Clean vertical list of episodes, each row 72px tall with thin divider */}
            {/* Row 0 shows hover state: #0B0B0B fill and 1px mint left border */}
            <div className="flex flex-col border-t border-[#1C1C1C]">
              {episodesList.map((ep, idx) => {
                const isHovered = hoveredEpisodeIndex === idx;

                return (
                  <div
                    key={ep.number}
                    onMouseEnter={() => setHoveredEpisodeIndex(idx)}
                    className={`h-[72px] flex items-center justify-between px-4 border-b border-[#1C1C1C] cursor-pointer transition-all duration-150 ${
                      isHovered
                        ? "bg-[#0B0B0B] border-l-2 border-l-[#61F1AC]"
                        : "hover:bg-[#0B0B0B] border-l-2 border-l-transparent"
                    }`}
                  >
                    {/* Left: episode number, thumbnail, title, description */}
                    <div className="flex items-center gap-4 min-w-0 mr-4">
                      {/* Muted episode number "01" */}
                      <span className="text-xs font-mono font-medium text-[#7A7A7A] w-6 shrink-0 tabular-nums">
                        {ep.number}
                      </span>

                      {/* 16:9 small thumbnail with 8px radius */}
                      <div className="w-[84px] h-[48px] rounded-[8px] overflow-hidden border border-[#1C1C1C] bg-[#141414] shrink-0">
                        <img
                          src={ep.thumbnail}
                          alt={ep.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Title & one-line muted description */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-[#F5F5F5] truncate">
                          {ep.title}
                        </span>
                        <span className="text-xs text-[#7A7A7A] truncate font-light">
                          {ep.description}
                        </span>
                      </div>
                    </div>

                    {/* Right: runtime in muted grey & compact mint score */}
                    <div className="flex items-center gap-6 shrink-0">
                      <span className="text-xs text-[#7A7A7A] font-tabular">
                        {ep.runtime}
                      </span>

                      <div className="flex items-center gap-1 text-sm font-tabular text-[#61F1AC] font-medium w-14 justify-end">
                        <Star size={12} className="fill-[#61F1AC]" />
                        <span>{ep.score}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. CAST TAB CONTENT (8 circular 88px portraits)          */}
        {/* ======================================================== */}
        {activeTab === "Cast" && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-light text-[#F5F5F5] tracking-tight">Series Cast</h2>
              <button
                type="button"
                className="text-xs text-[#7A7A7A] hover:text-[#61F1AC] transition-colors cursor-pointer"
              >
                See all 28 →
              </button>
            </div>

            <div className="relative">
              <div className="flex items-start gap-8 overflow-x-auto no-scrollbar pb-4 pr-16">
                {(seriesData.cast || BREAKING_BAD_DATA.cast).map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col items-center text-center shrink-0 w-[100px] group cursor-pointer"
                  >
                    <div className="w-[88px] h-[88px] rounded-full overflow-hidden border border-[#1C1C1C] mb-3 group-hover:border-[#61F1AC]/50 transition-all bg-[#0B0B0B]">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-xs font-medium text-[#F5F5F5] line-clamp-1 group-hover:text-white transition-colors">
                      {member.name}
                    </span>
                    <span className="text-[11px] text-[#7A7A7A] line-clamp-1 mt-0.5">
                      {member.character}
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-[#000000] via-[#000000]/60 to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. REVIEWS TAB CONTENT (720px centered single column)    */}
        {/* ======================================================== */}
        {activeTab === "Reviews" && (
          <div className="max-w-[720px] mx-auto animate-in fade-in duration-300">
            {/* COMPOSER CARD */}
            <div className="bg-[#0B0B0B] border border-[#1C1C1C] rounded-[16px] p-5 mb-8 shadow-sm">
              <div className="flex items-start gap-3.5 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                  alt="User Avatar"
                  className="w-9 h-9 rounded-full object-cover border border-[#1C1C1C] shrink-0"
                />
                <textarea
                  value={newThought}
                  onChange={(e) => setNewThought(e.target.value)}
                  placeholder="Add a thought on Breaking Bad…"
                  rows={3}
                  className="w-full bg-transparent text-[#F5F5F5] placeholder-[#7A7A7A] text-sm resize-none focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1C1C1C]/60">
                <div className="flex items-center gap-2">
                  <StarRating
                    value={selectedStars}
                    onChange={setSelectedStars}
                    size={17}
                  />
                  {selectedStars > 0 && (
                    <span className="text-xs font-tabular text-[#61F1AC]">
                      {selectedStars}/5
                    </span>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={newThought.trim().length === 0}
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

            {/* THIN ROW */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1C1C1C]">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7A7A]">
                {seriesData.communityVotes}
              </span>
              <span className="text-xs text-[#7A7A7A]">Sort: Top ⌄</span>
            </div>

            {/* REVIEW LIST */}
            <div className="flex flex-col divide-y divide-[#1C1C1C]">
              {(seriesData.reviews || BREAKING_BAD_DATA.reviews).map((rev) => {
                const isLiked = likedReviews[rev.id];
                const likeCount = rev.likes + (isLiked ? 1 : 0);

                return (
                  <article key={rev.id} className="py-6 first:pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={rev.avatar}
                          alt={rev.author}
                          className="w-9 h-9 rounded-full object-cover border border-[#1C1C1C]"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#F5F5F5]">
                            {rev.author}
                          </span>
                          <span className="text-xs text-[#7A7A7A]">· {rev.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm font-tabular text-[#61F1AC] font-semibold">
                        <Star size={13} className="fill-[#61F1AC]" />
                        <span>{rev.score}</span>
                      </div>
                    </div>

                    <p className="text-[#D0D0D0] text-sm leading-relaxed mb-4 font-light">
                      {rev.content}
                    </p>

                    <div className="flex items-center gap-6 text-xs text-[#7A7A7A]">
                      <button
                        type="button"
                        onClick={() => toggleLike(rev.id)}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isLiked ? "text-[#61F1AC]" : "hover:text-[#F5F5F5]"
                        }`}
                      >
                        <ThumbsUp size={13} className={isLiked ? "fill-[#61F1AC]" : ""} />
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
                        className="hover:text-[#F5F5F5] transition-colors cursor-pointer ml-auto"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. DETAILS TAB CONTENT                                   */}
        {/* ======================================================== */}
        {activeTab === "Details" && (
          <div className="max-w-[720px] mx-auto animate-in fade-in duration-300">
            <h2 className="text-xl font-light text-[#F5F5F5] tracking-tight mb-6">
              Series Technical &amp; Broadcast Details
            </h2>
            <div className="divide-y divide-[#1C1C1C] text-sm">
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Creator</span>
                <span className="text-[#F5F5F5]">{seriesData.details?.creator || BREAKING_BAD_DATA.details.creator}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Head Writers</span>
                <span className="text-[#F5F5F5]">{seriesData.details?.writers || BREAKING_BAD_DATA.details.writers}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Original Network</span>
                <span className="text-[#F5F5F5]">{seriesData.details?.network || BREAKING_BAD_DATA.details.network}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Original Broadcast</span>
                <span className="text-[#F5F5F5] font-tabular">{seriesData.details?.originalAirDates || BREAKING_BAD_DATA.details.originalAirDates}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Accolades</span>
                <span className="text-[#F5F5F5]">{seriesData.details?.awards || BREAKING_BAD_DATA.details.awards}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Production Studios</span>
                <span className="text-[#F5F5F5]">{seriesData.details?.studio || BREAKING_BAD_DATA.details.studio}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
