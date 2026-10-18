import React, { useState, useEffect, useRef, useMemo } from "react"; 
import { Link, useSearchParams } from "react-router-dom"; 
import { 
  Search, 
  Star, 
  X, 
  ChevronDown, 
  LayoutGrid, 
  Columns3, 
  ArrowRight, 
} from "lucide-react"; 
import { MediaCarousel } from "../components/ui/MediaCarousel"; 
import { CardSkeletonGrid } from "../components/ui/CardSkeleton"; 
import { HeroCoverflow, CategoryTabs } from "../components/ui/HeroCoverFlow"; 
import { 
  fetchBooksDashboardFeeds, 
  getCachedBooksDashboardFeeds, 
  fetchCategoryHubFeeds, 
  getCachedCategoryHubFeeds, 
  searchMangaDex, 
  searchBooks, 
} from "../services/mediaApi"; 
 
const CATEGORY_TABS = [ 
  { key: "all", label: "All Literature", count: null, sectionId: null }, 
  { key: "manga", label: "Manga", count: "2.8k", sectionId: "section-manga" }, 
  { key: "manhwa", label: "Manhwa", count: "1.4k", sectionId: "section-manhwa" }, 
  { key: "manhua", label: "Manhua", count: "3.2k", sectionId: "section-manhua" }, 
  { key: "books", label: "Books", count: "3.5k", sectionId: "section-books" }, 
  { key: "novels", label: "Novels", count: "4.1k", sectionId: "section-novels" }, 
  { key: "favorites", label: "Fan Favorite", count: "Top", sectionId: "section-favorites" }, 
]; 
 
const SUB_FILTER_CHIPS = { 
  manga: [ 
    { key: "all", label: "All Manga" }, 
    { key: "completed", label: "Completed Series" }, 
    { key: "action", label: "Shonen Action" }, 
    { key: "darkFantasy", label: "Dark Fantasy" }, 
    { key: "masterpieces", label: "Masterpieces" }, 
    { key: "psychological", label: "Psychological" }, 
  ], 
  manhwa: [ 
    { key: "all", label: "All Manhwa" }, 
    { key: "completed", label: "Completed Series" }, 
    { key: "action", label: "Dungeon & Action" }, 
    { key: "darkFantasy", label: "Dark Fantasy" }, 
    { key: "masterpieces", label: "Masterpieces" }, 
    { key: "psychological", label: "Murim & Martial Arts" }, 
  ], 
  manhua: [ 
    { key: "all", label: "All Manhua" }, 
    { key: "completed", label: "Completed Series" }, 
    { key: "action", label: "Action & Wuxia" }, 
    { key: "darkFantasy", label: "Dark Fantasy" }, 
    { key: "masterpieces", label: "Masterpieces" }, 
    { key: "psychological", label: "Cultivation & Martial Arts" }, 
  ], 
  books: [ 
    { key: "all", label: "All Books" }, 
    { key: "completed", label: "Biographies & Memoirs" }, 
    { key: "action", label: "Science & Tech" }, 
    { key: "darkFantasy", label: "History & Culture" }, 
    { key: "masterpieces", label: "Masterpieces" }, 
    { key: "psychological", label: "Philosophy & Mind" }, 
  ], 
  novels: [ 
    { key: "all", label: "All Novels" }, 
    { key: "completed", label: "Completed Classics" }, 
    { key: "action", label: "Sci-Fi & Cyberpunk" }, 
    { key: "darkFantasy", label: "Epic Fantasy" }, 
    { key: "masterpieces", label: "Masterpieces" }, 
    { key: "psychological", label: "Mystery & Psychological" }, 
  ], 
}; 
 
