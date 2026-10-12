import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { CardSkeleton } from "./CardSkeleton";

export function MediaCarousel({
  title,
  items = [],
  isLoading = false,
  showRank = false,
  subtitle = null,
}) {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = rowRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [items, isLoading]);

  const handleScroll = (direction) => {
    if (!rowRef.current) return;
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mt-12 first:mt-4">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7A7A]">
            {title}
          </span>
          {subtitle && (
            <span className="text-[11px] text-[#555555] font-mono">
              {subtitle}
            </span>
          )}
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label={`Scroll ${title} left`}
            className="w-7 h-7 rounded-full bg-[#0E0E0E] border border-[#1C1C1C] flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#61F1AC]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label={`Scroll ${title} right`}
            className="w-7 h-7 rounded-full bg-[#0E0E0E] border border-[#1C1C1C] flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#61F1AC]/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Row */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden py-1">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="w-[140px] sm:w-[160px] md:w-[180px] shrink-0"
            >
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-1 px-1"
        >
          {items.map((item, idx) => (
            <Link
              key={`${item.type || "media"}-${item.id || idx}`}
              to={item.route}
              className="group flex flex-col w-[140px] sm:w-[160px] md:w-[180px] shrink-0 cursor-pointer transition-all"
            >
              {/* Poster Card */}
              <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] border border-[#1C1C1C] group-hover:border-[#61F1AC]/60 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.12)] transition-all duration-300">
                {/* Optional Rank Badge for Top 10 */}
                {showRank && (
                  <div className="absolute top-2 left-2 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/80 backdrop-blur-md border border-[#61F1AC]/50 flex items-center justify-center text-xs sm:text-sm font-bold text-[#61F1AC] shadow-lg">
                    {idx + 1}
                  </div>
                )}

                {item.poster ? (
                  <img
                    src={item.poster}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[#7A7A7A] p-3 text-center">
                    {item.title}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Title & Metadata */}
              <div className="mt-3 flex flex-col">
                <span className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-[#61F1AC] transition-colors">
                  {item.title}
                </span>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-[#7A7A7A] font-tabular">
                    {item.year || "—"}
                  </span>
                  <div className="flex items-center gap-1 text-[#61F1AC] font-medium font-tabular">
                    <Star size={11} className="fill-[#61F1AC]" />
                    <span>{item.rating || item.score || "—"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-6 text-xs text-[#666666]">
          No titles currently available in this category.
        </div>
      )}
    </section>
  );
}
