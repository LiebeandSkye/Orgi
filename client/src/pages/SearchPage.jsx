import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ChevronDown, Star } from "lucide-react";
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
  const [hoveredIdx, setHoveredIdx] = useState(0);
  const [resultsData, setResultsData] = useState({ query: queryParam, totalResults: 0, results: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function performSearch() {
      if (queryParam) {
        setIsLoading(true);
        try {
          const res = await searchTmdb(queryParam);
          if (mounted && res?.results) {
            setResultsData(res);
          }
        } catch (err) {
          console.error("Failed to search TMDB:", err);
        } finally {
          if (mounted) setIsLoading(false);
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
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  };

  const filteredResults = (resultsData.results || []).filter((item) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Movies") return item.type === "MOVIE";
    if (activeFilter === "Series") return item.type === "SERIES";
    return true;
  });

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
                placeholder="Search movies & series on TMDB..."
                className="w-full h-[52px] pl-12 pr-6 rounded-full bg-[#0B0B0B] border border-[#1C1C1C] focus:border-[#61F1AC]/60 text-sm text-[#F5F5F5] placeholder-[#7A7A7A] focus:outline-none caret-[#61F1AC] transition-all shadow-lg"
              />
            </div>
          </form>

          {/* Minimal Filter Chips Row */}
          <div className="w-full max-w-[600px] flex items-center justify-between mt-5">
            {/* Filter Chips */}
            <div className="flex items-center gap-2">
              {filterOptions.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3.5 py-1 rounded-full text-xs font-normal transition-colors cursor-pointer ${
                      isActive
                        ? "text-[#61F1AC] border border-[#61F1AC] bg-[#0B0B0B]"
                        : "text-[#7A7A7A] hover:text-[#F5F5F5] border border-[#1C1C1C] hover:border-[#333333]"
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
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-[#7A7A7A] hover:text-[#F5F5F5] border border-[#1C1C1C] hover:border-[#333333] transition-colors cursor-pointer"
              >
                <span>Sort: {sortBy}</span>
                <ChevronDown size={13} className="text-[#7A7A7A]" />
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl py-1 shadow-2xl z-20">
                  {["Relevance", "Top rated", "Newest"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortBy(opt);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
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
        </div>

        {/* Results Count Line */}
        <div className="max-w-[900px] mx-auto mb-4">
          <p className="text-xs text-[#7A7A7A] font-light">
            {resultsData.totalResults || filteredResults.length} results for '{queryParam}'
          </p>
        </div>

        {/* RESULTS: Clean vertical list instead of a grid, each row 120px tall with 1px dividers */}
        <div className="max-w-[900px] mx-auto flex flex-col border-t border-[#1C1C1C]">
          {isLoading ? (
            /* Skeleton Shimmer Loading Rows */
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[120px] flex items-center justify-between px-5 border-b border-[#1C1C1C] animate-pulse"
              >
                <div className="flex items-center gap-5">
                  <div className="w-[64px] h-[96px] rounded-[8px] bg-[#141414] border border-[#1C1C1C]" />
                  <div className="flex flex-col gap-2">
                    <div className="h-5 w-48 rounded bg-[#161616]" />
                    <div className="h-3 w-32 rounded bg-[#141414]" />
                    <div className="h-3 w-64 rounded bg-[#141414]" />
                  </div>
                </div>
                <div className="h-6 w-16 rounded bg-[#141414]" />
              </div>
            ))
          ) : filteredResults.length > 0 ? (
            filteredResults.map((item, idx) => {
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onClick={() => navigate(item.route)}
                  className={`h-[120px] flex items-center justify-between px-5 border-b border-[#1C1C1C] cursor-pointer transition-colors duration-150 ${
                    isHovered ? "bg-[#0B0B0B]" : "hover:bg-[#0B0B0B]"
                  }`}
                >
                  {/* Left: 2:3 poster thumbnail at 64px wide + Title + Meta + Synopsis */}
                  <div className="flex items-center gap-5 min-w-0 mr-4">
                    {/* 2:3 poster thumbnail at 64px wide */}
                    <div className="w-[64px] h-[96px] rounded-[8px] overflow-hidden border border-[#1C1C1C] bg-[#141414] shrink-0">
                      {item.poster ? (
                        <img
                          src={item.poster}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#7A7A7A] p-1 text-center">
                          {item.title}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      {/* Title in white 18px */}
                      <h2 className="text-[18px] font-medium text-[#F5F5F5] tracking-tight truncate">
                        {item.title}
                      </h2>

                      {/* Muted meta line */}
                      <div className="text-xs text-[#7A7A7A] font-normal tracking-tight mt-0.5 mb-1 flex items-center gap-2">
                        {item.year && <span>{item.year}</span>}
                        {item.genre && (
                          <>
                            <span>·</span>
                            <span>{item.genre}</span>
                          </>
                        )}
                        <span>·</span>
                        <span className="uppercase text-[10px] text-[#61F1AC]/80 font-mono">
                          {item.type}
                        </span>
                      </div>

                      {/* One-line muted synopsis */}
                      <p className="text-xs text-[#7A7A7A] line-clamp-1 max-w-[540px] font-light">
                        {item.synopsis || "Available on TMDB"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Mint score "8.0" with a star and a ghost "Rate" button */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-[#61F1AC] font-mono">
                      <Star size={13} className="fill-[#61F1AC]" />
                      <span>{item.score || "—"}</span>
                    </div>

                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs rounded-lg border-[#1C1C1C] text-[#B5B5B5] hover:text-[#F5F5F5] hover:border-[#61F1AC]/40"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.route);
                      }}
                    >
                      Rate
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm text-[#7A7A7A] font-light">
                No TMDB results found for "{queryParam}".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
