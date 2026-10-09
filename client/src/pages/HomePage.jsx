import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Star, X } from "lucide-react";
import { HOME_TRENDING_ITEMS, DUNE_SEARCH_DATA } from "../data/mockData";
import { searchTmdb, getTrending, getTmdbImageUrl } from "../services/tmdb";

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [hoveredCardId, setHoveredCardId] = useState("interstellar");
  const [trendingItems, setTrendingItems] = useState(HOME_TRENDING_ITEMS);
  const [tmdbResults, setTmdbResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setTmdbResults([]);
      setIsSearching(false);
    }
  };

  // Keyboard shortcut: pressing "/" focuses the search bar; Escape clears it
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
        handleSearchChange("");
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live TMDB Trending update
  useEffect(() => {
    let mounted = true;
    async function loadTmdbData() {
      try {
        const liveTrending = await getTrending("movie", "week");
        if (mounted && liveTrending?.results && liveTrending.results.length >= 6) {
          const updated = HOME_TRENDING_ITEMS.map((item) => {
            const match = liveTrending.results.find(
              (r) => r.id === item.tmdbId || r.title?.toLowerCase() === item.title.toLowerCase()
            );
            if (match) {
              return {
                ...item,
                rating: match.vote_average ? match.vote_average.toFixed(1) : item.rating,
                poster: match.poster_path ? getTmdbImageUrl(match.poster_path, "w780") : item.poster
              };
            }
            return item;
          });
          setTrendingItems(updated);
        }
      } catch {
        // Fall back gracefully
      }
    }
    loadTmdbData();
    return () => {
      mounted = false;
    };
  }, []);

  // 1. Instant local matches across trending and Dune catalog
  const localMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const localPool = [
      ...HOME_TRENDING_ITEMS,
      ...DUNE_SEARCH_DATA.results.map((d) => ({
        id: d.id,
        title: d.title,
        year: d.year,
        rating: d.score,
        poster: d.poster,
        type: d.type,
        route: d.type === "SERIES" ? "/series/breaking-bad" : `/movie/${d.id}`
      }))
    ];

    return localPool.filter((item) =>
      item.title.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // 2. Real-time TMDB query debounced 200ms
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    let mounted = true;
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const tmdbData = await searchTmdb(q);
        if (mounted && tmdbData?.results && tmdbData.results.length > 0) {
          const formatted = tmdbData.results.map((item) => ({
            id: item.id,
            title: item.title,
            year: item.year,
            rating: item.score,
            poster: item.poster,
            type: item.type || "MOVIE",
            route: item.type === "SERIES" ? `/series/${item.id}` : `/movie/${item.id}`
          }));
          setTmdbResults(formatted);
        }
      } catch {
        // Fall back gracefully
      } finally {
        if (mounted) setIsSearching(false);
      }
    }, 200);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  // Combined search results
  const searchResults = useMemo(() => {
    const seen = new Set();
    const combined = [];
    for (const item of [...localMatches, ...tmdbResults]) {
      const key = item.title.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(item);
      }
    }
    return combined;
  }, [localMatches, tmdbResults]);

  const isSearchActive = searchQuery.trim().length > 0;

  // Filter search results by category
  const filteredResults = searchResults.filter((item) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Movies") return item.type === "MOVIE";
    if (activeFilter === "Series") return item.type === "SERIES";
    if (activeFilter === "Books") return item.type === "BOOK";
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#000000] text-[#F5F5F5] flex flex-col justify-between pt-16 pb-16 select-none">
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-[120px]">
        {/* CENTER HERO SECTION (Permanent search bar that NEVER disappears) */}
        <section className="flex flex-col items-center justify-center pt-8 pb-12 text-center">
          {/* Small tracked uppercase label "MOVIES" */}
          <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#7A7A7A] mb-3">
            MOVIES
          </span>

          {/* Large light-weight white headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-light tracking-tight text-[#F5F5F5] mb-9">
            What did you watch?
          </h1>

          {/* Centered pill search bar with subtle 5% radial mint glow */}
          <div className="relative w-full max-w-[620px] group">
            {/* Faint radial mint glow behind the input */}
            <div className="absolute -inset-1 bg-[#61F1AC] opacity-[0.05] group-hover:opacity-[0.08] focus-within:opacity-[0.14] blur-xl rounded-full transition-opacity duration-300 pointer-events-none" />

            <div className="relative w-full h-[54px] rounded-full bg-[#0B0B0B] border border-[#1C1C1C] focus-within:border-[#61F1AC]/60 px-5 flex items-center justify-between shadow-2xl transition-all">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <Search size={18} className="text-[#61F1AC] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search a movie to rate..."
                  className="w-full bg-transparent text-sm font-normal text-[#F5F5F5] placeholder-[#7A7A7A] focus:outline-none caret-[#61F1AC]"
                />
              </div>

              {/* Clear button or shortcut chip */}
              {isSearchActive ? (
                <button
                  type="button"
                  onClick={() => {
                    handleSearchChange("");
                    searchInputRef.current?.focus();
                  }}
                  className="flex items-center gap-1 text-xs text-[#7A7A7A] hover:text-[#F5F5F5] px-2 py-1 rounded cursor-pointer transition-colors"
                >
                  <X size={14} />
                  <span>Clear</span>
                </button>
              ) : (
                <kbd className="px-2 py-0.5 text-xs font-mono text-[#7A7A7A] bg-[#141414] border border-[#1C1C1C] rounded group-hover:text-[#F5F5F5] transition-colors">
                  /
                </kbd>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* DYNAMIC RESULTS SECTION DOWN HERE BELOW SEARCH            */}
        {/* ======================================================== */}
        {isSearchActive ? (
          <section className="mt-4 animate-in fade-in duration-200">
            {/* Search Header Row with count and filter chips */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[#1C1C1C] gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7A7A]">
                  Results for "{searchQuery}"
                </span>
                <span className="text-xs text-[#61F1AC] font-mono">
                  ({filteredResults.length} {filteredResults.length === 1 ? "title" : "titles"})
                </span>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5">
                {["All", "Movies", "Series"].map((filter) => {
                  const isActive = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? "bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/50"
                          : "text-[#7A7A7A] hover:text-[#F5F5F5] border border-[#1C1C1C]"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Grid or Empty State */}
            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {filteredResults.map((item) => (
                  <Link
                    key={item.id}
                    to={item.route}
                    className="group flex flex-col cursor-pointer transition-all"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] border border-[#1C1C1C] group-hover:border-[#61F1AC]/60 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.12)] transition-all duration-300">
                      <img
                        src={item.poster}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="mt-3 flex flex-col">
                      <span className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-white transition-colors">
                        {item.title}
                      </span>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-[#7A7A7A] font-tabular">
                          {item.year || "2024"}
                        </span>
                        <div className="flex items-center gap-1 text-[#61F1AC] font-medium font-tabular">
                          <Star size={11} className="fill-[#61F1AC]" />
                          <span>{item.rating || "8.0"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : isSearching ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="aspect-[2/3] w-full rounded-[12px] skeleton-shimmer border border-[#1C1C1C]" />
                    <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                    <div className="h-3 w-1/2 rounded skeleton-shimmer" />
                  </div>
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
                  Clear search &amp; show trending
                </button>
              </div>
            )}
          </section>
        ) : (
          /* DEFAULT: TRENDING THIS WEEK */
          <section className="mt-4 animate-in fade-in duration-200">
            {/* Section Header */}
            <div className="mb-5">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7A7A]">
                TRENDING THIS WEEK
              </span>
            </div>

            {/* 6-Column Grid of Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {trendingItems.map((item) => {
                const isSelected = hoveredCardId === item.id;

                return (
                  <Link
                    key={item.id}
                    to={item.route}
                    onMouseEnter={() => setHoveredCardId(item.id)}
                    className="group flex flex-col cursor-pointer transition-all"
                  >
                    {/* Poster Thumbnail */}
                    <div
                      className={`relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] transition-all duration-300 ${
                        isSelected
                          ? "border border-[#61F1AC] shadow-[0_0_24px_rgba(97,241,172,0.14)]"
                          : "border border-[#1C1C1C] group-hover:border-[#61F1AC]/50"
                      }`}
                    >
                      <img
                        src={item.poster}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Card Metadata */}
                    <div className="mt-3 flex flex-col">
                      <span className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-white transition-colors">
                        {item.title}
                      </span>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-[#7A7A7A] font-tabular">
                          {item.year}
                        </span>
                        <div className="flex items-center gap-1 text-[#61F1AC] font-medium font-tabular">
                          <Star size={11} className="fill-[#61F1AC]" />
                          <span>{item.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
