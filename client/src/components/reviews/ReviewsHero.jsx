import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { BorderBeam } from "../ui/border-beam";

export function ReviewsHero({ backdropUrl, initialQuery = "", onSearchChange }) {
  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const [backdropError, setBackdropError] = useState(false);
  const inputRef = useRef(null);
  const imgRef = useRef(null);

  // If the image is already cached in browser memory, mark loaded immediately
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setBackdropLoaded(true);
    }
  }, [backdropUrl]);

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
    <section className="relative w-full min-h-[200px] md:min-h-[230px] overflow-hidden bg-[#000000] border-b border-[#1C1C1C] flex items-center">
      {/* Dark Cinematic Backdrop with Smooth Melts */}
      {backdropUrl && !backdropError && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            ref={imgRef}
            src={backdropUrl}
            alt=""
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setBackdropLoaded(true)}
            onError={() => setBackdropError(true)}
            className={`absolute right-0 top-0 h-full w-full md:w-3/4 object-cover object-center transition-opacity duration-500 ${
              backdropLoaded ? "opacity-45 md:opacity-55" : "opacity-0"
            }`}
          />
          {/* Left-to-right fade: #000000 -> transparent */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#000000] via-[#000000]/90 md:via-[#000000]/75 to-transparent" />
          {/* Bottom fade into page background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent" />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 lg:px-[120px] py-6 md:py-8 flex flex-col justify-center">
        {/* Eyebrow */}
        <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#7A7A7A] mb-2">
          REAL OPINIONS. DIFFERENT PERSPECTIVES.
        </span>

        {/* Headline */}
        <h1 className="text-[26px] sm:text-[32px] md:text-[40px] font-light tracking-tight text-[#F5F5F5] leading-tight mb-2">
          Explore what others think.
        </h1>

        {/* Subtext */}
        <p className="text-[14px] md:text-[15px] text-[#B5B5B5] max-w-[420px] leading-relaxed mb-5 line-clamp-2">
          Read reviews, discover new favorites, and see different perspectives on the movies, series, books and more you love.
        </p>

        {/* Search Bar */}
        <div className="relative w-full max-w-[500px] group">
          <BorderBeam
            size="md"
            colorVariant="mint"
            borderRadius={22}
            className="w-full rounded-full"
          >
            <div className="relative w-full h-[44px] rounded-full bg-[#0B0B0B] border border-[#1C1C1C] focus-within:border-[#61F1AC]/60 px-4 flex items-center justify-between shadow-2xl transition-all">
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <Search size={18} className="text-[#61F1AC] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder="Search for a title, person, or keyword..."
                  aria-label="Search reviews"
                  className="w-full bg-transparent text-sm font-normal text-[#F5F5F5] placeholder-[#7A7A7A] focus:outline-none caret-[#61F1AC]"
                />
              </div>

              {/* Clear button or shortcut chip */}
              {localQuery ? (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear search"
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
    </section>
  );
}