const HUB_SHELF_CONFIG = { 
  manga: [ 
    { key: "trending", title: "TRENDING THIS WEEK — MANGA", showTopScore: true }, 
    { key: "masterpieces", title: "ALL-TIME MASTERPIECES (HALL OF FAME)", showRank: true, showTopScore: true }, 
    { key: "completed", title: "COMPLETED SERIES — BINGE TONIGHT", showTopScore: true }, 
    { key: "darkFantasy", title: "DARK FANTASY & PSYCHOLOGICAL", showTopScore: true }, 
    { key: "action", title: "SHONEN ACTION & HIGH-OCTANE BATTLES", showTopScore: true }, 
    { key: "psychological", title: "MIND GAMES & SUSPENSE THRILLERS", showTopScore: true }, 
  ], 
  manhwa: [ 
    { key: "trending", title: "TRENDING THIS WEEK — MANHWA", showTopScore: true }, 
    { key: "masterpieces", title: "ALL-TIME MASTERPIECES (HALL OF FAME)", showRank: true, showTopScore: true }, 
    { key: "completed", title: "COMPLETED SERIES — BINGE TONIGHT", showTopScore: true }, 
    { key: "darkFantasy", title: "DUNGEONS, TOWERS & DARK FANTASY", showTopScore: true }, 
    { key: "action", title: "HIGH-OCTANE ACTION & SYSTEM HITS", showTopScore: true }, 
    { key: "psychological", title: "MURIM & MARTIAL ARTS DYNASTIES", showTopScore: true }, 
  ], 
  manhua: [ 
    { key: "trending", title: "TRENDING THIS WEEK — MANHUA", showTopScore: true }, 
    { key: "masterpieces", title: "ALL-TIME MASTERPIECES (HALL OF FAME)", showRank: true, showTopScore: true }, 
    { key: "completed", title: "COMPLETED SERIES — BINGE TONIGHT", showTopScore: true }, 
    { key: "darkFantasy", title: "IMMORTAL REALMS & DARK FANTASY", showTopScore: true }, 
    { key: "action", title: "ACTION & SUPERNATURAL AWAKENING", showTopScore: true }, 
    { key: "psychological", title: "CULTIVATION, XIANXIA & MARTIAL ARTS", showTopScore: true }, 
  ], 
  books: [ 
    { key: "trending", title: "TRENDING THIS MONTH — NONFICTION & BOOKS", showTopScore: true }, 
    { key: "masterpieces", title: "HISTORICAL & TIMELESS MASTERPIECES", showRank: true, showTopScore: true }, 
    { key: "completed", title: "BIOGRAPHIES & MEMOIRS — ESSENTIAL READS", showTopScore: true }, 
    { key: "darkFantasy", title: "CULTURE, SOCIETY & EXPLORATION", showTopScore: true }, 
    { key: "action", title: "SCIENCE, DISCOVERY & TECHNOLOGY", showTopScore: true }, 
    { key: "psychological", title: "PHILOSOPHY, PSYCHOLOGY & THOUGHT", showTopScore: true }, 
  ], 
  novels: [ 
    { key: "trending", title: "TRENDING THIS MONTH — NOVELS", showTopScore: true }, 
    { key: "masterpieces", title: "ALL-TIME MASTERPIECES (HALL OF FAME)", showRank: true, showTopScore: true }, 
    { key: "completed", title: "COMPLETED CLASSICS — BINGE TONIGHT", showTopScore: true }, 
    { key: "darkFantasy", title: "EPIC FANTASY & WORLDBUILDING", showTopScore: true }, 
    { key: "action", title: "MIND-BENDING SCI-FI & CYBERPUNK", showTopScore: true }, 
    { key: "psychological", title: "PSYCHOLOGICAL THRILLERS & MYSTERY", showTopScore: true }, 
  ], 
}; 
 
const SECTION_OPTIONS = [ 
  { label: "Trending Manga", id: "section-manga" }, 
  { label: "Trending Manhwa", id: "section-manhwa" }, 
  { label: "Trending Manhua", id: "section-manhua" }, 
  { label: "Trending Books", id: "section-books" }, 
  { label: "Trending Novels", id: "section-novels" }, 
  { label: "Fan Favorites", id: "section-favorites" }, 
];

