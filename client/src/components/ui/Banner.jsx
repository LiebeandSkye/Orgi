import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Star, Sparkles, ChevronRight } from "lucide-react";

export function Banner({ items = [], isLoading = false }) {
  // Pick a random fan favorite movie with a backdrop
  const randomMovie = useMemo(() => {
    if (!items || items.length === 0) return null;

    // Prefer movie items with backdrop
    const validMovies = items.filter(
      (item) => item.backdrop && (item.type === "MOVIE" || !item.type)
    );
    const pool =
      validMovies.length > 0
        ? validMovies
        : items.filter((item) => Boolean(item.backdrop));

    if (pool.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }, [items]);

  if (isLoading || !randomMovie) {
    return (
      <div className="w-full relative rounded-2xl overflow-hidden min-h-[300px] sm:min-h-[360px] md:min-h-[400px] bg-[#0E0E0E] animate-pulse border border-[#1C1C1C]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-8 sm:bottom-10 sm:left-10 max-w-xl flex flex-col gap-3">
          <div className="w-28 h-6 rounded-full bg-[#181818]" />
          <div className="w-64 sm:w-96 h-9 rounded bg-[#181818]" />
          <div className="w-72 sm:w-80 h-4 rounded bg-[#181818]" />
          <div className="w-32 h-10 rounded-xl bg-[#181818] mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#1C1C1C] bg-[#0B0B0B] group my-4 shadow-2xl">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={randomMovie.backdrop}
          alt={randomMovie.title}
          loading="lazy"
          className="w-full h-full object-cover object-center  transition-transform duration-700 ease-out"
        />

        {/* Ambient Dark Gradients for contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 sm:via-black/70 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Subtle mint aura */}
        <div className="absolute top-1/4 left-10 w-96 h-60 bg-[#61F1AC]/[0.04] blur-[120px] pointer-events-none rounded-full" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-end min-h-[300px] sm:min-h-[360px] md:min-h-[200px] max-w-2xl">
        {/* Badges / Eyebrow row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">

          {randomMovie.year && (
            <span className="text-xs font-mono text-[#A3A3A3] bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full">
              {randomMovie.year}
            </span>
          )}

          {randomMovie.rating && randomMovie.rating !== "—" && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#61F1AC] bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full">
              <Star size={12} className="fill-[#61F1AC] text-[#61F1AC]" />
              {randomMovie.rating}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-white mb-3 line-clamp-2 drop-shadow-md">
          {randomMovie.title}
        </h2>

        {/* Overview */}
        {randomMovie.overview && (
          <p className="text-sm sm:text-base text-[#D4D4D4] line-clamp-2 sm:line-clamp-3 mb-6 max-w-xl font-light leading-relaxed drop-shadow">
            {randomMovie.overview}
          </p>
        )}

        {/* Call to action */}
        <div className="flex items-center gap-3">
          <Link
            to={randomMovie.route}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#61F1AC] text-black font-semibold text-sm hover:bg-[#52deb0] shadow-[0_0_20px_rgba(97,241,172,0.25)] hover:shadow-[0_0_25px_rgba(97,241,172,0.4)] transition-all cursor-pointer active:scale-[0.98]"
          >
            <span>View Details</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
