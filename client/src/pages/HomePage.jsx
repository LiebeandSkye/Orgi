import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Star, X } from "lucide-react";
import {
  searchTmdb,
  getTrending,
  getTop10Trending,
  getTrendingMonth,
  getFanFavorites,
  getLatestMedia,
} from "../services/tmdb";
import { BorderBeam } from "../components/ui/border-beam";
import { CardSkeletonGrid } from "../components/ui/CardSkeleton";
import { MediaCarousel } from "../components/ui/MediaCarousel";
import { Banner } from "../components/ui/Banner";

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [trendingItems, setTrendingItems] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  const [top10Items, setTop10Items] = useState([]);
  const [isLoadingTop10, setIsLoadingTop10] = useState(true);

  const [trendingMonthItems, setTrendingMonthItems] = useState([]);
  const [isLoadingTrendingMonth, setIsLoadingTrendingMonth] = useState(true);

  const [fanFavoritesItems, setFanFavoritesItems] = useState([]);
  const [isLoadingFanFavorites, setIsLoadingFanFavorites] = useState(true);

  const [latestItems, setLatestItems] = useState([]);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
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

  // Fetch actual live TMDB categories on mount
  useEffect(() => {
    let mounted = true;

    // 1. Trending this week
    getTrending("all", "week")
      .then((live) => {
        if (mounted && live?.results) {
          setTrendingItems(live.results.slice(0, 16));
        }
      })
      .catch((err) => console.error("Failed to fetch trending this week:", err))
      .finally(() => {
        if (mounted) setIsLoadingTrending(false);
      });

    // 2. Top 10 trending
    getTop10Trending()
      .then((live) => {
        if (mounted && live?.results) {
          setTop10Items(live.results);
        }
      })
      .catch((err) => console.error("Failed to fetch top 10:", err))
      .finally(() => {
        if (mounted) setIsLoadingTop10(false);
      });

    // 3. Trending this month
    getTrendingMonth()
      .then((live) => {
        if (mounted && live?.results) {
          setTrendingMonthItems(live.results.slice(0, 16));
        }
      })
      .catch((err) => console.error("Failed to fetch trending this month:", err))
      .finally(() => {
        if (mounted) setIsLoadingTrendingMonth(false);
      });

    // 4. Fan favorites
    getFanFavorites()
      .then((live) => {
        if (mounted && live?.results) {
          setFanFavoritesItems(live.results.slice(0, 16));
        }
      })
      .catch((err) => console.error("Failed to fetch fan favorites:", err))
      .finally(() => {
        if (mounted) setIsLoadingFanFavorites(false);
      });

    // 5. Latest movies and series
    getLatestMedia()
      .then((live) => {
        if (mounted && live?.results) {
          setLatestItems(live.results.slice(0, 16));
        }
      })
      .catch((err) => console.error("Failed to fetch latest media:", err))
      .finally(() => {
        if (mounted) setIsLoadingLatest(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Real-time live TMDB Search debounced 200ms
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;

    let mounted = true;
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const tmdbData = await searchTmdb(q);
        if (mounted && tmdbData?.results) {
          setSearchResults(tmdbData.results);
        }
      } catch (err) {
        console.error("Failed to search TMDB:", err);
      } finally {
        if (mounted) setIsSearching(false);
      }
    }, 200);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const isSearchActive = searchQuery.trim().length > 0;

  // Filter search results by category
  const filteredResults = searchResults.filter((item) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Movies") return item.type === "MOVIE";
    if (activeFilter === "Series") return item.type === "SERIES";
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#000000] text-[#F5F5F5] flex flex-col justify-between pt-16 pb-16 select-none">
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-[120px]">
        {/* CENTER HERO SECTION (Permanent search bar that NEVER disappears) */}
        <section className="flex flex-col items-center justify-center pt-8 pb-12 text-center">
          {/* Small tracked uppercase label "MOVIES" */}
          <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[#7A7A7A] mb-3">
            MOVIES &amp; SERIES
          </span>

          {/* Large light-weight white headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-light tracking-tight text-[#F5F5F5] mb-9">
            What did you watch?
          </h1>

          {/* Centered pill search bar with animated BorderBeam */}
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
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search any movie or series to rate..."
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
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/50 shadow-[0_0_12px_rgba(97,241,172,0.15)]"
                          : "text-[#7A7A7A] bg-white/[0.04] border border-white/[0.05] hover:text-[#F5F5F5] hover:border-white/10"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Grid or Skeleton Loader */}
            {isSearching ? (
              <CardSkeletonGrid count={6} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" />
            ) : filteredResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {filteredResults.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.route}
                    className="group flex flex-col cursor-pointer transition-all"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] border border-[#1C1C1C] group-hover:border-[#61F1AC]/60 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.12)] transition-all duration-300">
                      {item.poster ? (
                        <img
                          src={item.poster}
                          alt={item.title}
                          loading="lazy"
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
                        <span className="text-[#7A7A7A] font-tabular">
                          {item.year || "—"}
                        </span>
                        <div className="flex items-center gap-1 text-[#61F1AC] font-medium font-tabular">
                          <Star size={11} className="fill-[#61F1AC]" />
                          <span>{item.score || "—"}</span>
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
                  onClick={() => handleSearchChange("")}
                  className="mt-4 px-4 py-1.5 rounded-full text-xs text-[#61F1AC] border border-[#61F1AC]/40 hover:bg-[#61F1AC]/10 transition-colors cursor-pointer"
                >
                  Clear search &amp; show trending
                </button>
              </div>
            )}
          </section>
        ) : (
          /* ======================================================== */
          /* HOME CATEGORIES AS USERS SCROLL                          */
          /* ======================================================== */
          <div className="space-y-6 animate-in fade-in duration-200 pb-12">
            <MediaCarousel
              title="Trending this week"
              items={trendingItems}
              isLoading={isLoadingTrending}
            />

            <Banner
              items={fanFavoritesItems}
              isLoading={isLoadingFanFavorites}
            />

            <MediaCarousel
              title="Trending this month"
              items={trendingMonthItems}
              isLoading={isLoadingTrendingMonth}
            />

            <MediaCarousel
              title="Fan favorites"
              items={fanFavoritesItems}
              isLoading={isLoadingFanFavorites}
            />

            <MediaCarousel
              title="Top 10 trending"
              items={top10Items}
              isLoading={isLoadingTop10}
              showRank={true}
            />

            <MediaCarousel
              title="Latest movies and series"
              items={latestItems}
              isLoading={isLoadingLatest}
            />
          </div>
        )}
      </div>
    </div>
  );
}
