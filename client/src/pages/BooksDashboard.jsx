import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Star, X, Sparkles, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { BorderBeam } from "../components/ui/border-beam";
import { MediaCarousel } from "../components/ui/MediaCarousel";
import { CardSkeletonGrid } from "../components/ui/CardSkeleton";
import { fetchBooksDashboardFeeds, searchMangaDex, searchBooks } from "../services/mediaApi";

const CATEGORY_TABS = [
  { key: "all", label: "All Literature", to: "/books" },
  { key: "novels", label: "Books & Novels", to: "/books/novels" },
  { key: "manga", label: "Manga", to: "/books/manga" },
  { key: "manhwa", label: "Manhwa", to: "/books/manhwa" },
  { key: "manhua", label: "Manhua", to: "/books/manhua" },
];

export function BooksDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef(null);

  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
  const [feeds, setFeeds] = useState({
    trendingManhwa: [],
    trendingManga: [],
    trendingManhua: [],
    trendingBooks: [],
    fanFavorites: [],
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inListMap, setInListMap] = useState({});
  const [heroIndex, setHeroIndex] = useState(0);

  // Load all carousel feeds on mount
  useEffect(() => {
    let mounted = true;
    setIsLoadingFeeds(true);
    fetchBooksDashboardFeeds()
      .then((data) => {
        if (mounted && data) {
          setFeeds(data);
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingFeeds(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Keyboard shortcut: "/" to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let mounted = true;
    setIsSearching(true);

    Promise.all([
      searchMangaDex(debouncedQuery, "all").catch(() => []),
      searchBooks(debouncedQuery, 1).catch(() => []),
    ])
      .then(([mangaRes, booksRes]) => {
        if (!mounted) return;
        const formattedManga = (mangaRes || []).map((m) => ({
          ...m,
          cover: m.cover || m.poster,
          poster: m.poster || m.cover,
          route: `/books/${m.type || "manhwa"}/${m.id}`,
          score: m.rating,
        }));
        const formattedBooks = (booksRes || []).map((b) => ({
          ...b,
          cover: b.cover || b.poster,
          poster: b.poster || b.cover,
          route: `/books/novels/${b.id}`,
          score: b.rating,
        }));
        setSearchResults([...formattedManga, ...formattedBooks]);
      })
      .finally(() => {
        if (mounted) setIsSearching(false);
      });

    return () => {
      mounted = false;
    };
  }, [debouncedQuery]);

  const isSearchActive = searchQuery.trim().length > 0;

  // Build a diverse spotlight pool containing top titles across ALL literature types
  const spotlightPool = useMemo(() => {
    const pool = [];
    if (feeds.trendingManhwa[0]) pool.push({ ...feeds.trendingManhwa[0], badge: "Trending Manhwa" });
    if (feeds.trendingManga[0]) pool.push({ ...feeds.trendingManga[0], badge: "Trending Manga" });
    if (feeds.trendingBooks[0]) pool.push({ ...feeds.trendingBooks[0], badge: "Trending Book / Novel" });
    if (feeds.trendingManhua[0]) pool.push({ ...feeds.trendingManhua[0], badge: "Trending Manhua" });
    if (feeds.trendingManhwa[1]) pool.push({ ...feeds.trendingManhwa[1], badge: "Featured Webtoon" });
    if (feeds.trendingManga[1]) pool.push({ ...feeds.trendingManga[1], badge: "Featured Manga" });

    if (pool.length > 0) return pool;

    return [
      {
        id: "omniscient-reader",
        title: "Omniscient Reader's Viewpoint",
        rating: "9.6",
        synopsis:
          "Dokja was an average office worker whose sole interest was reading his favorite web novel. But when the novel suddenly becomes reality, he is the only person who knows how the world will end.",
        cover: "https://uploads.mangadex.org/covers/a0445479-7a7d-411a-8c7c-473d82136e65/7a83f982-b7e6-4279-9fc6-cfb06df489f4.jpg.512.jpg",
        backdrop: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80",
        route: "/books/manhwa/a0445479-7a7d-411a-8c7c-473d82136e65",
        type: "MANHWA",
        chapters: "Ch. 220+",
        badge: "Trending Manhwa",
      },
    ];
  }, [feeds]);

  const currentHero = spotlightPool[heroIndex % spotlightPool.length] || spotlightPool[0];

  // Auto-advance spotlight banner every 8 seconds
  useEffect(() => {
    if (spotlightPool.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % spotlightPool.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [spotlightPool.length]);

  const toggleReadingList = (id) => {
    setInListMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#000000] text-[#F5F5F5] flex flex-col justify-between pt-10 pb-24 select-none">
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-[120px]">
        {/* CENTER HERO SEARCH BAR */}
        <section className="flex flex-col items-center justify-center pt-2 pb-8 text-center">
          <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#7A7A7A] mb-3">
            BOOKS · NOVELS · MANGA · MANHWA · MANHUA
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-light tracking-tight text-[#F5F5F5] mb-8">
            What are you reading?
          </h1>

          <div className="relative w-full max-w-[620px] group">
            <BorderBeam
              size="md"
              colorVariant="mint"
              borderRadius={27}
              className="w-full rounded-full"
            >
              <div className="relative w-full h-[54px] rounded-full bg-[#0B0B0B] border border-[#1C1C1C] focus-within:border-[#61F1AC]/60 px-5 flex items-center justify-between shadow-2xl transition-all">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <Search size={18} className="text-[#61F1AC] shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any book, manga, manhwa, or author..."
                    className="w-full bg-transparent text-sm font-normal text-[#F5F5F5] placeholder-[#7A7A7A] focus:outline-none caret-[#61F1AC]"
                  />
                </div>

                {isSearchActive ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#7A7A7A] hover:text-[#F5F5F5] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] cursor-pointer transition-colors"
                  >
                    <X size={14} />
                    <span>Clear</span>
                  </button>
                ) : (
                  <kbd className="inline-flex items-center px-2 py-0.5 text-xs font-mono text-[#7A7A7A] bg-white/[0.04] border border-white/[0.06] rounded-full group-hover:text-[#F5F5F5] transition-colors">
                    /
                  </kbd>
                )}
              </div>
            </BorderBeam>
          </div>
        </section>

        {/* SEARCH RESULTS VIEW */}
        {isSearchActive ? (
          <section className="mt-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#1C1C1C]">
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7A7A]">
                  Results for "{searchQuery}"
                </span>
                <span className="text-xs text-[#61F1AC] font-mono">
                  ({searchResults.length} {searchResults.length === 1 ? "title" : "titles"})
                </span>
              </div>
            </div>

            {isSearching ? (
              <CardSkeletonGrid count={6} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" />
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {searchResults.map((item) => (
                  <Link
                    key={`${item.type || "media"}-${item.id}`}
                    to={item.route}
                    className="group flex flex-col cursor-pointer transition-all"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] border border-[#1C1C1C] group-hover:border-[#61F1AC]/60 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.12)] transition-all duration-300">
                      {item.cover || item.poster ? (
                        <img
                          src={item.cover || item.poster}
                          alt={item.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#7A7A7A] p-4 text-center">
                          {item.title}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="mt-3 flex flex-col">
                      <span className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-white transition-colors">
                        {item.title}
                      </span>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-[#7A7A7A] truncate font-tabular max-w-[100px]">
                          {item.author || item.chapters || item.type}
                        </span>
                        <div className="flex items-center gap-1 text-[#61F1AC] font-medium font-tabular">
                          <Star size={11} className="fill-[#61F1AC]" />
                          <span>{item.score || item.rating || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-sm text-[#7A7A7A] font-light">
                  No titles found matching "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs text-[#61F1AC] border border-[#61F1AC]/40 hover:bg-[#61F1AC]/10 transition-colors cursor-pointer"
                >
                  Clear search &amp; show dashboard
                </button>
              </div>
            )}
          </section>
        ) : (
          /* ======================================================== */
          /* DASHBOARD CAROUSEL VIEW                                  */
          /* ======================================================== */
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* 1. MULTI-CATEGORY SPOTLIGHT HERO BANNER */}
            <section className="relative w-full rounded-[16px] overflow-hidden border border-[#1C1C1C] bg-[#0A0A0A] shadow-2xl transition-all duration-500">
              {/* Cinematic backdrop artwork with vignette */}
              <div className="absolute inset-0 z-0">
                <img
                  key={currentHero.id}
                  src={currentHero.backdrop || currentHero.cover || currentHero.poster}
                  alt={currentHero.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top opacity-30 scale-105 blur-sm sm:blur-none transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/90 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-transparent" />
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-[#61F1AC] opacity-[0.04] blur-[120px] pointer-events-none rounded-full" />
              </div>

              {/* Banner content */}
              <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="max-w-2xl flex flex-col">
                  {/* Spotlight label & format pill */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider text-[#61F1AC] bg-[#61F1AC]/10 border border-[#61F1AC]/30">
                      <Sparkles size={12} />
                      {currentHero.badge || "Featured Spotlight"}
                    </span>
                    <span className="text-xs text-[#7A7A7A] uppercase tracking-wider">
                      {currentHero.type}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#F5F5F5] mb-3">
                    {currentHero.title}
                  </h2>

                  {/* Stats Pill */}
                  <div className="flex items-center gap-3 text-xs text-[#7A7A7A] mb-4">
                    <div className="flex items-center gap-1 font-semibold text-[#61F1AC]">
                      <Star size={13} className="fill-[#61F1AC]" />
                      <span>{currentHero.score || currentHero.rating || "9.0"} Rating</span>
                    </div>
                    <span>·</span>
                    <span>{currentHero.chapters || currentHero.author || "Serialized"}</span>
                    <span>·</span>
                    <span className="text-[#B5B5B5]">Editor's Recommendation</span>
                  </div>

                  {/* Synopsis */}
                  <p className="text-sm text-[#B5B5B5] leading-relaxed line-clamp-3 mb-6 font-light max-w-xl">
                    {currentHero.overview || currentHero.synopsis || "Explore one of the highest-rated titles across the community reading list."}
                  </p>

                  {/* Action buttons + Slide Controls */}
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => toggleReadingList(currentHero.id)}
                      className={`px-5 py-2.5 rounded-[10px] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all ${
                        inListMap[currentHero.id]
                          ? "bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/60"
                          : "bg-[#61F1AC] hover:bg-[#7BF5BB] text-black shadow-[0_4px_16px_rgba(97,241,172,0.25)]"
                      }`}
                    >
                      {inListMap[currentHero.id] ? <Check size={14} /> : <Plus size={14} />}
                      <span>{inListMap[currentHero.id] ? "In Reading List" : "Add to List"}</span>
                    </button>

                    <Link
                      to={currentHero.route}
                      className="px-5 py-2.5 rounded-[10px] text-xs font-medium text-[#F5F5F5] bg-[#141414] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-white transition-colors"
                    >
                      Read Details →
                    </Link>

                    {/* Spotlight carousel dots & arrows */}
                    {spotlightPool.length > 1 && (
                      <div className="flex items-center gap-2 ml-auto sm:ml-4">
                        <button
                          type="button"
                          aria-label="Previous recommendation"
                          onClick={() => setHeroIndex((prev) => (prev - 1 + spotlightPool.length) % spotlightPool.length)}
                          className="w-8 h-8 rounded-full border border-[#1C1C1C] bg-[#101010] flex items-center justify-center text-[#7A7A7A] hover:text-[#61F1AC] hover:border-[#61F1AC]/50 cursor-pointer transition-colors"
                        >
                          <ChevronLeft size={14} />
                        </button>

                        <div className="flex items-center gap-1.5 px-2">
                          {spotlightPool.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              type="button"
                              aria-label={`Jump to recommendation ${dotIdx + 1}`}
                              onClick={() => setHeroIndex(dotIdx)}
                              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                dotIdx === heroIndex % spotlightPool.length
                                  ? "w-5 bg-[#61F1AC]"
                                  : "w-1.5 bg-white/20 hover:bg-white/40"
                              }`}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          aria-label="Next recommendation"
                          onClick={() => setHeroIndex((prev) => (prev + 1) % spotlightPool.length)}
                          className="w-8 h-8 rounded-full border border-[#1C1C1C] bg-[#101010] flex items-center justify-center text-[#7A7A7A] hover:text-[#61F1AC] hover:border-[#61F1AC]/50 cursor-pointer transition-colors"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hero portrait cover card with zoom on hover */}
                <Link
                  to={currentHero.route}
                  className="hidden md:block shrink-0 w-[190px] aspect-[2/3] rounded-[12px] overflow-hidden border border-[#1C1C1C] hover:border-[#61F1AC]/60 shadow-2xl transition-all group bg-[#0B0B0B]"
                >
                  <img
                    src={currentHero.cover || currentHero.poster}
                    alt={currentHero.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>
              </div>
            </section>

            {/* 2. MINIMAL CATEGORY FILTER TABS ROW */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-2 border-b border-[#1C1C1C]">
              {CATEGORY_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Link
                    key={tab.key}
                    to={tab.to}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/50 shadow-[0_0_14px_rgba(97,241,172,0.15)]"
                        : "text-[#7A7A7A] bg-white/[0.03] border border-white/[0.05] hover:text-[#F5F5F5] hover:border-white/10"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            {/* 3. ONE SECTION PER SINGLE FULL-WIDTH LINE (Carousels) */}
            <div className="space-y-6 pb-12">
              {/* Row 1: Trending this week — Manhwa */}
              <MediaCarousel
                title="Trending this week — Manhwa"
                items={feeds.trendingManhwa}
                isLoading={isLoadingFeeds}
                subtitle="Korean Webcomics & Webtoons"
              />

              {/* Row 2: Trending this week — Manga */}
              <MediaCarousel
                title="Trending this week — Manga"
                items={feeds.trendingManga}
                isLoading={isLoadingFeeds}
                subtitle="Japanese Graphic Novels & Tankōbon"
              />

              {/* Row 3: Trending this month — Novels & Books */}
              <MediaCarousel
                title="Trending this month — Novels & Books"
                items={feeds.trendingBooks}
                isLoading={isLoadingFeeds}
                subtitle="Literary Fiction & Modern Classics"
              />

              {/* Row 4: Trending this month — Manhua */}
              <MediaCarousel
                title="Trending this month — Manhua"
                items={feeds.trendingManhua}
                isLoading={isLoadingFeeds}
                subtitle="Chinese Serialized Comics & Cultivation"
              />

              {/* Row 5: Fan Favorites (with bold silver rank numerals 1-10) */}
              <MediaCarousel
                title="Fan Favorites — All Time"
                items={feeds.fanFavorites}
                isLoading={isLoadingFeeds}
                showRank={true}
                subtitle="Highest Bayesian Community Ratings"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
