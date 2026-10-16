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
import { MediaCarousel } from "../components/ui/MediaCarousel";
import { CardSkeletonGrid } from "../components/ui/CardSkeleton";
import {
  fetchBooksDashboardFeeds,
  getCachedBooksDashboardFeeds,
  fetchCategoryHubFeeds,
  getCachedCategoryHubFeeds,
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
  novels: [
    { key: "all", label: "All Books & Novels" },
    { key: "completed", label: "Completed Classics" },
    { key: "action", label: "Sci-Fi & Cyberpunk" },
    { key: "darkFantasy", label: "Epic Fantasy" },
    { key: "masterpieces", label: "Masterpieces" },
    { key: "psychological", label: "Mystery & Psychological" },
  ],
};

const HUB_SHELF_CONFIG = {
  manga: [
    { key: "trending", title: "TRENDING THIS WEEK — MANGA", showTopScore: true, catalogUrl: "/books/manga" },
    { key: "masterpieces", title: "ALL-TIME MASTERPIECES (HALL OF FAME)", showRank: true, showTopScore: true, catalogUrl: "/books/manga" },
    { key: "completed", title: "COMPLETED SERIES — BINGE TONIGHT", showTopScore: true, catalogUrl: "/books/manga" },
    { key: "darkFantasy", title: "DARK FANTASY & PSYCHOLOGICAL", showTopScore: true, catalogUrl: "/books/manga" },
    { key: "action", title: "SHONEN ACTION & HIGH-OCTANE BATTLES", showTopScore: true, catalogUrl: "/books/manga" },
    { key: "psychological", title: "MIND GAMES & SUSPENSE THRILLERS", showTopScore: true, catalogUrl: "/books/manga" },
  ],
  manhwa: [
    { key: "trending", title: "TRENDING THIS WEEK — MANHWA", showTopScore: true, catalogUrl: "/books/manhwa" },
    { key: "masterpieces", title: "ALL-TIME MASTERPIECES (HALL OF FAME)", showRank: true, showTopScore: true, catalogUrl: "/books/manhwa" },
    { key: "completed", title: "COMPLETED SERIES — BINGE TONIGHT", showTopScore: true, catalogUrl: "/books/manhwa" },
    { key: "darkFantasy", title: "DUNGEONS, TOWERS & DARK FANTASY", showTopScore: true, catalogUrl: "/books/manhwa" },
    { key: "action", title: "HIGH-OCTANE ACTION & SYSTEM HITS", showTopScore: true, catalogUrl: "/books/manhwa" },
    { key: "psychological", title: "MURIM & MARTIAL ARTS DYNASTIES", showTopScore: true, catalogUrl: "/books/manhwa" },
  ],
  manhua: [
    { key: "trending", title: "TRENDING THIS WEEK — MANHUA", showTopScore: true, catalogUrl: "/books/manhua" },
    { key: "masterpieces", title: "ALL-TIME MASTERPIECES (HALL OF FAME)", showRank: true, showTopScore: true, catalogUrl: "/books/manhua" },
    { key: "completed", title: "COMPLETED SERIES — BINGE TONIGHT", showTopScore: true, catalogUrl: "/books/manhua" },
    { key: "darkFantasy", title: "IMMORTAL REALMS & DARK FANTASY", showTopScore: true, catalogUrl: "/books/manhua" },
    { key: "action", title: "ACTION & SUPERNATURAL AWAKENING", showTopScore: true, catalogUrl: "/books/manhua" },
    { key: "psychological", title: "CULTIVATION, XIANXIA & MARTIAL ARTS", showTopScore: true, catalogUrl: "/books/manhua" },
  ],
  novels: [
    { key: "trending", title: "TRENDING THIS MONTH — NOVELS & BOOKS", showTopScore: true, catalogUrl: "/books/novels" },
    { key: "masterpieces", title: "ALL-TIME MASTERPIECES (HALL OF FAME)", showRank: true, showTopScore: true, catalogUrl: "/books/novels" },
    { key: "completed", title: "COMPLETED SERIES — BINGE TONIGHT", showTopScore: true, catalogUrl: "/books/novels" },
    { key: "darkFantasy", title: "EPIC FANTASY & WORLDBUILDING", showTopScore: true, catalogUrl: "/books/novels" },
    { key: "action", title: "MIND-BENDING SCI-FI & CYBERPUNK", showTopScore: true, catalogUrl: "/books/novels" },
    { key: "psychological", title: "PSYCHOLOGICAL THRILLERS & MYSTERY", showTopScore: true, catalogUrl: "/books/novels" },
  ],
};

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
  const [activeTab, setActiveTab] = useState("all");
  const [activeSubFilter, setActiveSubFilter] = useState("all");
  const [viewMode, setViewMode] = useState("carousel");
  const [jumpMenuOpen, setJumpMenuOpen] = useState(false);
  const jumpMenuRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef(null);

  // Instant 0ms cache hydration for Overview feeds
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

  // Dedicated Category Hub feeds state (keyed by category: manga, manhwa, manhua, novels)
  const [hubFeedsByCat, setHubFeedsByCat] = useState(() => ({
    manga: getCachedCategoryHubFeeds("manga"),
    manhwa: getCachedCategoryHubFeeds("manhwa"),
    manhua: getCachedCategoryHubFeeds("manhua"),
    novels: getCachedCategoryHubFeeds("novels"),
  }));
  const [isLoadingHub, setIsLoadingHub] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inListMap, setInListMap] = useState({});
  const [heroIndex, setHeroIndex] = useState(0);

  const isCategoryHubActive = ["manga", "manhwa", "manhua", "novels"].includes(activeTab);

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

  // Contextual Spotlight Pool (adapts dynamically to the active category tab!)
  const spotlightPool = useMemo(() => {
    if (activeTab === "manga") {
      const mangaList =
        hubFeedsByCat.manga?.masterpieces?.length > 0
          ? hubFeedsByCat.manga.masterpieces
          : feeds.trendingManga;
      if (mangaList && mangaList.length > 0) {
        return mangaList.slice(0, 5).map((item) => ({
          ...item,
          badge: "Top Rated Manga",
        }));
      }
    } else if (activeTab === "manhwa") {
      const manhwaList =
        hubFeedsByCat.manhwa?.masterpieces?.length > 0
          ? hubFeedsByCat.manhwa.masterpieces
          : feeds.trendingManhwa;
      if (manhwaList && manhwaList.length > 0) {
        return manhwaList.slice(0, 5).map((item) => ({
          ...item,
          badge: "Top Rated Manhwa",
        }));
      }
    } else if (activeTab === "manhua") {
      const manhuaList =
        hubFeedsByCat.manhua?.masterpieces?.length > 0
          ? hubFeedsByCat.manhua.masterpieces
          : feeds.trendingManhua;
      if (manhuaList && manhuaList.length > 0) {
        return manhuaList.slice(0, 5).map((item) => ({
          ...item,
          badge: "Top Rated Manhua",
        }));
      }
    } else if (activeTab === "novels") {
      const booksList =
        hubFeedsByCat.novels?.trending?.length > 0
          ? hubFeedsByCat.novels.trending
          : feeds.trendingBooks;
      if (booksList && booksList.length > 0) {
        return booksList.slice(0, 5).map((item) => ({
          ...item,
          badge: "Featured Book / Novel",
        }));
      }
    } else if (activeTab === "favorites") {
      if (feeds.fanFavorites && feeds.fanFavorites.length > 0) {
        return feeds.fanFavorites.slice(0, 5).map((item) => ({
          ...item,
          badge: "Hall of Fame Favorite",
        }));
      }
    }

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
  }, [activeTab, feeds, hubFeedsByCat]);

  const currentHero = spotlightPool[heroIndex % spotlightPool.length] || spotlightPool[0];

  const heroGenres = useMemo(() => {
    if (Array.isArray(currentHero.genres) && currentHero.genres.length > 0) {
      return currentHero.genres.slice(0, 4);
    }
    if (typeof currentHero.genre === "string" && currentHero.genre.trim()) {
      return currentHero.genre
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4);
    }
    if (currentHero.type === "MANHWA") return ["Action", "Fantasy", "Reincarnation", "Supernatural"];
    if (currentHero.type === "MANGA") return ["Action", "Shonen", "Fantasy", "Adventure"];
    if (currentHero.type === "MANHUA") return ["Action", "Martial Arts", "Cultivation", "Fantasy"];
    if (currentHero.type === "NOVELS") return ["Fiction", "Literature", "Bestseller"];
    return ["Action", "Fantasy", "Trending"];
  }, [currentHero]);

  useEffect(() => {
    setHeroIndex(0);
  }, [activeTab]);

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
    setActiveSubFilter("all");
  };

  const scrollToSection = (id) => {
    setActiveTab("all");
    setActiveSubFilter("all");
    setJumpMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  // Resolve current category hub shelves with instant fallback to overview feed for the first shelf
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
        : feeds.trendingBooks;

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
    <div className="min-h-[calc(100vh-64px)] bg-[#000000] text-[#F5F5F5] flex flex-col justify-between pt-3 sm:pt-4 pb-24 select-none">
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-[120px]">
        {/* ======================================================== */}
        {/* 1. HERO SPOTLIGHT BANNER (DIRECTLY BELOW NAVBAR)         */}
        {/* ======================================================== */}
        <section className="group relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#1C1C1C] bg-[#0A0A0A] shadow-2xl transition-all duration-500 min-h-[340px] sm:min-h-[380px] md:min-h-[420px] flex flex-col justify-between mb-6">
          {/* Backdrop Image with Cinematic Overlays */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img
              key={currentHero.id}
              src={currentHero.backdrop || currentHero.cover || currentHero.poster}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700 ease-out filter brightness-[0.7] contrast-[1.05]"
            />

            {/* Ambient Dark Gradients for contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 sm:via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

            {/* Subtle Neon Mint Aura */}
            <div className="absolute top-1/4 left-10 w-96 h-60 bg-[#61F1AC]/[0.05] blur-[120px] rounded-full pointer-events-none" />
          </div>

          {/* Foreground Content Stack */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col justify-between h-full flex-1 min-h-[340px] sm:min-h-[380px] md:min-h-[420px]">
            {/* Top Row: Rating Badge & MangaDex-Style Tag Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#61F1AC] text-black shadow-[0_0_15px_rgba(97,241,172,0.35)]">
                  <Star size={11} className="fill-black text-black" />
                  <span>{currentHero.score || currentHero.rating || "9.2"}</span>
                </span>

                <span className="text-xs text-[#A3A3A3] font-medium font-mono">
                  Bayesian{currentHero.chapters ? ` · ${currentHero.chapters}` : ""}{currentHero.badge ? ` · ${currentHero.badge}` : ""}
                </span>
              </div>

              {/* MangaDex Genre / Content Tag Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {heroGenres.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-white/[0.08] border border-white/[0.12] text-[#E0E0E0] backdrop-blur-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Center: Title & Synopsis */}
            <div className="max-w-2xl my-auto py-2">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white mb-3 line-clamp-2 drop-shadow-lg">
                {currentHero.title}
              </h1>

              <p className="text-xs sm:text-sm text-[#CCCCCC] font-light leading-relaxed line-clamp-3 mb-3 drop-shadow">
                {currentHero.synopsis || "Explore one of the highest-rated titles across the community reading list."}
              </p>

              <p className="text-xs sm:text-sm text-[#888888] font-light">
                Author: <span className="text-[#F5F5F5] font-medium italic">{currentHero.author || "Editorial Pick"}</span>
              </p>
            </div>

            {/* Bottom Row: Actions & MangaDex Carousel Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-2 border-t border-white/[0.08]">
              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  to={currentHero.route}
                  className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center gap-2 bg-[#61F1AC] hover:bg-[#7BF5BB] text-black shadow-[0_4px_20px_rgba(97,241,172,0.35)] transition-all cursor-pointer group/btn"
                >
                  <BookOpen size={15} className="group-hover/btn:scale-110 transition-transform" />
                  <span>Read Details / Add to List</span>
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
                  <span>{inListMap[currentHero.id] ? "In Reading List" : "Quick Save"}</span>
                </button>
              </div>

              {/* MangaDex-Style Pagination & Chevrons */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold tracking-wider text-[#A3A3A3]">
                  NO. {heroIndex + 1}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Previous featured title"
                    onClick={() => setHeroIndex((prev) => (prev - 1 + spotlightPool.length) % spotlightPool.length)}
                    className="w-8 h-8 rounded-full border border-white/15 bg-black/60 hover:bg-black/90 backdrop-blur-md flex items-center justify-center text-[#CCCCCC] hover:text-[#61F1AC] hover:border-[#61F1AC]/50 cursor-pointer transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    type="button"
                    aria-label="Next featured title"
                    onClick={() => setHeroIndex((prev) => (prev + 1) % spotlightPool.length)}
                    className="w-8 h-8 rounded-full border border-white/15 bg-black/60 hover:bg-black/90 backdrop-blur-md flex items-center justify-center text-[#CCCCCC] hover:text-[#61F1AC] hover:border-[#61F1AC]/50 cursor-pointer transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. CATEGORY TABS & IN-LINE CONTROLS (STICKY)             */}
        {/* ======================================================== */}
        <div className="sticky top-0 z-30 bg-[#000000]/95 backdrop-blur-md border-b border-[#1C1C1C] pt-2 pb-0 -mx-6 px-6 lg:-mx-[120px] lg:px-[120px] mb-6 transition-all">
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

            {/* Right Controls: Search Pill + View Mode Toggle & Jump Dropdown */}
            <div className="flex items-center gap-2.5 shrink-0 pb-3">
              {/* Compact Search Input */}
              <div className="relative w-36 sm:w-56 md:w-64">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#61F1AC] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search books, manga... [/]"
                  className="w-full bg-[#0B0B0B] border border-[#1C1C1C] focus:border-[#61F1AC]/60 rounded-full pl-8 pr-7 py-1.5 text-xs text-[#F5F5F5] placeholder-[#7A7A7A] focus:outline-none transition-all"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A7A7A] hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.2 text-[10px] font-mono text-[#666666] bg-white/[0.04] border border-white/[0.06] rounded pointer-events-none">
                    /
                  </kbd>
                )}
              </div>

              {/* View Mode Toggle (Carousel vs Grid) */}
              <div className="hidden sm:flex items-center bg-[#0B0B0B] border border-[#1C1C1C] rounded-[8px] p-0.5">
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
              {activeTab === "all" && (
                <div className="relative hidden md:block" ref={jumpMenuRef}>
                  <button
                    type="button"
                    onClick={() => setJumpMenuOpen(!jumpMenuOpen)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#0B0B0B] border border-[#1C1C1C] text-xs font-medium text-[#B5B5B5] hover:text-[#F5F5F5] hover:border-[#61F1AC]/40 transition-colors cursor-pointer"
                  >
                    <span>Jump to</span>
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
            {/* SUB-CATEGORY QUICK FILTER CHIPS (WHEN MANGA / MANHWA / MANHUA / NOVELS TAB IS ACTIVE) */}
            {isCategoryHubActive && SUB_FILTER_CHIPS[activeTab] && (
              <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1 pb-2 animate-in fade-in duration-200">
                {SUB_FILTER_CHIPS[activeTab].map((chip) => {
                  const isChipActive = activeSubFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setActiveSubFilter(chip.key)}
                      className={`px-4 py-1.5 rounded-full text-xs sm:text-sm transition-all cursor-pointer ${
                        isChipActive
                          ? "bg-[#61F1AC] text-black font-semibold shadow-[0_0_20px_rgba(97,241,172,0.45)]"
                          : "bg-[#0B0B0B] border border-[#1F1F1F] text-[#B5B5B5] hover:text-[#F5F5F5] hover:border-[#61F1AC]/40"
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
                        catalogUrl={shelf.catalogUrl}
                      />
                    );
                  })}
              </div>
            ) : (
              /* OVERVIEW DASHBOARD SHELVES (ALL LITERATURE OR FAN FAVORITES) */
              <div className="space-y-8 pb-12">
                {/* 1. MANHWA SHELF */}
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
                      catalogUrl="/books/manhwa"
                    />
                  )
                )}

                {/* 2. MANGA SHELF */}
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
                      catalogUrl="/books/manga"
                    />
                  )
                )}

                {/* 3. BOOKS & NOVELS SHELF */}
                {activeTab === "all" && (
                  viewMode === "carousel" ? (
                    <div id="section-novels" className="scroll-mt-24">
                      <MediaCarousel
                        title="Trending this month — Novels & Books"
                        items={feeds.trendingBooks}
                        isLoading={isLoadingFeeds}
                        showTopScore={true}
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
