import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

export function ReviewsHero({ backdropUrl, initialQuery = "", onSearchChange }) {
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const [backdropError, setBackdropError] = useState(false);
  const inputRef = useRef(null);

  // Sync external prop if it changes
  useEffect(() => {
    setLocalQuery(initialQuery || "");
  }, [initialQuery]);

  // Debounced search sync (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localQuery !== initialQuery) {
        onSearchChange(localQuery);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localQuery, initialQuery, onSearchChange]);

  // Keyboard shortcut: '/' focuses search; 'Escape' clears focus and query
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        setLocalQuery("");
        onSearchChange("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSearchChange]);

  const handleClear = () => {
    setLocalQuery("");
    onSearchChange("");
    inputRef.current?.focus();
  };

  return (
    <section className="relative w-full min-h-[200px] md:min-h-[230px] overflow-hidden bg-[#060908] border-b border-white/[0.07] flex items-center">
      {/* Dark Cinematic Backdrop with Smooth Melts */}
      {backdropUrl && !backdropError && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={backdropUrl}
            alt=""
            loading="eager"
            decoding="async"
            onLoad={() => setBackdropLoaded(true)}
            onError={() => setBackdropError(true)}
            className={`absolute right-0 top-0 h-full w-full md:w-3/4 object-cover object-center transition-opacity duration-700 ${
              backdropLoaded ? "opacity-45 md:opacity-55" : "opacity-0"
            }`}
          />
          {/* Left-to-right fade: #060908 -> transparent */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060908] via-[#060908]/90 md:via-[#060908]/75 to-transparent" />
          {/* Bottom fade into page background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060908] via-transparent to-transparent" />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 md:px-6 py-6 md:py-8 flex flex-col justify-center">
        {/* Eyebrow */}
        <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#5d6763] mb-2">
          REAL OPINIONS. DIFFERENT PERSPECTIVES.
        </span>

        {/* Headline */}
        <h1 className="text-[26px] sm:text-[32px] md:text-[40px] font-normal tracking-tight text-[#e8ecea] leading-tight mb-2">
          Explore what others think.
        </h1>

        {/* Subtext */}
        <p className="text-[14px] md:text-[15px] text-[#8b9692] max-w-[420px] leading-relaxed mb-5 line-clamp-2">
          Read reviews, discover new favorites, and see different perspectives on the movies, series, books and more you love.
        </p>

        {/* Search Bar */}
        <div className="relative w-full max-w-[500px]">
          <div className="relative h-[44px] rounded-full bg-[#0b100e] border border-[#19d68a]/60 flex items-center px-4 transition-all focus-within:border-[#19d68a] focus-within:ring-1 focus-within:ring-[#19d68a]/40">
            <Search size={18} className="text-[#19d68a] shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search for a title, person, or keyword..."
              aria-label="Search reviews"
              className="w-full bg-transparent text-[14px] text-[#e8ecea] placeholder-[#8b9692] focus:outline-none"
            />

            {localQuery ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="text-[#8b9692] hover:text-[#e8ecea] p-1 rounded-full cursor-pointer transition-colors"
              >
                <X size={15} />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 text-[11px] font-mono text-[#8b9692] bg-white/[0.06] border border-white/[0.08] rounded">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
