import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Star, Grid, List, Search, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check } from "lucide-react";
import { fetchMangaDexByCategory, fetchBooks, AVAILABLE_GENRES } from "../services/mediaApi";
import { MANHWA_DATA } from "../data/mockData";
import { BorderBeam } from "../components/ui/border-beam";
import { CardSkeletonGrid } from "../components/ui/CardSkeleton";

export function ManhwaPage() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState(() => {
    try {
      return sessionStorage.getItem("orgi_books_view_mode") || "grid";
    } catch {
      return "grid";
    }
  });

  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const [hoveredCardId, setHoveredCardId] = useState("m1");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get("q") || "");
  const searchInputRef = useRef(null);
  const filterToolbarRef = useRef(null);
  const prevCategoryRef = useRef(category);


  const [selectedGenres, setSelectedGenres] = useState(() => {
    const fromUrl = searchParams.get("genres") || searchParams.get("genre");
    if (fromUrl && fromUrl !== "All") {
      return fromUrl.split(",").map((s) => s.trim()).filter(Boolean);
    }
    try {
      const saved = sessionStorage.getItem("orgi_books_genres");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const [selectedStatus, setSelectedStatus] = useState(() => {
    const fromUrl = searchParams.get("status");
    if (fromUrl) return fromUrl;
    try {
      const saved = sessionStorage.getItem("orgi_books_status");
      if (saved) return saved;
    } catch {}
    return "All";
  });

  const [selectedSort, setSelectedSort] = useState(() => {
    const fromUrl = searchParams.get("sort");
    if (fromUrl) return fromUrl;
    try {
      const saved = sessionStorage.getItem("orgi_books_sort");
      if (saved) return saved;
    } catch {}
    return "Top rated";
  });

  const [genreOpen, setGenreOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [genreSearch, setGenreSearch] = useState("");

  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setisLoading] = useState(true);


  useEffect(() => {
    try {
      sessionStorage.setItem("orgi_books_genres", JSON.stringify(selectedGenres));
    } catch {}
  }, [selectedGenres]);

  useEffect(() => {
    try {
      sessionStorage.setItem("orgi_books_status", selectedStatus);
    } catch {}
  }, [selectedStatus]);

  useEffect(() => {
    try {
      sessionStorage.setItem("orgi_books_sort", selectedSort);
    } catch {}
  }, [selectedSort]);

  useEffect(() => {
    try {
      sessionStorage.setItem("orgi_books_view_mode", viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (currentPage > 1) {
          next.set("page", String(currentPage));
        } else {
          next.delete("page");
        }

        if (selectedGenres.length > 0) {
          next.set("genres", selectedGenres.join(","));
          next.delete("genre");
        } else {
          next.delete("genres");
          next.delete("genre");
        }

        if (selectedStatus && selectedStatus !== "All") {
          next.set("status", selectedStatus);
        } else {
          next.delete("status");
        }

        if (selectedSort && selectedSort !== "Top rated") {
          next.set("sort", selectedSort);
        } else {
          next.delete("sort");
        }

        if (debouncedQuery.trim()) {
          next.set("q", debouncedQuery.trim());
        } else {
          next.delete("q");
        }

        if (next.toString() === prev.toString()) {
          return prev;
        }
        return next;
      },
      { replace: true }
    );
  }, [currentPage, selectedGenres, selectedStatus, selectedSort, debouncedQuery, setSearchParams]);

  const setCurrentPage = (newPage) => {
    const next = Math.max(1, newPage);
    if (next === currentPage) return;
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams(prev);
      if (next === 1) {
        nextParams.delete("page");
      } else {
        nextParams.set("page", String(next));
      }
      return nextParams;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoryTitles = {
    novels: { title: "Books & Novels", desc: "Literary fiction, modern classics, and serialized web novels" },
    books: { title: "Books & Novels", desc: "Literary fiction, modern classics, and serialized web novels" },
    manga: { title: "Manga", desc: "Japanese serialized comics, print graphic novels, and tankōbon" },
    manhwa: { title: "Manhwa", desc: "Korean webcomics, vertical scrolls, and webtoons" },
    manhua: { title: "Manhua", desc: "Chinese comics, martial arts cultivation, and webcomics" },
    "light-novels": { title: "Light Novels", desc: "Japanese illustrated light novels and serialized fiction" }
  };

  const activeCategorySlug = category?.toLowerCase() || "manhwa";
  const activeCat = categoryTitles[activeCategorySlug] || categoryTitles.manhwa;

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) => {
      const next = prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre];
      return next;
    });
    if (currentPage !== 1) setCurrentPage(1);
  };

  const clearGenres = () => {
    setSelectedGenres([]);
    try {
      sessionStorage.removeItem("orgi_books_genres");
    } catch {}
    if (currentPage !== 1) setCurrentPage(1);
  };


  useEffect(() => {
    function handleClickOutside(e) {
      if (filterToolbarRef.current && !filterToolbarRef.current.contains(e.target)) {
        setGenreOpen(false);
        setStatusOpen(false);
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => {
    if (searchQuery === debouncedQuery) return;
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (currentPage !== 1) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("page");
          return next;
        }, { replace: true });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedQuery, currentPage, setSearchParams]);


  useEffect(() => {
    if (prevCategoryRef.current !== category) {
      prevCategoryRef.current = category;
      setSearchQuery("");
      setDebouncedQuery("");
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("page");
          next.delete("q");
          return next;
        },
        { replace: true }
      );
    }
  }, [category, setSearchParams]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setisLoading(true);
      try {
        const cat = category?.toLowerCase() || "manhwa";
        let data = [];
        if (cat === "novels" || cat === "books" || cat === "light-novels") {
          data = await fetchBooks(currentPage, debouncedQuery);
        } else {
          data = await fetchMangaDexByCategory(
            cat,
            currentPage,
            debouncedQuery,
            selectedGenres,
            selectedStatus,
            selectedSort
          );
        }
        if (mounted) {
          setItems(data);
          const dataTotal = Number(data.totalPages);
          if (dataTotal && dataTotal > 0) {
            if (currentPage >= dataTotal && data.length >= 18) {
              setTotalPages(currentPage + 1);
            } else {
              setTotalPages(dataTotal);
            }
          } else if (data.length >= 18) {
            setTotalPages(currentPage + 1);
          } else {
            setTotalPages(Math.max(1, currentPage));
          }
          if (data[0]) setHoveredCardId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch media:", err);
        if (mounted && (category?.toLowerCase() || "manhwa") === "manhwa") {
          setItems(MANHWA_DATA);
          setTotalPages(1);
          if (MANHWA_DATA[0]) setHoveredCardId(MANHWA_DATA[0].id);
        }
      } finally {
        if (mounted) setisLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [category, currentPage, debouncedQuery, selectedGenres, selectedStatus, selectedSort]);

  const filteredItems = useMemo(() => {
    let result = (items || []).filter((item) => {
      // 1. Multi-genre filter
      if (selectedGenres.length > 0) {
        const itemGenres = [];
        if (Array.isArray(item.genres)) {
          itemGenres.push(...item.genres);
        } else if (typeof item.genres === "string") {
          itemGenres.push(...item.genres.split(",").map((s) => s.trim()));
        }
        if (typeof item.genre === "string") {
          itemGenres.push(...item.genre.split(",").map((s) => s.trim()));
        } else if (Array.isArray(item.genre)) {
          itemGenres.push(...item.genre);
        }
        if (Array.isArray(item.tags)) {
          item.tags.forEach((t) => {
            if (typeof t === "string") itemGenres.push(t);
            else if (t?.attributes?.name?.en) itemGenres.push(t.attributes.name.en);
            else if (t?.name) itemGenres.push(t.name);
          });
        }
        const matchesAll = selectedGenres.every((sg) =>
          itemGenres.some((ig) => {
            if (!ig) return false;
            const igl = ig.toLowerCase().trim();
            const sgl = sg.toLowerCase().trim();
            return igl === sgl || igl.includes(sgl) || sgl.includes(igl);
          })
        );
        if (!matchesAll) return false;
      }

      // 2. Status filter
      if (selectedStatus !== "All") {
        const itemStatus = (item.status || "").toLowerCase().trim();
        const selStatus = selectedStatus.toLowerCase().trim();
        const matchesStatus = itemStatus === selStatus || itemStatus.includes(selStatus);
        if (!matchesStatus) return false;
      }

      return true;
    });


    if (selectedSort === "Top rated") {
      result = [...result].sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
    } else if (selectedSort === "Most popular") {
      result = [...result].sort((a, b) => (Number(b.follows) || parseFloat(b.rating) || 0) - (Number(a.follows) || parseFloat(a.rating) || 0));
    } else if (selectedSort === "Latest update") {
      result = [...result].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
    } else if (selectedSort === "Alphabetical") {
      result = [...result].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return result;
  }, [items, selectedGenres, selectedStatus, selectedSort]);

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pt-12 md:pt-16 pb-32 md:pb-40 select-none">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px]">
        {/* Header + Search Box */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-[#F5F5F5]">
              {activeCat.title}
            </h1>
            <p className="text-xs text-[#7A7A7A] mt-1.5 font-normal">
              {activeCat.desc}
            </p>
          </div>

          <div className="relative w-full md:max-w-[440px] group">
            <BorderBeam
              size="md"
              colorVariant="mint"
              borderRadius={27}
              className="w-full rounded-full"
            >
              <div className="relative w-full h-[50px] rounded-full bg-[#0B0B0B] border border-[#1C1C1C] focus-within:border-[#61F1AC]/60 px-5 flex items-center justify-between shadow-2xl transition-all">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <Search size={18} className="text-[#61F1AC] shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeCat.title.toLowerCase()}...`}
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
        </div>

        {/* Thin filter row: chips "Genre", "Status" (Ongoing / Completed), "Sort: Top rated", and grid/list toggle at right */}
        <div ref={filterToolbarRef} className="flex items-center justify-between border-b border-[#1C1C1C] pb-6 mb-10 md:mb-12">
          <div className="flex items-center gap-3">
            {/* Genre Multi-Select Checkbox Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setGenreOpen(!genreOpen);
                  setStatusOpen(false);
                  setSortOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                  genreOpen || selectedGenres.length > 0
                    ? "text-[#F5F5F5] bg-[#141414] border border-[#61F1AC]/50 shadow-[0_0_12px_rgba(97,241,172,0.1)]"
                    : "text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5]"
                }`}
              >
                <span>
                  {selectedGenres.length === 0
                    ? "Genre"
                    : selectedGenres.length === 1
                    ? `Genre: ${selectedGenres[0]}`
                    : `Genres (${selectedGenres.length})`}
                </span>
                {selectedGenres.length > 1 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC]" />
                )}
                {genreOpen ? (
                  <ChevronUp size={14} className="text-[#61F1AC]" />
                ) : (
                  <ChevronDown
                    size={14}
                    className={selectedGenres.length > 0 ? "text-[#61F1AC]" : "text-[#7A7A7A]"}
                  />
                )}
              </button>

              {genreOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 md:w-72 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-2.5 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1C1C1C] px-1">
                    <span className="text-[11px] font-medium text-[#7A7A7A] uppercase tracking-wider">
                      Select Genres {selectedGenres.length > 0 && `(${selectedGenres.length})`}
                    </span>
                    {selectedGenres.length > 0 && (
                      <button
                        type="button"
                        onClick={clearGenres}
                        className="text-[11px] text-[#61F1AC] hover:underline cursor-pointer transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Filter search inside dropdown */}
                  <div className="relative mb-2">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A7A7A] pointer-events-none" />
                    <input
                      type="text"
                      value={genreSearch}
                      onChange={(e) => setGenreSearch(e.target.value)}
                      placeholder="Search genres..."
                      className="w-full bg-[#121212] border border-[#222222] focus:border-[#61F1AC]/60 rounded-lg pl-7 pr-7 py-1 text-xs text-[#F5F5F5] placeholder-[#666666] outline-none"
                    />
                    {genreSearch && (
                      <button
                        type="button"
                        onClick={() => setGenreSearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7A7A7A] hover:text-white cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Checkbox list */}
                  <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1 [scrollbar-width:thin] [scrollbar-color:#262626_transparent]">
                    {AVAILABLE_GENRES.filter((g) =>
                      g.toLowerCase().includes(genreSearch.toLowerCase().trim())
                    ).map((g) => {
                      const isChecked = selectedGenres.includes(g);
                      return (
                        <div
                          key={g}
                          onClick={() => toggleGenre(g)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors ${
                            isChecked
                              ? "bg-[#141414] text-[#F5F5F5]"
                              : "text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#121212]"
                          }`}
                        >
                          <span className={isChecked ? "font-medium text-white" : ""}>
                            {g}
                          </span>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${
                              isChecked
                                ? "bg-[#61F1AC] border-[#61F1AC] text-black"
                                : "border-[#2E2E2E] bg-[#121212] hover:border-[#61F1AC]/50"
                            }`}
                          >
                            {isChecked && <Check size={11} strokeWidth={3} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dropdown Footer summary */}
                  {selectedGenres.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-[#1C1C1C] flex items-center justify-between px-1">
                      <span className="text-[11px] text-[#7A7A7A]">
                        {selectedGenres.length} {selectedGenres.length === 1 ? "genre" : "genres"} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setGenreOpen(false)}
                        className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#141414] text-[#61F1AC] hover:bg-[#1C1C1C] border border-[#61F1AC]/30 cursor-pointer transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStatusOpen(!statusOpen);
                  setGenreOpen(false);
                  setSortOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                  statusOpen || selectedStatus !== "All"
                    ? "text-[#F5F5F5] bg-[#141414] border border-[#61F1AC]/50 shadow-[0_0_12px_rgba(97,241,172,0.1)]"
                    : "text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5]"
                }`}
              >
                <span>{selectedStatus === "All" ? "Status" : `Status: ${selectedStatus}`}</span>
                {statusOpen ? (
                  <ChevronUp size={14} className="text-[#61F1AC]" />
                ) : (
                  <ChevronDown
                    size={14}
                    className={selectedStatus !== "All" ? "text-[#61F1AC]" : "text-[#7A7A7A]"}
                  />
                )}
              </button>

              {statusOpen && (
                <div className="absolute left-0 top-full mt-2 w-36 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg py-1 shadow-2xl z-30">
                  {["All", "Ongoing", "Completed"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(s);
                        setStatusOpen(false);
                        if (currentPage !== 1) setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                        selectedStatus === s
                          ? "text-[#61F1AC] bg-[#141414]"
                          : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSortOpen(!sortOpen);
                  setGenreOpen(false);
                  setStatusOpen(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                  sortOpen
                    ? "text-[#F5F5F5] bg-[#141414] border border-[#61F1AC]/50 shadow-[0_0_12px_rgba(97,241,172,0.1)]"
                    : "text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5]"
                }`}
              >
                <span>Sort: {selectedSort}</span>
                {sortOpen ? (
                  <ChevronUp size={14} className="text-[#61F1AC]" />
                ) : (
                  <ChevronDown size={14} className="text-[#7A7A7A]" />
                )}
              </button>

              {sortOpen && (
                <div className="absolute left-0 top-full mt-2 w-40 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg py-1 shadow-2xl z-30">
                  {["Top rated", "Most popular", "Latest update", "Alphabetical"].map(
                    (so) => (
                      <button
                        key={so}
                        type="button"
                        onClick={() => {
                          setSelectedSort(so);
                          setSortOpen(false);
                          if (currentPage !== 1) setCurrentPage(1);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                          selectedSort === so
                            ? "text-[#61F1AC] bg-[#141414]"
                            : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]"
                        }`}
                      >
                        {so}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Clear filters button if active */}
            {(selectedGenres.length > 0 || selectedStatus !== "All" || selectedSort !== "Top rated") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGenres([]);
                  setSelectedStatus("All");
                  setSelectedSort("Top rated");
                  try {
                    sessionStorage.removeItem("orgi_books_genres");
                    sessionStorage.removeItem("orgi_books_status");
                    sessionStorage.removeItem("orgi_books_sort");
                  } catch {}
                  if (currentPage !== 1) setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-[#7A7A7A] hover:text-[#F5F5F5] bg-white/[0.04] border border-white/[0.06] transition-colors cursor-pointer"
                title="Clear filters"
              >
                <X size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Grid / List Toggle */}
          <div className="flex items-center border border-[#1C1C1C] rounded-lg p-0.5 bg-[#0B0B0B]">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#141414] text-[#61F1AC]"
                  : "text-[#7A7A7A] hover:text-white"
              }`}
              title="Grid view"
            >
              <Grid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#141414] text-[#61F1AC]"
                  : "text-[#7A7A7A] hover:text-white"
              }`}
              title="List view"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Results Grid, Skeleton Loader, or Empty State */}
        {isLoading ? (
          <CardSkeletonGrid count={18} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" />
        ) : filteredItems.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            }
          >
            {filteredItems.map((item) => {
              const isHovered = hoveredCardId === item.id;

              if (viewMode === "list") {
                return (
                  <Link
                    to={`/books/${activeCategorySlug}/${item.id}`}
                    key={item.id}
                    onMouseEnter={() => setHoveredCardId(item.id)}
                    className="group flex gap-3.5 p-2.5 rounded-[12px] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 transition-all cursor-pointer"
                  >
                    <div className="relative w-20 aspect-[2/3] shrink-0 rounded-[8px] overflow-hidden bg-[#141414] border border-[#1C1C1C]">
                      <img
                        src={item.cover}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                      <div>
                        <h3 className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-white">
                          {item.title}
                        </h3>
                        <span className="text-xs text-[#7A7A7A] truncate font-light mt-0.5 block">
                          {item.author}
                        </span>
                        {item.genre && (
                          <span className="text-[11px] text-[#61F1AC]/80 truncate font-light mt-1 block">
                            {item.genre}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#1C1C1C]/40">
                        <div className="flex items-center gap-1 font-tabular text-[#61F1AC] font-medium">
                          <Star size={11} className="fill-[#61F1AC]" />
                          <span>{item.rating}</span>
                        </div>
                        <span className="text-[11px] text-[#7A7A7A] font-tabular">
                          {item.chapters}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  to={`/books/${activeCategorySlug}/${item.id}`}
                  key={item.id}
                  onMouseEnter={() => setHoveredCardId(item.id)}
                  className="group flex flex-col cursor-pointer transition-all"
                >
                  {/* Cover with 12px radius, 1px border. One card in hover state with 1px mint border */}
                  <div
                    className={`relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] transition-all duration-200 mb-2.5 ${
                      isHovered
                        ? "border border-[#61F1AC] shadow-[0_0_20px_rgba(97,241,172,0.12)] scale-102"
                        : "border border-[#1C1C1C] group-hover:border-[#61F1AC]/50"
                    }`}
                  >
                    <img
                      src={item.cover}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Title in white */}
                  <h3 className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-white">
                    {item.title}
                  </h3>

                  {/* Author in muted grey */}
                  <span className="text-xs text-[#7A7A7A] truncate font-light mt-0.5">
                    {item.author}
                  </span>

                  {/* Small mint score and "Ch. 120" in muted */}
                  <div className="flex items-center justify-between text-xs mt-1.5 pt-1 border-t border-[#1C1C1C]/40">
                    <div className="flex items-center gap-1 font-tabular text-[#61F1AC] font-medium">
                      <Star size={11} className="fill-[#61F1AC]" />
                      <span>{item.rating}</span>
                    </div>

                    <span className="text-[11px] text-[#7A7A7A] font-tabular">
                      {item.chapters}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-20 md:py-24 text-center">
            <p className="text-sm text-[#7A7A7A] font-light">
              No titles found
              {isSearchActive ? ` matching "${searchQuery}"` : ""}
              {selectedGenres.length > 0 ? ` for genres "${selectedGenres.join(", ")}"` : ""}
              {selectedStatus !== "All" ? ` with status "${selectedStatus}"` : ""}.
            </p>
            {(isSearchActive || selectedGenres.length > 0 || selectedStatus !== "All" || selectedSort !== "Top rated") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setDebouncedQuery("");
                  setSelectedGenres([]);
                  setSelectedStatus("All");
                  setSelectedSort("Top rated");
                  try {
                    sessionStorage.removeItem("orgi_books_genres");
                    sessionStorage.removeItem("orgi_books_status");
                    sessionStorage.removeItem("orgi_books_sort");
                  } catch {}
                  if (currentPage !== 1) setCurrentPage(1);
                  searchInputRef.current?.focus();
                }}
                className="mt-4 px-4 py-1.5 rounded-full text-xs text-[#61F1AC] border border-[#61F1AC]/40 hover:bg-[#61F1AC]/10 transition-colors cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Minimal numbered pagination at bottom limited strictly to pages with data */}
        {!isLoading && filteredItems.length > 0 && totalPages > 1 && (
          <div className="mt-20 md:mt-24 flex items-center justify-center gap-2 text-xs font-tabular">
            {/* Previous 1 page button */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft size={14} />
            </button>

            {(() => {
              const windowSize = 2;
              let start = Math.max(1, currentPage - windowSize);
              let end = Math.min(totalPages, currentPage + windowSize);

              if (currentPage <= 3) {
                end = Math.min(totalPages, 5);
              }
              if (currentPage >= totalPages - 2) {
                start = Math.max(1, totalPages - 4);
              }

              const pages = [];
              for (let p = start; p <= end; p++) {
                pages.push(p);
              }
              return (
                <>
                  {start > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B] transition-colors cursor-pointer"
                      >
                        1
                      </button>
                      {start > 2 && <span className="text-[#3A3A3A] px-1">…</span>}
                    </>
                  )}

                  {pages.map((page) => {
                    const isCurrent = currentPage === page;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          isCurrent
                            ? "bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/50 font-semibold"
                            : "text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B]"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {end < totalPages && (
                    <>
                      {end < totalPages - 1 && (
                        <span className="text-[#3A3A3A] px-1">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          currentPage === totalPages
                            ? "bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/50 font-semibold"
                            : "text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B]"
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </>
              );
            })()}

            {/* Next 1 page button */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
