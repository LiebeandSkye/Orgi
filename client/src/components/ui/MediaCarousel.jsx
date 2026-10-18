import React, { useRef, useState, useEffect } from "react"; 
import { Link } from "react-router-dom"; 
import { ChevronLeft, ChevronRight, Star, Play } from "lucide-react"; 
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

export function MediaCarousel({ 
  title, 
  items = [], 
  isLoading = false, 
  showRank = false, 
  showTopScore = false, 
  subtitle = null, 
  cardVariant = "portrait", 
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
            {Array.from({ length: cardVariant === "landscape" ? 4 : 6 }).map((_, idx) => ( 
              <div 
                key={idx} 
                className={ 
                  cardVariant === "landscape" 
                    ? "w-[280px] sm:w-[320px] md:w-[360px] shrink-0" 
                    : "w-[140px] sm:w-[160px] md:w-[180px] shrink-0" 
                } 
              > 
                {cardVariant === "landscape" ? ( 
                  <> 
                    <div className="relative aspect-[16/9] w-full rounded-[12px] overflow-hidden bg-[#0C0C0C] border border-[#1C1C1C] animate-pulse" /> 
                    <div className="mt-3 space-y-1.5"> 
                      <div className="h-4 bg-[#141414] rounded w-3/4 animate-pulse" /> 
                      <div className="h-3 bg-[#141414] rounded w-1/3 animate-pulse" /> 
                    </div> 
                  </> 
                ) : ( 
                  <CardSkeleton /> 
                )} 
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
            {items.map((item, idx) => { 
              const isLandscape = cardVariant === "landscape"; 
              const cardImage = isLandscape 
                ? (item.backdrop || item.poster || item.cover) 
                : (item.poster || item.cover); 
 
              return ( 
                <Link 
                  key={`${item.type || "media"}-${item.id || idx}`} 
                  to={item.route} 
                  className={`group flex flex-col ${ 
                    isLandscape 
                      ? "w-[280px] sm:w-[320px] md:w-[360px]" 
                      : "w-[140px] sm:w-[160px] md:w-[180px]" 
                  } shrink-0 cursor-pointer transition-all`} 
                > 
                  <div 
                    className={`relative ${ 
                      isLandscape ? "aspect-[16/9]" : "aspect-[2/3]" 
                    } w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] border border-[#1C1C1C] group-hover:border-[#61F1AC]/60 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.12)] transition-all duration-300`} 
                  > 
                    {showRank && <RankNumber rank={idx + 1} />} 
 
                    {item.statusBadge ? ( 
                      <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-0.5 rounded-full bg-[#61F1AC] text-black text-[10px] font-bold tracking-tight shadow-md"> 
                        {item.statusBadge} 
                      </div> 
                    ) : showTopScore || isLandscape ? ( 
                      item.rating && item.rating !== "—" ? ( 
                        <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[#61F1AC] text-[10px] sm:text-[11px] font-bold font-tabular flex items-center gap-1 shadow-md"> 
                          <Star size={10} className="fill-[#61F1AC] text-[#61F1AC]" /> 
                          <span>{item.rating || item.score}</span> 
                        </div> 
                      ) : null 
                    ) : null} 
 
                    {isLandscape && item.type && !showRank && ( 
                      <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold tracking-wider text-white/80 uppercase"> 
                        {item.type} 
                      </div> 
                    )} 
 
                    {cardImage ? ( 
                      <img 
                        src={cardImage} 
                        alt={item.title} 
                        loading="lazy" 
                        referrerPolicy="no-referrer" 
                        className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500" 
                      /> 
                    ) : ( 
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#7A7A7A] p-3 text-center"> 
                        {item.title} 
                      </div> 
                    )} 
 
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" /> 
                  </div> 
 
                  <div className="mt-2.5 flex flex-col"> 
                    <div className="flex items-center justify-between gap-2"> 
                      <span className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-[#61F1AC] transition-colors"> 
                        {item.title} 
                      </span> 
                      {!isLandscape && ( 
                        <div className="flex items-center gap-1 text-[#61F1AC] font-medium font-tabular text-xs shrink-0"> 
                          <Star size={11} className="fill-[#61F1AC]" /> 
                          <span>{item.rating || item.score || "—"}</span> 
                        </div> 
                      )} 
                    </div> 
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#7A7A7A]"> 
                      <span className="font-tabular truncate max-w-[105px]"> 
                        {item.year || item.chapters || item.author || "—"} 
                      </span> 
                      {isLandscape && item.overview && ( 
                        <> 
                          <span className="text-white/20">•</span> 
                          <span className="truncate max-w-[180px] sm:max-w-[220px] text-white/50"> 
                            {item.overview} 
                          </span> 
                        </> 
                      )} 
                    </div> 
                  </div> 
                </Link> 
              ); 
            })} 
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