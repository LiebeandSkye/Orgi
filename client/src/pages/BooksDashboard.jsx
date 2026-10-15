import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Star,
  X,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Columns3,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { BorderBeam } from "../components/ui/border-beam";
import { MediaCarousel } from "../components/ui/MediaCarousel";
import {
  fetchBooksDashboardFeeds,
  getCachedBooksDashboardFeeds,
  searchMangaDex,
  searchBooks,
} from "../services/mediaApi";

const CATEGORY_TABS = [
  { key: "all", label: "All Literature", count: null, sectionId: null, catalogUrl: null },
  { key: "manhwa", label: "Manhwa", count: "1.4k", sectionId: "section-manhwa", catalogUrl: "/books/manhwa" },
  { key: "manga", label: "Manga", count: "2.8k", sectionId: "section-manga", catalogUrl: "/books/manga" },
  { key: "novels", label: "Books & Novels", count: "4.1k", sectionId: "section-novels", catalogUrl: "/books/novels" },
  { key: "manhua", label: "Manhua", count: "3.2k", sectionId: "section-manhua", catalogUrl: "/books/manhua" },
  { key: "favorites", label: "Fan Favorites", count: "Top", sectionId: "section-favorites", catalogUrl: null },
];

const SECTION_OPTIONS = [
  { label: "Trending Manhwa", id: "section-manhwa" },
  { label: "Trending Manga", id: "section-manga" },
  { label: "Books & Novels", id: "section-novels" },
  { label: "Trending Manhua", id: "section-manhua" },
  { label: "Fan Favorites", id: "section-favorites" },
];

