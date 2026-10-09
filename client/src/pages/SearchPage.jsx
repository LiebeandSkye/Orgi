import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ChevronDown, Star } from "lucide-react";
import { DUNE_SEARCH_DATA } from "../data/mockData";
import { searchTmdb } from "../services/tmdb";
import { Button } from "../components/ui/Button";

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "dune";
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Relevance");
  const [sortOpen, setSortOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(0); // First row in hover state by default as requested
  const [resultsData, setResultsData] = useState(DUNE_SEARCH_DATA);

  useEffect(() => {
    let mounted = true;
    async function performSearch() {
      if (queryParam) {
        try {
          const res = await searchTmdb(queryParam);
          if (mounted && res?.results && res.results.length > 0) {
            setResultsData(res);
          }
        } catch {
          // fallback
        }
      }
    }
    performSearch();
    return () => {
      mounted = false;
    };
  }, [queryParam]);

  const filterOptions = ["All", "Movies", "Series", "Books"];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchTerm });
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-24 pt-8">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px]">
        {/* Top Centered Section: 600px wide pill search input */}
        <div className="flex flex-col items-center mb-8">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-[600px] relative"
          >
            <div className="relative flex items-center">
              <Search
                size={18}
                className="absolute left-5 text-[#7A7A7A] pointer-events-none"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search movies, series, books…"
                className="w-full h-12 pl-12 pr-5 rounded-full bg-[#0B0B0B] border border-[#1C1C1C] text-sm text-[#F5F5F5] focus:outline-none focus:border-[#61F1AC]/50 caret-[#61F1AC] transition-all"
              />
            </div>
          </form>

          {/* Minimal Filter Chips Row */}
          <div className="w-full max-w-[900px] mt-6 flex items-center justify-between border-b border-[#1C1C1C] pb-4">
            <div className="flex items-center gap-2">
              {filterOptions.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "border border-[#61F1AC] text-[#F5F5F5] bg-transparent"
                        : "border border-[#1C1C1C] text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#333333]"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown Chip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[#7A7A7A] hover:text-[#F5F5F5] border border-[#1C1C1C] hover:border-[#61F1AC]/40 transition-colors cursor-pointer"
              >
                <span>Sort: {sortBy}</span>
                <ChevronDown size={12} className={sortOpen ? "rotate-180" : ""} />
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg py-1 shadow-2xl z-20">
                  {["Relevance", "Score (Highest)", "Year (Newest)", "Popularity"].map(
                    (opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSortBy(opt);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-1.5 text-xs transition-colors ${
                          sortBy === opt
                            ? "text-[#61F1AC] bg-[#141414]"
                            : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]"
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Count Line */}
        <div className="max-w-[900px] mx-auto mb-4">
          <p className="text-xs text-[#7A7A7A] font-light">
            24 results for '{queryParam}'
          </p>
        </div>

        {/* RESULTS: Clean vertical list instead of a grid, each row 120px tall with 1px dividers */}
        <div className="max-w-[900px] mx-auto flex flex-col border-t border-[#1C1C1C]">
          {(resultsData.results || DUNE_SEARCH_DATA.results).map((item, idx) => {
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => {
                  if (item.type === "SERIES") {
                    navigate("/series/breaking-bad");
                  } else if (item.type === "BOOK") {
                    navigate("/books/manhwa");
                  } else {
                    navigate(`/movie/${item.id}`);
                  }
                }}
                className={`h-[120px] flex items-center justify-between px-5 border-b border-[#1C1C1C] cursor-pointer transition-colors duration-150 ${
                  isHovered ? "bg-[#0B0B0B]" : "hover:bg-[#0B0B0B]"
                }`}
              >
                {/* Left: 2:3 poster thumbnail at 64px wide + Title + Meta + Synopsis */}
                <div className="flex items-center gap-5 min-w-0 mr-4">
                  {/* 2:3 poster thumbnail at 64px wide */}
                  <div className="w-[64px] h-[96px] rounded-[8px] overflow-hidden border border-[#1C1C1C] bg-[#141414] shrink-0">
                    <img
                      src={item.poster}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col min-w-0">
                    {/* Title in white 18px */}
                    <h2 className="text-[18px] font-medium text-[#F5F5F5] tracking-tight truncate">
                      {item.title}
                    </h2>

                    {/* Muted meta line */}
                    <span className="text-xs text-[#7A7A7A] font-normal mt-0.5 mb-1.5">
                      {item.year} · {item.genre} · {item.director}
                    </span>

                    {/* One-line muted synopsis */}
                    <p className="text-xs text-[#7A7A7A] font-light truncate max-w-lg">
                      {item.synopsis}
                    </p>
                  </div>
                </div>

                {/* Right: mint score with star & ghost "Rate" button */}
                <div className="flex items-center gap-6 shrink-0">
                  <div className="flex items-center gap-1.5 text-sm font-tabular text-[#61F1AC] font-semibold">
                    <Star size={13} className="fill-[#61F1AC]" />
                    <span>{item.score}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="px-3.5 py-1 text-xs rounded-lg hover:border-[#61F1AC] hover:text-[#61F1AC]"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Rate ${item.title}`);
                    }}
                  >
                    Rate
                  </Button>
                </div>
              </div>
            );
          })}

          {/* LOADING SKELETON ROW: at bottom in dark grey shimmer to show lazy-loading state */}
          <div className="h-[120px] flex items-center justify-between px-5 border-b border-[#1C1C1C]">
            <div className="flex items-center gap-5 min-w-0">
              {/* Thumbnail skeleton */}
              <div className="w-[64px] h-[96px] rounded-[8px] border border-[#1C1C1C] skeleton-shimmer shrink-0" />

              <div className="flex flex-col gap-2.5">
                {/* Title skeleton */}
                <div className="w-48 h-5 rounded skeleton-shimmer" />
                {/* Meta skeleton */}
                <div className="w-36 h-3 rounded skeleton-shimmer" />
                {/* Synopsis skeleton */}
                <div className="w-80 h-3 rounded skeleton-shimmer" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-12 h-5 rounded skeleton-shimmer" />
              <div className="w-16 h-7 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
