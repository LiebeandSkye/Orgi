import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, BookOpen, Layers, Smartphone, Bookmark } from "lucide-react";

const BOOK_ITEMS = [
  { to: "/books/novels", label: "Novels", icon: BookOpen, match: ["/books/novels"] },
  { to: "/books/manga", label: "Manga", icon: Layers, match: ["/books/manga"] },
  { to: "/books/manhwa", label: "Manhwa", icon: Smartphone, match: ["/books/manhwa", "/books"] },
  { to: "/books/light-novels", label: "Light Novels", icon: Bookmark, match: ["/books/light-novels"] },
];

export function Navbar({ forceBooksOpen = false }) {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navRef = useRef(null);
  const labelRefs = useRef({});
  const indicatorRef = useRef(null);
  const prevRect = useRef(null);

  const isDropdownVisible = forceBooksOpen || dropdownOpen;

  // Determine active tab based on path
  const isMovies =
    location.pathname === "/" ||
    location.pathname === "/movies" ||
    location.pathname.startsWith("/movie");
  const isSeries = location.pathname.startsWith("/series");
  const isBooks = location.pathname.startsWith("/books");
  const active = isBooks ? "books" : isSeries ? "series" : isMovies ? "movies" : null;

  // Close dropdown on route change
  useEffect(() => {
    if (!forceBooksOpen) setDropdownOpen(false);
  }, [location.pathname, forceBooksOpen]);

  // Close dropdown on click outside / Escape if not forced
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        !forceBooksOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === "Escape" && !forceBooksOpen) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [forceBooksOpen]);

  // Measure the label of a tab relative to the nav
  const measure = useCallback((key) => {
    const nav = navRef.current;
    const el = key ? labelRefs.current[key] : null;
    if (!nav || !el) return null;
    const n = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - n.left, w: r.width };
  }, []);

  const applyRect = (rect) => {
    const ind = indicatorRef.current;
    if (!ind || !rect) return;
    ind.style.width = `${rect.w}px`;
    ind.style.transform = `translateX(${rect.x}px)`;
  };

  // Animate the underline: float down, glide across, float up
  useLayoutEffect(() => {
    const ind = indicatorRef.current;
    if (!ind) return;
    const next = measure(active);

    if (!next) {
      ind.style.opacity = "0";
      prevRect.current = null;
      return;
    }

    ind.style.opacity = "1";
    const prev = prevRect.current;
    applyRect(next);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prev && !reduce && (prev.x !== next.x || prev.w !== next.w) && ind.animate) {
      const midX = (prev.x + prev.w / 2 + next.x + next.w / 2) / 2;
      const midW = 10;
      ind.animate(
        [
          {
            transform: `translateX(${prev.x}px) translateY(0px)`,
            width: `${prev.w}px`,
            opacity: 1,
            easing: "cubic-bezier(0.4, 0, 0.9, 0.6)",
          },
          {
            transform: `translateX(${midX - midW / 2}px) translateY(10px)`,
            width: `${midW}px`,
            opacity: 0.35,
            offset: 0.5,
            easing: "cubic-bezier(0.1, 0.4, 0.2, 1)",
          },
          {
            transform: `translateX(${next.x}px) translateY(0px)`,
            width: `${next.w}px`,
            opacity: 1,
          },
        ],
        { duration: 250 }
      );
    }
    prevRect.current = next;
  }, [active, measure]);

  // Keep the underline aligned on resize (no animation)
  useEffect(() => {
    function onResize() {
      const rect = measure(active);
      if (rect) {
        applyRect(rect);
        prevRect.current = rect;
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, measure]);

  const tabClass = (isActive) =>
    `relative flex items-center h-full text-sm font-medium transition-colors select-none ${
      isActive ? "text-[#F5F5F5]" : "text-[#7A7A7A] hover:text-[#F5F5F5]"
    }`;

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-[#000000]/90 backdrop-blur-md border-b border-[#1C1C1C]">
      {/* 3-column grid keeps the nav truly centered regardless of logo/avatar width */}
      <div className="max-w-[1440px] h-full mx-auto px-6 lg:px-[120px] grid grid-cols-[1fr_auto_1fr] items-center">
        {/* Wordmark */}
        <Link
          to="/"
          className="justify-self-start flex items-center text-xl font-semibold tracking-tighter text-[#F5F5F5] hover:opacity-90 transition-opacity select-none"
        >
          <span>rate</span>
          <span className="text-[#61F1AC]">.</span>
        </Link>

        {/* Centered navigation tabs */}
        <nav ref={navRef} className="relative flex items-center gap-8 h-16">
          <Link to="/" className={tabClass(isMovies)}>
            <span ref={(el) => (labelRefs.current.movies = el)}>Movies</span>
          </Link>

          <Link to="/series" className={tabClass(isSeries)}>
            <span ref={(el) => (labelRefs.current.series = el)}>Series</span>
          </Link>

          {/* Books tab with dropdown */}
          <div className="relative h-full flex items-center" ref={dropdownRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isDropdownVisible}
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`${tabClass(isBooks)} gap-1.5 cursor-pointer`}
            >
              <span ref={(el) => (labelRefs.current.books = el)}>Books</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${
                  isDropdownVisible ? "rotate-180 text-[#61F1AC]" : "text-[#7A7A7A]"
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownVisible && (
              <div
                role="menu"
                className="absolute top-[calc(100%-4px)] left-1/2 -translate-x-1/2 w-52 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                {BOOK_ITEMS.map(({ to, label, icon: Icon, match }) => {
                  const isActiveItem = match.includes(location.pathname);
                  return (
                    <Link
                      key={to}
                      to={to}
                      role="menuitem"
                      onClick={() => !forceBooksOpen && setDropdownOpen(false)}
                      className={`flex items-center gap-3 h-9 px-3 text-[13px] leading-none rounded-lg transition-colors ${
                        isActiveItem
                          ? "text-[#61F1AC] bg-[#141414] font-medium"
                          : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414]"
                      }`}
                    >
                      <Icon size={15} strokeWidth={1.75} className="shrink-0 text-[#F5F5F5]" />
                      <span className="flex-1">{label}</span>
                      {isActiveItem && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC] shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sliding underline */}
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 h-[2px] rounded-full bg-[#61F1AC] opacity-0"
            style={{ width: 0, willChange: "transform, width" }}
          />
        </nav>

        {/* Right side: User Avatar */}
        <div className="justify-self-end flex items-center">
          <button
            type="button"
            className="w-9 h-9 rounded-full overflow-hidden cursor-pointer bg-[#141414] ring-1 ring-[#1C1C1C] hover:ring-[#2A2A2A] transition-shadow"
            title="User Profile"
          >
            {/* scale-125 crops away the baked-in light edge/background of the source image */}
            <img
              src="https://imgs.search.brave.com/NmPZjePZioE_lCWEwu7wkqrQwsFRs9j0toSsN3hn8gY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTMv/NTQ3LzEyMC9zbWFs/bC9nZW5lcmljLXVz/ZXItcHJvZmlsZS1h/dmF0YXItZm9yLW9u/bGluZS1wbGF0Zm9y/bXMtYW5kLXNvY2lh/bC1tZWRpYS12ZWN0/b3IuanBn"
              alt="Avatar"
              className="w-full h-full object-cover scale-125"
            />
          </button>
        </div>
      </div>
    </header>
  );
}