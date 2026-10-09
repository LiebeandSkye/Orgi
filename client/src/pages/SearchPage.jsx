import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ChevronDown, Star } from "lucide-react";
import { searchTmdb } from "../services/tmdb";
import { Button } from "../components/ui/Button";
import { BorderBeam } from "../components/ui/border-beam";

/*
  Color system
  background  #000000   surfaces #0B0B0B   borders #1C1C1C
  text        #F5F5F5   muted    #7A7A7A
  mint #61F1AC -> ONLY ratings, active tab, primary button
*/

const FILTERS = ["All", "Movies", "Series", "Books"];
const SORTS = ["Relevance", "Top rated", "Newest"];

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "dune";

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Relevance");
  const [sortOpen, setSortOpen] = useState(false);
  const [resultsData, setResultsData] = useState({
    query: queryParam,
    totalResults: 0,
    results: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function performSearch() {
      if (!queryParam) return;
      setIsLoading(true);
      try {
        const res = await searchTmdb(queryParam);
        if (mounted && res?.results) setResultsData(res);
      } catch (err) {
        console.error("Failed to search TMDB:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    performSearch();
    return () => {
      mounted = false;
    };
  }, [queryParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) setSearchParams({ q: searchTerm.trim() });
  };

  const visibleResults = useMemo(() => {
    const filtered = (resultsData.results || []).filter((item) => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Movies") return item.type === "MOVIE";
      if (activeFilter === "Series") return item.type === "SERIES";
      return true;
    });

    if (sortBy === "Top rated") {
      return [...filtered].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    }
    if (sortBy === "Newest") {
      return [...filtered].sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    }
    return filtered;
  }, [resultsData.results, activeFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-24 pt-12">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px]">
        {/* ---------- Search bar with border beam ---------- */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-full max-w-[760px]">
            <BorderBeam
              size="md"
              colorVariant="mint"
              borderRadius={34}
              className="w-full rounded-full"
            >
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center w-full h-[68px] rounded-full bg-[#0B0B0B] border border-[#1C1C1C] pl-6 pr-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02),inset_0_1px_0_0_rgba(255,255,255,0.04)]"
              >
                <Search size={20} className="text-[#7A7A7A] shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search movies & series..."
                  className="flex-1 h-full bg-transparent px-4 text-base text-[#F5F5F5] placeholder-[#7A7A7A] focus:outline-none caret-[#F5F5F5]"
                />
                {/* Primary button -> mint */}
                <button
                  type="submit"
                  className="h-12 px-6 rounded-full bg-[#61F1AC] text-black text-sm font-semibold hover:brightness-110 active:brightness-95 transition cursor-pointer"
                >
                  Search
                </button>
              </form>
            </BorderBeam>
          </div>

          {/* Filter chips + sort */}
          <div className="w-full max-w-[760px] flex items-center justify-between mt-6 px-2">
            <div className="flex items-center gap-2">
              {FILTERS.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "text-[#61F1AC] bg-[#141414] border border-[#61F1AC]/50 shadow-[0_0_12px_rgba(97,241,172,0.15)]"
                        : "text-[#7A7A7A] bg-white/[0.04] border border-white/[0.05] hover:text-[#F5F5F5] hover:border-white/10"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs text-[#7A7A7A] hover:text-[#F5F5F5] bg-white/[0.04] border border-white/[0.05] hover:border-white/10 transition-all cursor-pointer"
              >
                <span>Sort: {sortBy}</span>
                <ChevronDown size={13} />
              </button>

              {sortOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl py-1 shadow-2xl z-20">
                  {SORTS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSortBy(opt);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer hover:bg-[#141414] ${
                        sortBy === opt ? "text-[#F5F5F5]" : "text-[#7A7A7A] hover:text-[#F5F5F5]"
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

        {/* Results count */}
        <div className="max-w-[900px] mx-auto mb-4">
          <p className="text-xs text-[#7A7A7A] font-light">
            {resultsData.totalResults || visibleResults.length} results for '{queryParam}'
          </p>
        </div>

        {/* ---------- Results list ---------- */}
        <div className="max-w-[900px] mx-auto flex flex-col border-t border-[#1C1C1C]">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[120px] flex items-center justify-between px-5 border-b border-[#1C1C1C] animate-pulse"
              >
                <div className="flex items-center gap-5">
                  <div className="w-[64px] h-[96px] rounded-[8px] bg-[#0B0B0B] border border-[#1C1C1C]" />
                  <div className="flex flex-col gap-2">
                    <div className="h-5 w-48 rounded bg-[#141414]" />
                    <div className="h-3 w-32 rounded bg-[#0B0B0B]" />
                    <div className="h-3 w-64 rounded bg-[#0B0B0B]" />
                  </div>
                </div>
                <div className="h-6 w-16 rounded bg-[#0B0B0B]" />
              </div>
            ))
          ) : visibleResults.length > 0 ? (
            visibleResults.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => navigate(item.route)}
                className="h-[120px] flex items-center justify-between px-5 border-b border-[#1C1C1C] cursor-pointer transition-colors duration-150 hover:bg-[#0B0B0B]"
              >
                <div className="flex items-center gap-5 min-w-0 mr-4">
                  <div className="w-[64px] h-[96px] rounded-[8px] overflow-hidden border border-[#1C1C1C] bg-[#0B0B0B] shrink-0">
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
                    <h2 className="text-[18px] font-medium text-[#F5F5F5] tracking-tight truncate">
                      {item.title}
                    </h2>

                    <div className="text-xs text-[#7A7A7A] tracking-tight mt-0.5 mb-1 flex items-center gap-2">
                      {item.year && <span>{item.year}</span>}
                      {item.genre && (
                        <>
                          <span>·</span>
                          <span>{item.genre}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="uppercase text-[10px] font-mono">{item.type}</span>
                    </div>

                    <p className="text-xs text-[#7A7A7A] line-clamp-1 max-w-[540px] font-light">
                      {item.synopsis || "Available on TMDB"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Rating -> mint */}
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[#61F1AC] font-mono">
                    <Star size={13} className="fill-[#61F1AC]" />
                    <span>{item.score || "—"}</span>
                  </div>

                  <Button
                    variant="outline"
                    className="h-8 px-3 text-xs rounded-lg border-[#1C1C1C] text-[#B5B5B5] hover:text-[#F5F5F5] hover:border-[#333333]"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(item.route);
                    }}
                  >
                    Rate
                  </Button>
                </div>
              </div>
            ))
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