function ShelfGrid({ title, items, isLoading, sectionId, onExplore, showRank = false }) {
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
        {onExplore && (
          <button
            type="button"
            onClick={onExplore}
            className="text-xs text-[#7A7A7A] hover:text-[#61F1AC] transition-colors flex items-center gap-1 group font-medium cursor-pointer"
          >
            <span>Explore catalog</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
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

              {item.statusBadge ? (
                <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-0.5 rounded-full bg-[#61F1AC] text-black text-[10px] font-bold tracking-tight shadow-md">
                  {item.statusBadge}
                </div>
              ) : (
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center gap-1">
                  <Star size={10} className="fill-[#61F1AC] text-[#61F1AC]" />
                  <span className="text-[10px] font-tabular font-semibold text-[#61F1AC]">
                    {item.score || item.rating || "8.8"}
                  </span>
                </div>
              )}
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
  const [searchParams, setSearchParams] = useSearchParams(); 
  const tabParam = searchParams.get("tab"); 
  const validTabs = ["all", "manga", "manhwa", "manhua", "books", "novels", "favorites"]; 
 
  const [activeTab, setActiveTab] = useState(() => { 
    return validTabs.includes(tabParam) ? tabParam : "all"; 
  }); 
  const [activeSubFilter, setActiveSubFilter] = useState("all"); 
  const [viewMode, setViewMode] = useState("carousel"); 
  const [jumpMenuOpen, setJumpMenuOpen] = useState(false); 
  const jumpMenuRef = useRef(null); 
 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [debouncedQuery, setDebouncedQuery] = useState(""); 
  const searchInputRef = useRef(null); 
 
  const initialCached = useMemo(() => getCachedBooksDashboardFeeds(), []); 
  const [feeds, setFeeds] = useState( 
    initialCached || { 
      trendingManga: [], 
      trendingManhwa: [], 
      trendingManhua: [], 
      trendingBooks: [], 
      trendingNovels: [], 
      fanFavorites: [], 
    } 
  ); 
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(!initialCached); 
 
  const [hubFeedsByCat, setHubFeedsByCat] = useState(() => ({ 
    manga: getCachedCategoryHubFeeds("manga"), 
    manhwa: getCachedCategoryHubFeeds("manhwa"), 
    manhua: getCachedCategoryHubFeeds("manhua"), 
    books: getCachedCategoryHubFeeds("books"), 
    novels: getCachedCategoryHubFeeds("novels"), 
  })); 
  const [isLoadingHub, setIsLoadingHub] = useState(false); 
 
  const [searchResults, setSearchResults] = useState([]); 
  const [isSearching, setIsSearching] = useState(false); 
 
  const isCategoryHubActive = ["manga", "manhwa", "manhua", "books", "novels"].includes(activeTab); 
 
  useEffect(() => { 
    if (tabParam && validTabs.includes(tabParam)) { 
      if (activeTab !== tabParam) { 
        setActiveTab(tabParam); 
        setActiveSubFilter("all"); 
      } 
    } else if (!tabParam && activeTab !== "all") { 
      setActiveTab("all"); 
      setActiveSubFilter("all"); 
    } 
  }, [tabParam]); 
 
  useEffect(() => { 
    function handleClickOutside(e) {
      if (jumpMenuRef.current && !jumpMenuRef.current.contains(e.target)) {
        setJumpMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load main overview feeds on mount with progressive updates
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

  // Load dedicated Category Hub feeds whenever a category tab is selected
  useEffect(() => {
    if (!isCategoryHubActive) return;

    let mounted = true;
    const existingHub = hubFeedsByCat[activeTab] || getCachedCategoryHubFeeds(activeTab);
    if (!existingHub) {
      setIsLoadingHub(true);
    } else {
      setIsLoadingHub(false);
    }

    fetchCategoryHubFeeds(activeTab, (progressiveHub) => {
      if (mounted && progressiveHub) {
        setHubFeedsByCat((prev) => ({ ...prev, [activeTab]: progressiveHub }));
        if (
          progressiveHub.trending?.length > 0 ||
          progressiveHub.masterpieces?.length > 0 ||
          progressiveHub.completed?.length > 0
        ) {
          setIsLoadingHub(false);
        }
      }
    })
      .then((finalHub) => {
        if (mounted && finalHub) {
          setHubFeedsByCat((prev) => ({ ...prev, [activeTab]: finalHub }));
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingHub(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeTab, isCategoryHubActive]);

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
    if (activeTab === "manga") { 
      const mangaList = 
        hubFeedsByCat.manga?.masterpieces?.length > 0 
          ? hubFeedsByCat.manga.masterpieces 
          : feeds.trendingManga; 
      if (mangaList && mangaList.length > 0) { 
        return mangaList.slice(0, 6).map((item) => ({ ...item, badge: "Top Rated Manga" })); 
      } 
    } else if (activeTab === "manhwa") { 
      const manhwaList = 
        hubFeedsByCat.manhwa?.masterpieces?.length > 0 
          ? hubFeedsByCat.manhwa.masterpieces 
          : feeds.trendingManhwa; 
      if (manhwaList && manhwaList.length > 0) { 
        return manhwaList.slice(0, 6).map((item) => ({ ...item, badge: "Top Rated Manhwa" })); 
      } 
    } else if (activeTab === "manhua") { 
      const manhuaList = 
        hubFeedsByCat.manhua?.masterpieces?.length > 0 
          ? hubFeedsByCat.manhua.masterpieces 
          : feeds.trendingManhua; 
      if (manhuaList && manhuaList.length > 0) { 
        return manhuaList.slice(0, 6).map((item) => ({ ...item, badge: "Top Rated Manhua" })); 
      } 
    } else if (activeTab === "books") { 
      const booksList = 
        hubFeedsByCat.books?.trending?.length > 0 
          ? hubFeedsByCat.books.trending 
          : feeds.trendingBooks; 
      if (booksList && booksList.length > 0) { 
        return booksList.slice(0, 6).map((item) => ({ ...item, badge: "Featured Nonfiction & Books" })); 
      } 
    } else if (activeTab === "novels") { 
      const novelsList = 
        hubFeedsByCat.novels?.trending?.length > 0 
          ? hubFeedsByCat.novels.trending 
          : (feeds.trendingNovels?.length > 0 ? feeds.trendingNovels : feeds.trendingBooks); 
      if (novelsList && novelsList.length > 0) { 
        return novelsList.slice(0, 6).map((item) => ({ ...item, badge: "Featured Novel" })); 
      } 
    } else if (activeTab === "favorites") { 
      if (feeds.fanFavorites && feeds.fanFavorites.length > 0) { 
        return feeds.fanFavorites.slice(0, 6).map((item) => ({ ...item, badge: "Hall of Fame Favorite" })); 
      } 
    } 
 
    const pool = []; 
    if (feeds.trendingManga[0]) pool.push({ ...feeds.trendingManga[0], badge: "Trending Manga" }); 
    if (feeds.trendingManhwa[0]) pool.push({ ...feeds.trendingManhwa[0], badge: "Trending Manhwa" }); 
    if (feeds.trendingBooks[0]) pool.push({ ...feeds.trendingBooks[0], badge: "Trending Book" }); 
    if (feeds.trendingNovels?.[0]) pool.push({ ...feeds.trendingNovels[0], badge: "Trending Novel" }); 
    else if (feeds.trendingBooks[1]) pool.push({ ...feeds.trendingBooks[1], badge: "Featured Novel" }); 
    if (feeds.trendingManhua[0]) pool.push({ ...feeds.trendingManhua[0], badge: "Trending Manhua" }); 
    if (feeds.trendingManga[1]) pool.push({ ...feeds.trendingManga[1], badge: "Featured Manga" }); 
 
    return pool; 
  }, [activeTab, feeds, hubFeedsByCat]); 
 
  const handleTabClick = (tab) => { 
    setActiveTab(tab.key); 
    setActiveSubFilter("all"); 
    if (tab.key === "all") { 
      const next = new URLSearchParams(searchParams); 
      next.delete("tab"); 
      setSearchParams(next, { replace: true }); 
    } else { 
      setSearchParams({ tab: tab.key }, { replace: true }); 
    } 
  }; 
 
  const scrollToSection = (id) => { 
    setActiveTab("all"); 
    setActiveSubFilter("all"); 
    const next = new URLSearchParams(searchParams); 
    next.delete("tab"); 
    setSearchParams(next, { replace: true }); 
    setJumpMenuOpen(false); 
    setTimeout(() => { 
      const el = document.getElementById(id); 
      if (el) { 
        el.scrollIntoView({ behavior: "smooth", block: "start" }); 
      } 
    }, 50); 
  }; 
 
  const activeHubData = useMemo(() => { 
    if (!isCategoryHubActive) return null; 
    const raw = hubFeedsByCat[activeTab] || {}; 
    const overviewFallback = 
      activeTab === "manga" 
        ? feeds.trendingManga 
        : activeTab === "manhwa" 
        ? feeds.trendingManhwa 
        : activeTab === "manhua" 
        ? feeds.trendingManhua 
        : activeTab === "books" 
        ? feeds.trendingBooks 
        : (feeds.trendingNovels?.length > 0 ? feeds.trendingNovels : feeds.trendingBooks); 
 
    return { 
      trending: raw.trending?.length > 0 ? raw.trending : overviewFallback || [], 
      masterpieces: raw.masterpieces || [], 
      completed: raw.completed || [], 
      darkFantasy: raw.darkFantasy || [], 
      action: raw.action || [], 
      psychological: raw.psychological || [], 
    }; 
  }, [activeTab, isCategoryHubActive, hubFeedsByCat, feeds]); 
 
  return ( 
    <div className="min-h-[calc(100vh-64px)] bg-[#000000] text-[#F5F5F5] flex flex-col justify-between pt-3 sm:pt-4 pb-24 select-none overflow-x-hidden w-full max-w-full"> 
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-[120px]"> 
        <div className="mb-8 w-full max-w-full overflow-hidden"> 
          <HeroCoverflow items={spotlightPool} resetKey={activeTab} /> 
        </div>

        {/* ======================================================== */}
        {/* 2. CATEGORY TABS & CONTROLS (STICKY)                     */}
        {/* ======================================================== */}
        <div className="sticky top-16 z-30 bg-black/80 backdrop-blur-xl border-b border-white/[0.05] py-3 -mx-6 px-6 lg:-mx-[120px] lg:px-[120px] mb-8">
          <div className="flex items-center justify-between gap-4">
            {/* Tabs */}
            <div className="min-w-0">
              <CategoryTabs tabs={CATEGORY_TABS} active={activeTab} onChange={handleTabClick} />
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search */}
              <div className="relative w-36 sm:w-52 md:w-60">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-[#61F1AC]/50 focus:bg-white/[0.05] rounded-full pl-9 pr-8 py-2 text-xs text-[#F5F5F5] placeholder-white/30 focus:outline-none transition-all"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-1.5 text-[10px] font-mono text-white/30 bg-white/[0.04] border border-white/[0.06] rounded pointer-events-none">
                    /
                  </kbd>
                )}
              </div>

              {/* View toggle */}
              <div className="hidden sm:flex items-center bg-white/[0.03] border border-white/[0.06] rounded-full p-0.5">
                <button
                  type="button"
                  aria-label="Carousel View"
                  onClick={() => setViewMode("carousel")}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    viewMode === "carousel" ? "bg-white/[0.1] text-white" : "text-white/35 hover:text-white/80"
                  }`}
                >
                  <Columns3 size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Grid View"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-white/[0.1] text-white" : "text-white/35 hover:text-white/80"
                  }`}
                >
                  <LayoutGrid size={14} />
                </button>
              </div>

              {/* Jump to section */}
              {activeTab === "all" && (
                <div className="relative hidden md:block" ref={jumpMenuRef}>
                  <button
                    type="button"
                    onClick={() => setJumpMenuOpen(!jumpMenuOpen)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-white/55 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
                  >
                    <span>Jump to</span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-300 ${
                        jumpMenuOpen ? "rotate-180 text-[#61F1AC]" : "text-white/35"
                      }`}
                    />
                  </button>

                  {jumpMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#0B0B0B]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl py-1.5 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-150">
                      {SECTION_OPTIONS.map((sec) => (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => scrollToSection(sec.id)}
                          className="w-full text-left px-3.5 py-2 text-xs text-white/55 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <span>{sec.label}</span>
                          <span className="text-[10px] text-white/25 font-mono">↓</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEARCH RESULTS VIEW */}
        {isSearchActive ? (
          <section className="mt-4 animate-in fade-in duration-200 pb-12">
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
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* SUB-CATEGORY QUICK FILTER CHIPS */}
            {isCategoryHubActive && SUB_FILTER_CHIPS[activeTab] && (
              <div className="flex items-center justify-center gap-2 flex-wrap pt-1 pb-2 animate-in fade-in duration-200">
                {SUB_FILTER_CHIPS[activeTab].map((chip) => {
                  const isChipActive = activeSubFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setActiveSubFilter(chip.key)}
                      className={`px-4 py-1.5 rounded-full text-xs sm:text-[13px] transition-all duration-300 cursor-pointer ${
                        isChipActive
                          ? "bg-white text-black font-semibold"
                          : "bg-white/[0.03] border border-white/[0.07] text-white/55 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* DEDICATED CATEGORY HUB SHELVES OR OVERVIEW SHELVES */}
            {isCategoryHubActive && activeHubData ? (
              <div className="space-y-8 pb-12 animate-in fade-in duration-200">
                {(HUB_SHELF_CONFIG[activeTab] || [])
                  .filter((shelf) => activeSubFilter === "all" || activeSubFilter === shelf.key)
                  .map((shelf) => {
                    const shelfItems = activeHubData[shelf.key] || [];
                    const shelfLoading = isLoadingHub && shelfItems.length === 0;
                    return viewMode === "carousel" ? (
                      <div key={shelf.key} id={`hub-${activeTab}-${shelf.key}`} className="scroll-mt-24">
                        <MediaCarousel
                          title={shelf.title}
                          items={shelfItems}
                          isLoading={shelfLoading}
                          showRank={Boolean(shelf.showRank)}
                          showTopScore={Boolean(shelf.showTopScore)}
                        />
                      </div>
                    ) : (
                      <ShelfGrid 
                        key={shelf.key} 
                        sectionId={`hub-${activeTab}-${shelf.key}`} 
                        title={shelf.title} 
                        items={shelfItems} 
                        isLoading={shelfLoading} 
                        showRank={Boolean(shelf.showRank)} 
                      />
                    );
                  })}
              </div>
            ) : (
              /* OVERVIEW DASHBOARD SHELVES (ALL LITERATURE OR FAN FAVORITES) */
              <div className="space-y-8 pb-12"> 
                {/* 1. MANGA SHELF */} 
                {activeTab === "all" && ( 
                  viewMode === "carousel" ? ( 
                    <div id="section-manga" className="scroll-mt-24"> 
                      <MediaCarousel 
                        title="Trending this week — Manga" 
                        items={feeds.trendingManga} 
                        isLoading={isLoadingFeeds} 
                        showTopScore={true} 
                      /> 
                    </div> 
                  ) : ( 
                    <ShelfGrid 
                      sectionId="section-manga" 
                      title="Trending this week — Manga" 
                      items={feeds.trendingManga} 
                      isLoading={isLoadingFeeds} 
                      onExplore={() => { 
                        setActiveTab("manga"); 
                        setSearchParams({ tab: "manga" }, { replace: true }); 
                        window.scrollTo({ top: 0, behavior: "smooth" }); 
                      }} 
                    /> 
                  ) 
                )} 
 
                {/* 2. MANHWA SHELF */} 
                {activeTab === "all" && ( 
                  viewMode === "carousel" ? ( 
                    <div id="section-manhwa" className="scroll-mt-24"> 
                      <MediaCarousel 
                        title="Trending this week — Manhwa" 
                        items={feeds.trendingManhwa} 
                        isLoading={isLoadingFeeds} 
                        showTopScore={true} 
                      /> 
                    </div> 
                  ) : ( 
                    <ShelfGrid 
                      sectionId="section-manhwa" 
                      title="Trending this week — Manhwa" 
                      items={feeds.trendingManhwa} 
                      isLoading={isLoadingFeeds} 
                      onExplore={() => { 
                        setActiveTab("manhwa"); 
                        setSearchParams({ tab: "manhwa" }, { replace: true }); 
                        window.scrollTo({ top: 0, behavior: "smooth" }); 
                      }} 
                    /> 
                  ) 
                )} 
 
                {/* 3. MANHUA SHELF */} 
                {activeTab === "all" && ( 
                  viewMode === "carousel" ? ( 
                    <div id="section-manhua" className="scroll-mt-24"> 
                      <MediaCarousel 
                        title="Trending this month — Manhua" 
                        items={feeds.trendingManhua} 
                        isLoading={isLoadingFeeds} 
                        showTopScore={true} 
                      /> 
                    </div> 
                  ) : ( 
                    <ShelfGrid 
                      sectionId="section-manhua" 
                      title="Trending this month — Manhua" 
                      items={feeds.trendingManhua} 
                      isLoading={isLoadingFeeds} 
                      onExplore={() => { 
                        setActiveTab("manhua"); 
                        setSearchParams({ tab: "manhua" }, { replace: true }); 
                        window.scrollTo({ top: 0, behavior: "smooth" }); 
                      }} 
                    /> 
                  ) 
                )} 
 
                {/* 4. BOOKS SHELF */} 
                {activeTab === "all" && ( 
                  viewMode === "carousel" ? ( 
                    <div id="section-books" className="scroll-mt-24"> 
                      <MediaCarousel 
                        title="Trending this month — Books & Nonfiction" 
                        items={feeds.trendingBooks} 
                        isLoading={isLoadingFeeds} 
                        showTopScore={true} 
                      /> 
                    </div> 
                  ) : ( 
                    <ShelfGrid 
                      sectionId="section-books" 
                      title="Trending this month — Books & Nonfiction" 
                      items={feeds.trendingBooks} 
                      isLoading={isLoadingFeeds} 
                      onExplore={() => { 
                        setActiveTab("books"); 
                        setSearchParams({ tab: "books" }, { replace: true }); 
                        window.scrollTo({ top: 0, behavior: "smooth" }); 
                      }} 
                    /> 
                  ) 
                )} 
 
                {/* 5. NOVELS SHELF */} 
                {activeTab === "all" && ( 
                  viewMode === "carousel" ? ( 
                    <div id="section-novels" className="scroll-mt-24"> 
                      <MediaCarousel 
                        title="Trending this month — Novels & Fiction" 
                        items={feeds.trendingNovels?.length > 0 ? feeds.trendingNovels : feeds.trendingBooks} 
                        isLoading={isLoadingFeeds} 
                        showTopScore={true} 
                      /> 
                    </div> 
                  ) : ( 
                    <ShelfGrid 
                      sectionId="section-novels" 
                      title="Trending this month — Novels & Fiction" 
                      items={feeds.trendingNovels?.length > 0 ? feeds.trendingNovels : feeds.trendingBooks} 
                      isLoading={isLoadingFeeds} 
                      onExplore={() => { 
                        setActiveTab("novels"); 
                        setSearchParams({ tab: "novels" }, { replace: true }); 
                        window.scrollTo({ top: 0, behavior: "smooth" }); 
                      }} 
                    /> 
                  ) 
                )} 
 
                {/* 6. FAN FAVORITES SHELF */} 
                {(activeTab === "all" || activeTab === "favorites") && ( 
                  viewMode === "carousel" ? ( 
                    <div id="section-favorites" className="scroll-mt-24"> 
                      <MediaCarousel 
                        title="Fan Favorites — All Time" 
                        items={feeds.fanFavorites} 
                        isLoading={isLoadingFeeds} 
                        showRank={true} 
                        showTopScore={true} 
                      /> 
                    </div> 
                  ) : ( 
                    <ShelfGrid 
                      sectionId="section-favorites" 
                      title="Fan Favorites — All Time" 
                      items={feeds.fanFavorites} 
                      isLoading={isLoadingFeeds} 
                      showRank={true} 
                      onExplore={() => { 
                        setActiveTab("favorites"); 
                        setSearchParams({ tab: "favorites" }, { replace: true }); 
                        window.scrollTo({ top: 0, behavior: "smooth" }); 
                      }} 
                    /> 
                  ) 
                )} 
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}