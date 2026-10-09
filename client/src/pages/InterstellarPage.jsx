import React, { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Star, Plus, Share2, ThumbsUp, Reply, MoreHorizontal, ChevronDown } from "lucide-react";
import { INTERSTELLAR_DATA, HOME_TRENDING_ITEMS } from "../data/mockData";
import { getMovieDetails } from "../services/tmdb";
import { ScoreRing } from "../components/ui/ScoreRing";
import { Button } from "../components/ui/Button";
import { StarRating } from "../components/ui/StarRating";

export function InterstellarPage({ initialTab = "Cast", initialCropHero = false }) {
  const location = useLocation();
  const { id } = useParams();
  const isReviewsUrl = location.pathname.includes("/reviews");

  const [movieData, setMovieData] = useState(INTERSTELLAR_DATA);
  const [selectedTabOverride, setSelectedTabOverride] = useState(null);
  const [cropHeroOverride, setCropHeroOverride] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadTmdbMovie() {
      // Map known slugs to TMDB IDs
      const slugMap = {
        interstellar: 157336,
        dune: 438631,
        "dune-2021": 438631,
        "your-name": 372058,
        "the-batman": 414906,
        "spirited-away": 129
      };

      const targetId = slugMap[id?.toLowerCase()] || parseInt(id, 10) || 157336;

      try {
        const live = await getMovieDetails(targetId);
        if (mounted && live) {
          // If viewing another movie from trending items, blend title and poster if needed
          const matchedCurated = HOME_TRENDING_ITEMS.find((item) => item.id === id || String(item.tmdbId) === String(targetId));
          if (matchedCurated && live.id === "interstellar" && targetId !== 157336) {
            setMovieData({
              ...INTERSTELLAR_DATA,
              title: matchedCurated.title,
              year: matchedCurated.year,
              tmdbRating: matchedCurated.rating,
              poster: matchedCurated.poster
            });
          } else {
            setMovieData(live);
          }
        }
      } catch {
        // Fall back to curated
      }
    }
    loadTmdbMovie();
    return () => {
      mounted = false;
    };
  }, [id]);

  const activeTab = selectedTabOverride !== null 
    ? selectedTabOverride 
    : (isReviewsUrl ? "Reviews" : initialTab);

  const cropHero = cropHeroOverride !== null 
    ? cropHeroOverride 
    : (isReviewsUrl ? true : initialCropHero);

  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [newThought, setNewThought] = useState("");
  const [selectedStars, setSelectedStars] = useState(0);
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Top");
  const [likedReviews, setLikedReviews] = useState({});

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

  const toggleLike = (reviewId) => {
    setLikedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

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
            alt="Interstellar Cinematic Backdrop"
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
            cropHero ? "-translate-y-48 opacity-40 pointer-events-none" : "translate-y-0 opacity-100"
          }`}
        >
          {/* LEFT: 2:3 portrait poster, 320px wide, 12px rounded corners, 1px border */}
          <div className="shrink-0 hidden md:block w-[320px]">
            <div className="relative aspect-[2/3] w-full rounded-[12px] border border-[#1C1C1C] overflow-hidden bg-[#0B0B0B] shadow-2xl group">
              <img
                src={movieData.poster}
                alt="Interstellar Poster"
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* RIGHT: Meta, Title, Scores, Buttons, Synopsis */}
          <div className="flex-1 flex flex-col pt-2 min-w-0">
            {/* Small muted uppercase label "MOVIE" */}
            <div className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#7A7A7A] mb-3">
              {movieData.type}
            </div>

            {/* Large light-weight white title "Interstellar" */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#F5F5F5] mb-3">
              {movieData.title}
            </h1>

            {/* One muted meta line "2014 · Sci-Fi, Adventure · 2h 49m · PG-13" */}
            <div className="text-sm text-[#7A7A7A] font-normal tracking-normal mb-8 flex items-center gap-2">
              <span>{movieData.year}</span>
              <span>·</span>
              <span>{movieData.genres}</span>
              <span>·</span>
              <span>{movieData.runtime}</span>
              <span>·</span>
              <span>{movieData.certificate}</span>
            </div>

            {/* Row with two circular score rings */}
            <div className="flex items-center gap-8 mb-8">
              {/* Large circular score ring in mint (stroke 4px, TMDB score in tabular numerals, beneath it TMDB votes in muted text) */}
              <ScoreRing
                score={movieData.tmdbRating}
                label={movieData.tmdbVotes}
                size="lg"
              />

              <div className="w-[1px] h-12 bg-[#1C1C1C]" />

              {/* Second smaller ring labeled "Community 8.9" with "342 ratings" */}
              <ScoreRing
                score={movieData.communityRating}
                label={movieData.communityVotes}
                size="sm"
                variant="inline"
              />
            </div>

            {/* Button row: solid mint #61F1AC primary button "Rate this", ghost outline "Add to list", small circular share */}
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
                variant="outline"
                size="md"
                className="px-5 py-2.5 rounded-[10px]"
                onClick={() => alert("Added to your watchlist")}
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
                {movieData.synopsis}
                {!synopsisExpanded && " As mankind faces extinction through dust storms and famine, a team of astronauts embarks on humanity's farthest journey across the galaxy."}
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

      {/* BELOW THE HERO: Minimal horizontal tab switcher */}
      <div
        ref={contentRef}
        className="sticky top-16 z-30 bg-[#000000]/95 backdrop-blur-md border-b border-[#1C1C1C]"
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px] flex items-center justify-between">
          <div className="flex items-center gap-8 h-12">
            {["Cast", "Reviews", "Details"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabChange(tab)}
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
        {/* 1. CAST TAB CONTENT                                      */}
        {/* ======================================================== */}
        {activeTab === "Cast" && (
          <div className="animate-in fade-in duration-300">
            {/* Header row with "Cast" and small "See all" link at right */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-light text-[#F5F5F5] tracking-tight">Cast</h2>
              <button
                type="button"
                className="text-xs text-[#7A7A7A] hover:text-[#61F1AC] transition-colors cursor-pointer"
              >
                See all 24 →
              </button>
            </div>

            {/* Horizontal scrollable row of 8 circular 88px cast portraits with subtle fade on right edge */}
            <div className="relative">
              <div className="flex items-start gap-8 overflow-x-auto no-scrollbar pb-4 pr-16">
                {(movieData.cast || []).map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col items-center text-center shrink-0 w-[100px] group cursor-pointer"
                  >
                    {/* 88px circular portrait */}
                    <div className="w-[88px] h-[88px] rounded-full overflow-hidden border border-[#1C1C1C] mb-3 group-hover:border-[#61F1AC]/50 transition-all bg-[#0B0B0B]">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    {/* Name in white */}
                    <span className="text-xs font-medium text-[#F5F5F5] line-clamp-1 group-hover:text-white transition-colors">
                      {member.name}
                    </span>
                    {/* Character name in muted grey below */}
                    <span className="text-[11px] text-[#7A7A7A] line-clamp-1 mt-0.5">
                      {member.character}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtle fade on the right edge */}
              <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-[#000000] via-[#000000]/60 to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. REVIEWS TAB CONTENT (720px centered single column)     */}
        {/* ======================================================== */}
        {activeTab === "Reviews" && (
          <div className="max-w-[720px] mx-auto animate-in fade-in duration-300">
            {/* COMPOSER CARD: #0B0B0B, 1px border, 16px radius */}
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
                  placeholder="Add a thought…"
                  rows={3}
                  className="w-full bg-transparent text-[#F5F5F5] placeholder-[#7A7A7A] text-sm resize-none focus:outline-none"
                />
              </div>

              {/* Bottom row: compact 5-star selector & solid mint Post button */}
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

            {/* THIN ROW: left "342 reviews" in muted caps, right dropdown chip "Sort: Top ⌄" */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1C1C1C]">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7A7A]">
                {movieData.communityVotes}
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
                    {["Top", "Newest", "Highest Rated", "Lowest Rated"].map((opt) => (
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
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* REVIEW LIST: 4 comment items separated by 1px #1C1C1C lines, no card boxes */}
            <div className="flex flex-col divide-y divide-[#1C1C1C]">
              {(movieData.reviews || []).map((rev) => {
                const isLiked = likedReviews[rev.id];
                const likeCount = rev.likes + (isLiked ? 1 : 0);

                return (
                  <article key={rev.id} className="py-6 first:pt-0">
                    {/* Header: 36px round avatar, bold username in white, relative time in muted, small mint star with score */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={rev.avatar}
                          alt={rev.author}
                          className="w-9 h-9 rounded-full object-cover border border-[#1C1C1C]"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#F5F5F5]">
                            {rev.author}
                          </span>
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

                    {/* Body text in #D0D0D0 */}
                    <p className="text-sm leading-relaxed text-[#D0D0D0] mb-4 font-light">
                      {rev.content}
                    </p>

                    {/* Footer actions in muted grey with tiny line icons: thumbs-up with count, "Reply", "⋯" */}
                    <div className="flex items-center justify-between text-xs text-[#7A7A7A]">
                      <div className="flex items-center gap-5">
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
                          className="hover:text-[#F5F5F5] transition-colors cursor-pointer p-0.5"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>

                      {/* Collapsed reply thread for item 1: "View 3 replies ⌄" in mint */}
                      {rev.repliesCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setRepliesExpanded(!repliesExpanded)}
                          className="text-xs font-medium text-[#61F1AC] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>
                            {repliesExpanded ? "Hide replies" : `View ${rev.repliesCount} replies ⌄`}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Expanded Replies Thread */}
                    {rev.replies && repliesExpanded && (
                      <div className="mt-4 pl-11 space-y-3.5 pt-3 border-t border-[#1C1C1C]/40">
                        {rev.replies.map((reply) => (
                          <div key={reply.id} className="text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <img
                                src={reply.avatar}
                                alt={reply.author}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="font-medium text-[#F5F5F5]">
                                {reply.author}
                              </span>
                              <span className="text-[#7A7A7A]">·</span>
                              <span className="text-[#7A7A7A]">{reply.time}</span>
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

            {/* Mint "Load more" ghost button centered at end */}
            <div className="flex justify-center mt-10">
              <Button
                variant="mintGhost"
                size="md"
                className="px-6 py-2 rounded-full text-xs font-medium"
                onClick={() => alert("Loaded additional reviews")}
              >
                Load more reviews
              </Button>
            </div>
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
                <span className="text-[#F5F5F5]">{movieData.details?.director || INTERSTELLAR_DATA.details.director}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Writers</span>
                <span className="text-[#F5F5F5]">{movieData.details?.writers || INTERSTELLAR_DATA.details.writers}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Original Score</span>
                <span className="text-[#F5F5F5]">{movieData.details?.music || INTERSTELLAR_DATA.details.music}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Cinematography</span>
                <span className="text-[#F5F5F5]">{movieData.details?.cinematography || INTERSTELLAR_DATA.details.cinematography}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Box Office</span>
                <span className="text-[#F5F5F5] font-tabular">{movieData.details?.boxOffice || INTERSTELLAR_DATA.details.boxOffice}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Aspect Ratio</span>
                <span className="text-[#F5F5F5] font-tabular">{movieData.details?.aspectRatio || INTERSTELLAR_DATA.details.aspectRatio}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#7A7A7A]">Studio</span>
                <span className="text-[#F5F5F5]">{movieData.details?.studio || INTERSTELLAR_DATA.details.studio}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