function ShelfGrid({ title, items, isLoading, sectionId, catalogUrl, showRank = false }) {
  if (isLoading) {
    return (
      <div id={sectionId} className="space-y-4 pt-4 scroll-mt-20">
        <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-3">
          <h3 className="text-lg font-light tracking-tight text-[#F5F5F5]">{title}</h3>
        </div>
        <CardSkeletonGrid count={6} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" />
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section id={sectionId} className="space-y-4 pt-4 scroll-mt-20">
      <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-3">
        <h3 className="text-lg font-light tracking-tight text-[#F5F5F5] flex items-center gap-2.5">
          <span>{title}</span>
          <span className="text-xs font-mono font-medium text-[#61F1AC] px-2 py-0.5 rounded-full bg-[#141414] border border-[#61F1AC]/30">
            {items.length} titles
          </span>
        </h3>
        {catalogUrl && (
          <Link
            to={catalogUrl}
            className="text-xs text-[#7A7A7A] hover:text-[#61F1AC] transition-colors flex items-center gap-1 group font-medium cursor-pointer"
          >
            <span>Explore catalog</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item, idx) => (
          <Link
            key={item.id || idx}
            to={item.route}
            className="group flex flex-col cursor-pointer transition-all"
          >
            <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] border border-[#1C1C1C] group-hover:border-[#61F1AC]/60 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.12)] transition-all duration-300">
              <img
                src={item.cover || item.poster}
                alt={item.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-500"
              />

              {showRank && (
                <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-black/85 backdrop-blur-md border border-white/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#F5F5F5] font-tabular">
                    {idx + 1}
                  </span>
                </div>
              )}

              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center gap-1">
                <Star size={10} className="fill-[#61F1AC] text-[#61F1AC]" />
                <span className="text-[10px] font-tabular font-semibold text-[#61F1AC]">
                  {item.score || item.rating || "8.8"}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="mt-2.5 flex flex-col">
              <span className="text-xs sm:text-sm font-medium text-[#F5F5F5] truncate group-hover:text-white transition-colors">
                {item.title}
              </span>
              <span className="text-[11px] text-[#7A7A7A] truncate font-tabular mt-0.5">
                {item.chapters || item.author || item.type}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function BooksDashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("carousel");
  const [jumpMenuOpen, setJumpMenuOpen] = useState(false);
  const jumpMenuRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef(null);

  // Instant 0ms cache hydration
  const initialCached = useMemo(() => getCachedBooksDashboardFeeds(), []);
  const [feeds, setFeeds] = useState(
    initialCached || {
      trendingManhwa: [],
      trendingManga: [],
      trendingManhua: [],
      trendingBooks: [],
      fanFavorites: [],
    }
  );
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(!initialCached);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inListMap, setInListMap] = useState({});
  const [heroIndex, setHeroIndex] = useState(0);

  // Close jump menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (jumpMenuRef.current && !jumpMenuRef.current.contains(e.target)) {
        setJumpMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load all carousel feeds on mount with progressive updates
  useEffect(() => {
    let mounted = true;
    if (!initialCached) {
      setIsLoadingFeeds(true);
    }

    fetchBooksDashboardFeeds((progressive) => {
      if (mounted && progressive) {
        setFeeds((prev) => ({ ...prev, ...progressive }));
        if (progressive.trendingManhwa?.length > 0 || progressive.trendingManga?.length > 0) {
          setIsLoadingFeeds(false);
        }
      }
    })
      .then((finalData) => {
        if (mounted && finalData) {
          setFeeds(finalData);
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingFeeds(false);
      });

    return () => {
      mounted = false;
    };
  }, [initialCached]);

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

  const handleTabClick = (tab) => {
    setActiveTab(tab.key);
    if (tab.key !== "all" && tab.sectionId) {
      setTimeout(() => {
        const el = document.getElementById(tab.sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50);
    }
  };

  const scrollToSection = (id) => {
    setActiveTab("all");
    setJumpMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#000000] text-[#F5F5F5] flex flex-col justify-between pt-10 pb-24 select-none">
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-[120px]">
        {/* HEADER SEARCH HERO */}
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
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* FEATURED SPOTLIGHT HERO BANNER (OPTION 3 CINEMATIC CARD) */}
            <section className="group relative w-full rounded-[18px] sm:rounded-[22px] overflow-hidden border border-[#1C1C1C] bg-[#0A0A0A] shadow-2xl transition-all duration-500">
              {/* Integrated Object Background Image on the right side */}
              <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[50%] md:w-[46%] lg:w-[42%] max-w-[560px] pointer-events-none overflow-hidden z-0">
                {/* Ambient backdrop glow */}
                <img
                  src={currentHero.backdrop || currentHero.cover || currentHero.poster}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-110"
                />

                {/* Main high-clarity artwork with optimized focal placement */}
                <img
                  key={currentHero.id}
                  src={currentHero.backdrop || currentHero.cover || currentHero.poster}
                  alt={currentHero.title}
                  referrerPolicy="no-referrer"
                  className="relative w-full h-full object-cover object-top sm:object-[center_12%] group-hover:scale-[1.02] transition-all duration-700"
                />

                {/* Left-edge smooth fade to seamlessly blend artwork into dark card */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/30 to-transparent" />
                {/* Subtle top/bottom edge fade */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/30 via-transparent to-[#0A0A0A]/50" />
                {/* Mobile overlay for legibility */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-[#0A0A0A]/50 sm:hidden" />
              </div>

              {/* Card Foreground Content */}
              <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[320px] sm:min-h-[360px]">
                {/* Top Row: Left Pill Badge & Right Dual Score Pill */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#0E1E14] text-[#61F1AC] border border-[#61F1AC]/35 shadow-[0_0_12px_rgba(97,241,172,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC] animate-pulse" />
                    Featured Spotlight
                  </span>

                  {/* Top Right Score & Reads Dual Capsule (Image 2 style) */}
                  <div className="inline-flex items-center rounded-full bg-[#141414]/90 border border-[#222222] overflow-hidden shadow-lg backdrop-blur-md">
                    <div className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-[#F5F5F5]">
                      <span>{currentHero.score || currentHero.rating || "9.0"}</span>
                      <Star size={11} className="fill-[#61F1AC] text-[#61F1AC]" />
                    </div>
                    <div className="px-3 py-1 text-xs font-bold bg-[#61F1AC] text-black">
                      {(() => {
                        const cnt = currentHero.follows || currentHero.voteCount || 42100;
                        if (cnt >= 1000000) return `${(cnt / 1000000).toFixed(1)}m`;
                        if (cnt >= 1000) return `${(cnt / 1000).toFixed(1)}k`;
                        return `${cnt}`;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Center: Title & Metadata (Restricted width so it never crowds artwork) */}
                <div className="max-w-md sm:max-w-lg lg:max-w-xl my-auto py-2">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-white mb-2 line-clamp-2">
                    {currentHero.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-[#B5B5B5] font-light leading-relaxed line-clamp-2 mb-1.5">
                    <span className="text-[#888888] font-normal">Synopsis: </span>
                    {currentHero.synopsis || currentHero.overview || "Explore one of the highest-rated titles across the community reading list."}
                  </p>

                  <p className="text-xs sm:text-sm text-[#888888] font-light">
                    Author: <span className="text-[#D4D4D4] font-medium">{currentHero.author || "Editorial Pick"}</span>
                    {currentHero.chapters && (
                      <>
                        <span className="mx-2 text-[#555555]">·</span>
                        <span className="text-[#61F1AC]">{currentHero.chapters}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Bottom: Action Buttons & Subtle Slider Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={currentHero.route}
                      className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center gap-2 bg-[#61F1AC] hover:bg-[#7BF5BB] text-black shadow-[0_4px_20px_rgba(97,241,172,0.3)] transition-all cursor-pointer group/btn"
                    >
                      <BookOpen size={15} className="group-hover/btn:scale-110 transition-transform" />
                      <span>Start Reading</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleReadingList(currentHero.id)}
                      className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                        inListMap[currentHero.id]
                          ? "bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/60"
                          : "bg-[#141414]/80 hover:bg-[#1E1E1E] text-[#E5E5E5] border border-white/10 hover:border-[#61F1AC]/40"
                      }`}
                    >
                      {inListMap[currentHero.id] ? <Check size={14} /> : <Plus size={14} />}
                      <span>{inListMap[currentHero.id] ? "In Reading List" : "Add to List"}</span>
                    </button>
                  </div>

                  {/* Subtle Pagination Indicators */}
                  {spotlightPool.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Previous recommendation"
                        onClick={() => setHeroIndex((prev) => (prev - 1 + spotlightPool.length) % spotlightPool.length)}
                        className="w-7 h-7 rounded-full border border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-center text-[#7A7A7A] hover:text-[#61F1AC] hover:border-[#61F1AC]/50 cursor-pointer transition-colors"
                      >
                        <ChevronLeft size={13} />
                      </button>

                      <div className="flex items-center gap-1.5 px-1">
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
                        className="w-7 h-7 rounded-full border border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-center text-[#7A7A7A] hover:text-[#61F1AC] hover:border-[#61F1AC]/50 cursor-pointer transition-colors"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* OPTION 2: STREAMING-STYLE MINIMALIST UNDERLINE CATEGORY TABS (STICKY) */}
            <div className="sticky top-0 z-30 bg-[#000000]/95 backdrop-blur-md border-b border-[#1C1C1C] pt-2 pb-0 -mx-6 px-6 lg:-mx-[120px] lg:px-[120px] transition-all">
              <div className="flex items-center justify-between gap-4">
                {/* Left Underline Tabs */}
                <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar py-1">
                  {CATEGORY_TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => handleTabClick(tab)}
                        className={`relative pb-3 text-xs sm:text-sm font-medium tracking-tight whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 group ${
                          isActive ? "text-[#F5F5F5]" : "text-[#7A7A7A] hover:text-[#D4D4D4]"
                        }`}
                      >
                        <span>{tab.label}</span>
                        {tab.count && (
                          <span
                            className={`text-[10px] font-tabular font-semibold px-1.5 py-0.5 rounded-full transition-colors ${
                              isActive
                                ? "bg-[#61F1AC]/15 text-[#61F1AC] border border-[#61F1AC]/30"
                                : "bg-[#141414] text-[#7A7A7A] border border-[#1C1C1C] group-hover:text-[#B5B5B5]"
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                        {/* Glowing Electric Mint Underline */}
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#61F1AC] rounded-full shadow-[0_0_12px_rgba(97,241,172,0.85)] animate-in fade-in duration-200" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right Controls: View Mode Toggle & Jump to Section Dropdown */}
                <div className="hidden sm:flex items-center gap-3 shrink-0 pb-3">
                  {/* View Mode Toggle (Carousel vs Grid) */}
                  <div className="flex items-center bg-[#0B0B0B] border border-[#1C1C1C] rounded-[8px] p-0.5">
                    <button
                      type="button"
                      aria-label="Carousel View"
                      onClick={() => setViewMode("carousel")}
                      className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                        viewMode === "carousel"
                          ? "bg-[#161616] text-[#61F1AC]"
                          : "text-[#7A7A7A] hover:text-[#F5F5F5]"
                      }`}
                    >
                      <Columns3 size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Grid View"
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                        viewMode === "grid"
                          ? "bg-[#161616] text-[#61F1AC]"
                          : "text-[#7A7A7A] hover:text-[#F5F5F5]"
                      }`}
                    >
                      <LayoutGrid size={14} />
                    </button>
                  </div>

                  {/* Jump to Section Dropdown */}
                  <div className="relative" ref={jumpMenuRef}>
                    <button
                      type="button"
                      onClick={() => setJumpMenuOpen(!jumpMenuOpen)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#0B0B0B] border border-[#1C1C1C] text-xs font-medium text-[#B5B5B5] hover:text-[#F5F5F5] hover:border-[#61F1AC]/40 transition-colors cursor-pointer"
                    >
                      <span>Jump to Section</span>
                      <ChevronDown
                        size={12}
                        className={`text-[#7A7A7A] transition-transform duration-200 ${
                          jumpMenuOpen ? "rotate-180 text-[#61F1AC]" : ""
                        }`}
                      />
                    </button>

                    {jumpMenuOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl py-1.5 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-150">
                        {SECTION_OPTIONS.map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => scrollToSection(sec.id)}
                            className="w-full text-left px-3.5 py-2 text-xs text-[#B5B5B5] hover:text-[#61F1AC] hover:bg-[#141414] transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>{sec.label}</span>
                            <span className="text-[10px] text-[#555555] font-mono">↓</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* DASHBOARD SHELVES (CAROUSEL OR GRID VIEW) */}
            <div className="space-y-8 pb-12">
              {/* 1. MANHWA SHELF */}
              {(activeTab === "all" || activeTab === "manhwa") && (
                viewMode === "carousel" ? (
                  <div id="section-manhwa" className="scroll-mt-24">
                    <MediaCarousel
                      title="Trending this week — Manhwa"
                      items={feeds.trendingManhwa}
                      isLoading={isLoadingFeeds}
                      seeAllLink="/books/manhwa"
                    />
                  </div>
                ) : (
                  <ShelfGrid
                    sectionId="section-manhwa"
                    title="Trending this week — Manhwa"
                    items={feeds.trendingManhwa}
                    isLoading={isLoadingFeeds}
                    catalogUrl="/books/manhwa"
                  />
                )
              )}

              {/* 2. MANGA SHELF */}
              {(activeTab === "all" || activeTab === "manga") && (
                viewMode === "carousel" ? (
                  <div id="section-manga" className="scroll-mt-24">
                    <MediaCarousel
                      title="Trending this week — Manga"
                      items={feeds.trendingManga}
                      isLoading={isLoadingFeeds}
                      seeAllLink="/books/manga"
                    />
                  </div>
                ) : (
                  <ShelfGrid
                    sectionId="section-manga"
                    title="Trending this week — Manga"
                    items={feeds.trendingManga}
                    isLoading={isLoadingFeeds}
                    catalogUrl="/books/manga"
                  />
                )
              )}

              {/* 3. BOOKS & NOVELS SHELF */}
              {(activeTab === "all" || activeTab === "novels") && (
                viewMode === "carousel" ? (
                  <div id="section-novels" className="scroll-mt-24">
                    <MediaCarousel
                      title="Trending this month — Novels & Books"
                      items={feeds.trendingBooks}
                      isLoading={isLoadingFeeds}
                      seeAllLink="/books/novels"
                    />
                  </div>
                ) : (
                  <ShelfGrid
                    sectionId="section-novels"
                    title="Trending this month — Novels & Books"
                    items={feeds.trendingBooks}
                    isLoading={isLoadingFeeds}
                    catalogUrl="/books/novels"
                  />
                )
              )}

              {/* 4. MANHUA SHELF */}
              {(activeTab === "all" || activeTab === "manhua") && (
                viewMode === "carousel" ? (
                  <div id="section-manhua" className="scroll-mt-24">
                    <MediaCarousel
                      title="Trending this month — Manhua"
                      items={feeds.trendingManhua}
                      isLoading={isLoadingFeeds}
                      seeAllLink="/books/manhua"
                    />
                  </div>
                ) : (
                  <ShelfGrid
                    sectionId="section-manhua"
                    title="Trending this month — Manhua"
                    items={feeds.trendingManhua}
                    isLoading={isLoadingFeeds}
                    catalogUrl="/books/manhua"
                  />
                )
              )}

              {/* 5. FAN FAVORITES SHELF */}
              {(activeTab === "all" || activeTab === "favorites") && (
                viewMode === "carousel" ? (
                  <div id="section-favorites" className="scroll-mt-24">
                    <MediaCarousel
                      title="Fan Favorites — All Time"
                      items={feeds.fanFavorites}
                      isLoading={isLoadingFeeds}
                      showRank={true}
                    />
                  </div>
                ) : (
                  <ShelfGrid
                    sectionId="section-favorites"
                    title="Fan Favorites — All Time"
                    items={feeds.fanFavorites}
                    isLoading={isLoadingFeeds}
                    showRank={true}
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
