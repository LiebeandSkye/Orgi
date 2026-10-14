import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { CardSkeleton } from "./CardSkeleton";

/* ------------------------------------------------------------------ */
/*  Rank number — big silver numeral in the top-left of the poster,     */
/*  over a faint top scrim so it stays readable on bright artwork.      */
/* ------------------------------------------------------------------ */
function RankNumber({ rank }) {
  return (
    <>
      {/* Soft top scrim */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 z-10 bg-gradient-to-b from-black/40 via-black/10 to-transparent"
      />
      {/* Silver numeral */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1 left-2.5 z-10 select-none leading-none font-semibold tracking-[-0.04em] text-[42px] sm:text-[46px] md:text-[54px] text-transparent bg-clip-text drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #FFFFFF 0%, #F1F1F5 30%, #BDBDC6 68%, #8D8D96 100%)",
        }}
      >
        {rank}
      </span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Arrow button — springy slide-in, glow on hover, press-down on click */
/* ------------------------------------------------------------------ */
function ArrowButton({ direction, visible, onClick, label }) {
  const isLeft = direction === "left";
  const Icon = isLeft ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      tabIndex={visible ? 0 : -1}
      className={`group/btn absolute ${
        isLeft ? "left-1 sm:left-2" : "right-1 sm:right-2"
      } top-[40%] -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer
        bg-gradient-to-b from-[#1C1C1C]/90 to-[#0C0C0C]/90 backdrop-blur-xl
        border border-white/10 text-[#9A9A9A]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.6)]
        transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        hover:text-[#61F1AC] hover:border-[#61F1AC]/60
        hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_0_4px_rgba(97,241,172,0.08),0_8px_28px_rgba(97,241,172,0.22)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#61F1AC]/70
        ${
          visible
            ? "opacity-100 pointer-events-auto translate-x-0 scale-100 hover:scale-110 active:scale-95"
            : `opacity-0 pointer-events-none scale-90 ${
                isLeft ? "-translate-x-3" : "translate-x-3"
              }`
        }`}
    >
      <Icon
        size={20}
        strokeWidth={2.25}
        className={`transition-transform duration-300 ${
          isLeft
            ? "group-hover/btn:-translate-x-0.5"
            : "group-hover/btn:translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function CastCarousel({
  title,
  items = [],
  isLoading = false,
  showRank = false,
  subtitle = null,
  variant = "cast",
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

    if (direction === "right") {
      setCanScrollLeft(true);
    }
    setTimeout(checkScroll, 100);
    setTimeout(checkScroll, 350);
  };

  // Soft edge fade on whichever side has more content (works on any background)
  const fadeLeft = canScrollLeft
    ? "transparent 0, #000 48px"
    : "#000 0, #000 0";
  const fadeRight = canScrollRight
    ? "#000 calc(100% - 48px), transparent 100%"
    : "#000 100%, #000 100%";
  const edgeMask = `linear-gradient(to right, ${fadeLeft}, ${fadeRight})`;

  const hasItems = !isLoading && items && items.length > 0;

  return (
    <section className="mt-12 first:mt-0">
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
      </div>

      {/* Relative wrapper for Carousel and floating middle overlay arrows */}
      <div className="relative group/carousel">
        {hasItems && (
          <>
            <ArrowButton
              direction="left"
              visible={canScrollLeft}
              onClick={() => handleScroll("left")}
              label={`Scroll ${title} left`}
            />
            <ArrowButton
              direction="right"
              visible={canScrollRight}
              onClick={() => handleScroll("right")}
              label={`Scroll ${title} right`}
            />
          </>
        )}

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
            onScroll={checkScroll}
            style={{ WebkitMaskImage: edgeMask, maskImage: edgeMask }}
            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-1 px-1"
          >
            {items.map((item, idx) =>
              variant === "cast" ? (
                <div
                  key={item.id || idx}
                  className="group relative w-[160px] sm:w-[180px] shrink-0 cursor-pointer"
                >
                  {/* Cast Portrait */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-[#0B0B0B] transition-all duration-300 group-hover:border-[#61F1AC]/60 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.12)]">
                    <img
                      src={item.avatar || "/placeholder-avatar.png"}
                      alt={item.name || "Cast member"}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder-avatar.png";
                      }}
                      className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
                    />

                    {/* Dark Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Details on Hover */}
                    <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <h3 className="text-sm font-semibold text-white leading-tight">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-xs text-[#61F1AC] line-clamp-2">
                        {item.character || "Cast member"}
                      </p>

                      <div className="mt-3 h-[2px] w-8 rounded-full bg-[#61F1AC] transition-all duration-300 group-hover:w-12" />
                    </div>
                  </div>

                  {/* Name visible by default */}
                  <div className="mt-3 transition-opacity duration-300 group-hover:opacity-0">
                    <p className="text-sm font-medium text-[#F5F5F5] truncate">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-[#7A7A7A] truncate">
                      {item.character}
                    </p>
                  </div>
                </div>
              ) : (
                <Link
                  key={`${item.type || "media"}-${item.id || idx}`}
                  to={item.route}
                  className="group flex flex-col w-[140px] sm:w-[160px] md:w-[180px] shrink-0 cursor-pointer transition-all"
                >
                  <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] border border-[#1C1C1C] group-hover:border-[#61F1AC]/60 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.12)] transition-all duration-300">
                    {showRank && <RankNumber rank={idx + 1} />}

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
              ),
            )}
          </div>
        ) : (
          <div className="py-6 text-xs text-[#666666]">
            No titles currently available in this category.
          </div>
        )}
      </div>
    </section>
  );
}
