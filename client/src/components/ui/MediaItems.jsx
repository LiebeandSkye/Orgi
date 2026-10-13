import React, { useState, useRef, useEffect } from "react";
import { Play, ChevronLeft, ChevronRight, X } from "lucide-react";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function getTMDBImage(path, size = "w500") {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/* ------------------------------------------------------------------ */
/*  Carousel Arrow                                                      */
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

/* ------------------------------------------------------------------ */
/*  Scrollable row with carousel arrows + edge fades                    */
/* ------------------------------------------------------------------ */
function ScrollRow({ children, label }) {
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
  }, [children]);

  const handleScroll = (direction) => {
    if (!rowRef.current) return;
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 100);
    setTimeout(checkScroll, 350);
  };

  const fadeLeft = canScrollLeft
    ? "transparent 0, #000 48px"
    : "#000 0, #000 0";
  const fadeRight = canScrollRight
    ? "#000 calc(100% - 48px), transparent 100%"
    : "#000 100%, #000 100%";
  const edgeMask = `linear-gradient(to right, ${fadeLeft}, ${fadeRight})`;

  return (
    <div className="relative group/carousel">
      <ArrowButton
        direction="left"
        visible={canScrollLeft}
        onClick={() => handleScroll("left")}
        label={`Scroll ${label} left`}
      />
      <ArrowButton
        direction="right"
        visible={canScrollRight}
        onClick={() => handleScroll("right")}
        label={`Scroll ${label} right`}
      />
      <div
        ref={rowRef}
        onScroll={checkScroll}
        style={{ WebkitMaskImage: edgeMask, maskImage: edgeMask }}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-1 px-1"
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  YouTube Modal                                                       */
/* ------------------------------------------------------------------ */
function VideoModal({ videoKey, videoName, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-[90vw] max-w-[960px] rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
          aria-label="Close video"
        >
          <X size={16} />
        </button>

        {/* 16:9 iframe */}
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
            title={videoName || "Video"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main MediaItems Component                                           */
/* ------------------------------------------------------------------ */
export default function MediaItems({ movieData }) {
  const [activeVideo, setActiveVideo] = useState(null);

  const videos = (movieData?.videos?.results || []).filter(
    (video) => video.site === "YouTube"
  );
  const backdrops = movieData?.images?.backdrops || [];
  const posters = movieData?.images?.posters || [];

  const SectionTitle = ({ children, count }) => (
    <div className="mb-4 flex items-center gap-3">
      <h3 className="text-base font-semibold tracking-tight text-[#F5F5F5] sm:text-lg">
        {children}
      </h3>
      {count > 0 && (
        <span className="text-xs text-[#7A7A7A]">{count}</span>
      )}
    </div>
  );

  const EmptyState = ({ label }) => (
    <p className="py-5 text-sm text-[#7A7A7A]">
      No {label.toLowerCase()} available.
    </p>
  );

  return (
    <section className="w-full bg-black text-[#F5F5F5]">
      <div className="space-y-10 py-6 sm:py-8">

        {/* ─── Videos ─── */}
        <section>
          <SectionTitle count={videos.length}>Videos</SectionTitle>

          {videos.length > 0 ? (
            <ScrollRow label="Videos">
              {videos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => setActiveVideo(video)}
                  className="group w-[240px] shrink-0 sm:w-[300px] lg:w-[340px] text-left cursor-pointer"
                >
                  <div className="relative aspect-video overflow-hidden rounded-xl border border-[#202020] bg-[#0B0B0B]">
                    <img
                      src={`https://img.youtube.com/vi/${video.key}/hqdefault.jpg`}
                      alt={video.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-75"
                    />

                    {/* Play button — white, minimal, classic */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-black/40 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-black/60 group-hover:border-white">
                        <Play
                          size={22}
                          className="text-white ml-0.5"
                          fill="white"
                          strokeWidth={0}
                        />
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-1 text-sm font-medium text-[#F5F5F5] group-hover:text-white transition-colors">
                    {video.name}
                  </p>
                  <p className="mt-1 text-xs text-[#7A7A7A]">
                    {video.type || "Video"}
                  </p>
                </button>
              ))}
            </ScrollRow>
          ) : (
            <EmptyState label="Videos" />
          )}
        </section>

        {/* ─── Backdrops ─── */}
        <section>
          <SectionTitle count={backdrops.length}>Backdrops</SectionTitle>

          {backdrops.length > 0 ? (
            <ScrollRow label="Backdrops">
              {backdrops.map((image, index) => (
                <div
                  key={image.file_path || index}
                  className="group w-[260px] shrink-0 sm:w-[340px] lg:w-[400px]"
                >
                  <div className="aspect-video overflow-hidden rounded-xl border border-[#202020] bg-[#0B0B0B] transition-all duration-300 group-hover:border-[#61F1AC]/40 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.08)]">
                    <img
                      src={getTMDBImage(image.file_path, "w780")}
                      alt={`Backdrop ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </ScrollRow>
          ) : (
            <EmptyState label="Backdrops" />
          )}
        </section>

        {/* ─── Posters ─── */}
        <section>
          <SectionTitle count={posters.length}>Posters</SectionTitle>

          {posters.length > 0 ? (
            <ScrollRow label="Posters">
              {posters.map((image, index) => (
                <div
                  key={image.file_path || index}
                  className="group w-[125px] shrink-0 sm:w-[155px] lg:w-[175px]"
                >
                  <div className="aspect-[2/3] overflow-hidden rounded-xl border border-[#202020] bg-[#0B0B0B] transition-all duration-300 group-hover:border-[#61F1AC]/40 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.08)]">
                    <img
                      src={getTMDBImage(image.file_path, "w500")}
                      alt={`Poster ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </ScrollRow>
          ) : (
            <EmptyState label="Posters" />
          )}
        </section>

      </div>

      {/* YouTube Video Modal */}
      {activeVideo && (
        <VideoModal
          videoKey={activeVideo.key}
          videoName={activeVideo.name}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </section>
  );
}