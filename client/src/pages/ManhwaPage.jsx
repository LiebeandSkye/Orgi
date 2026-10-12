import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Star, Grid, List, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchMangaDexByCategory, fetchBooks } from "../services/mediaApi";
import { BorderBeam } from "../components/ui/border-beam";

export function ManhwaPage() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState("grid");
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const [hoveredCardId, setHoveredCardId] = useState("m1"); // Card 1 in hover state with 1px mint border by default
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef(null);
  const prevCategoryRef = useRef(category);

  const setCurrentPage = (newPage) => {
    const next = Math.max(1, newPage);
    if (next === currentPage) return;
    setSearchParams(next === 1 ? {} : { page: String(next) });
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

  const [genreOpen, setGenreOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Top rated");

  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setisLoading] = useState(true);


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
      setSearchParams({});
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedQuery, setSearchParams]);


  useEffect(() => {
    if (prevCategoryRef.current !== category) {
      prevCategoryRef.current = category;
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [category]);

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
          data = await fetchMangaDexByCategory(cat, currentPage, debouncedQuery);
        }
        if (mounted) {
          setItems(data);
          setTotalPages(data.totalPages || (data.length < 18 ? currentPage : 18));
          if (data[0]) setHoveredCardId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch media:", err);
      } finally {
        if (mounted) setisLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [category, currentPage, debouncedQuery]);

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-24 pt-8 select-none">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px]">
        {/* Header + Search Box */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-[#F5F5F5]">
              {activeCat.title}
            </h1>
            <p className="text-xs text-[#7A7A7A] mt-1 font-normal">
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

        {/* Thin filter row: chips "Genre ⌄", "Status ⌄" (Ongoing / Completed), "Sort: Top rated ⌄", and grid/list toggle at right */}
        <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-5 mb-8">
          <div className="flex items-center gap-3">
            {/* Genre Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setGenreOpen(!genreOpen);
                  setStatusOpen(false);
                  setSortOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5] transition-colors cursor-pointer"
              >
                <span>{selectedGenre === "All" ? "Genre" : `Genre: ${selectedGenre} ⌄`}</span>
              </button>

              {genreOpen && (
                <div className="absolute left-0 top-full mt-2 w-40 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg py-1 shadow-2xl z-30">
                  {["All", "Action", "Fantasy", "Martial Arts", "Romance", "Thriller"].map(
                    (g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setSelectedGenre(g);
                          setGenreOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          selectedGenre === g
                            ? "text-[#61F1AC] bg-[#141414]"
                            : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]"
                        }`}
                      >
                        {g}
                      </button>
                    )
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5] transition-colors cursor-pointer"
              >
                <span>{selectedStatus === "All" ? "Status" : `Status: ${selectedStatus} ⌄`}</span>
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
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5] transition-colors cursor-pointer"
              >
                <span>Sort: {selectedSort}</span>
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
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-[#B5B5B5] hover:text-white hover:bg-[#141414]"
                      >
                        {so}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grid / List Toggle */}
          <div className="flex items-center border border-[#1C1C1C] rounded-lg p-0.5 bg-[#0B0B0B]">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
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
              className={`p-1.5 rounded-md transition-colors ${
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

        {/* 6-column grid of portrait cover cards with 16px gaps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => {
            const isHovered = hoveredCardId === item.id;

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

        {/* Minimal numbered pagination at bottom limited strictly to pages with data */}
        {items.length > 0 && totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-2 text-xs font-tabular">
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
              const pages = [];
              const start = Math.max(1, Math.min(currentPage - 1, totalPages - 3));
              const end = Math.min(totalPages, start + 3);
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
