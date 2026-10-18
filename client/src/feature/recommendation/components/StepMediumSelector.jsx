import React, { useState, useEffect } from "react"; 
import { Film, Tv, BookOpen, ArrowRight, Check, Play } from "lucide-react"; 
import { getTrending, getTmdbImageUrl } from "../../../services/tmdb"; 
import { fetchMangaDexByCategory } from "../../../services/mediaApi"; 

const CATEGORIES = [
  {
    id: "movie",
    label: "Movies",
    desc: "Films, cinema & features",
    icon: Film,
  },
  {
    id: "series",
    label: "Series",
    desc: "TV shows, seasons & anime",
    icon: Tv,
  },
  {
    id: "book",
    label: "Books",
    desc: "Manga, manhwa & literature",
    icon: BookOpen,
  },
];

// Fallback high-res cover art in case network / API is unreachable
const FALLBACK_MEDIA = {
  movie: {
    title: "Interstellar",
    image: "https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  },
  series: {
    title: "Arcane",
    image: "https://image.tmdb.org/t/p/w780/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
  },
  book: {
    title: "Solo Leveling",
    // AniList CDN high-res direct image (no hotlink restrictions)
    image: "https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b6b1asvTjZ7J.png",
  },
};

export function StepMediumSelector({ 
  medium, 
  onSelectMedium, 
  onNext, 
}) { 
  const [livePreviews, setLivePreviews] = useState({
    movie: null,
    series: null,
    book: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live real media items from TMDB & MangaDex on mount
  useEffect(() => {
    let mounted = true;

    async function fetchLiveMedia() {
      try {
        const [movieRes, tvRes, mangaRes] = await Promise.allSettled([
          getTrending("movie", "week"),
          getTrending("tv", "week"),
          fetchMangaDexByCategory("manga", 1, "", "All", "All", "Top rated"),
        ]);

        if (!mounted) return;

        const topMovie =
          movieRes.status === "fulfilled" && movieRes.value?.results?.[0];
        const topTv =
          tvRes.status === "fulfilled" && tvRes.value?.results?.[0];
        const topManga =
          mangaRes.status === "fulfilled" && Array.isArray(mangaRes.value)
            ? mangaRes.value[0]
            : null;

        setLivePreviews({
          movie: topMovie
            ? {
                title: topMovie.title || topMovie.name || "Trending Movie",
                image: getTmdbImageUrl(topMovie.poster_path, "w780"),
              }
            : FALLBACK_MEDIA.movie,
          series: topTv
            ? {
                title: topTv.name || topTv.title || "Trending Series",
                image: getTmdbImageUrl(topTv.poster_path, "w780"),
              }
            : FALLBACK_MEDIA.series,
          book: topManga
            ? {
                title: topManga.title || "Top Manga",
                image: topManga.cover || topManga.poster || FALLBACK_MEDIA.book.image,
              }
            : FALLBACK_MEDIA.book,
        });
      } catch (err) {
        console.error("Failed to fetch live medium previews:", err);
        if (mounted) {
          setLivePreviews(FALLBACK_MEDIA);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    fetchLiveMedia();
    return () => {
      mounted = false;
    };
  }, []);

  const previewsList = [
    {
      id: "movie",
      title: livePreviews.movie?.title || FALLBACK_MEDIA.movie.title,
      tag: "MOVIE",
      icon: Play,
      image: livePreviews.movie?.image || FALLBACK_MEDIA.movie.image,
    },
    {
      id: "series",
      title: livePreviews.series?.title || FALLBACK_MEDIA.series.title,
      tag: "SERIES",
      icon: Tv,
      image: livePreviews.series?.image || FALLBACK_MEDIA.series.image,
    },
    {
      id: "book",
      title: livePreviews.book?.title || FALLBACK_MEDIA.book.title,
      tag: "BOOK",
      icon: BookOpen,
      image: livePreviews.book?.image || FALLBACK_MEDIA.book.image,
    },
  ];

  // Helper to determine 3D card layout and animation classes
  const getCardClasses = (cardId) => {
    const isSelected = medium === cardId;

    if (isSelected) {
      return "left-1/2 -translate-x-1/2 top-2 sm:top-4 z-30 scale-102 sm:scale-105 rotate-0 border-[#61F1AC] shadow-[0_0_40px_rgba(97,241,172,0.3)] opacity-100";
    }

    // When Movie is active: Series sits right, Book sits left
    if (medium === "movie") {
      if (cardId === "series") {
        return "left-[64%] -translate-x-1/2 top-6 sm:top-8 z-20 scale-92 rotate-6 border-white/15 opacity-70 hover:opacity-90";
      }
      return "left-[36%] -translate-x-1/2 top-8 sm:top-10 z-10 scale-86 -rotate-8 border-white/10 opacity-45 hover:opacity-75";
    }

    // When Series is active: Movie sits left, Book sits right
    if (medium === "series") {
      if (cardId === "movie") {
        return "left-[36%] -translate-x-1/2 top-6 sm:top-8 z-20 scale-92 -rotate-6 border-white/15 opacity-70 hover:opacity-90";
      }
      return "left-[64%] -translate-x-1/2 top-8 sm:top-10 z-10 scale-86 rotate-8 border-white/10 opacity-45 hover:opacity-75";
    }

    // When Book is active: Series sits left, Movie sits right
    if (cardId === "series") {
      return "left-[36%] -translate-x-1/2 top-6 sm:top-8 z-20 scale-92 -rotate-6 border-white/15 opacity-70 hover:opacity-90";
    }
    return "left-[64%] -translate-x-1/2 top-8 sm:top-10 z-10 scale-86 rotate-8 border-white/10 opacity-45 hover:opacity-75";
  };

  return ( 
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-6xl mx-auto py-6 sm:py-8 select-none"> 
      {/* Left Column: Title & Category Selection */}
      <div className="lg:col-span-6 flex flex-col justify-center"> 
        <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-light tracking-tight text-[#F5F5F5] leading-[1.15] mb-4"> 
          What do you want to{" "} 
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0]"> 
            watch or read? 
          </span> 
        </h1> 

        <p className="text-sm text-[#9CA3AF] leading-relaxed mb-8 max-w-md"> 
          Choose your medium to tailor recommendations for your taste and evening context. 
        </p> 

        <div className="flex flex-col gap-3 mb-8"> 
          {CATEGORIES.map((cat) => {
            const isSelected = medium === cat.id;
            const Icon = cat.icon;
            return (
              <button 
                key={cat.id} 
                type="button" 
                onClick={() => onSelectMedium(cat.id)} 
                className={`relative p-4 sm:p-4.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex items-center justify-between group ${ 
                  isSelected 
                    ? "bg-[#61F1AC]/10 border-[#61F1AC] shadow-[0_0_25px_rgba(97,241,172,0.18)]" 
                    : "bg-[#0B0F13] border-[#1E262F] hover:border-white/20 hover:bg-[#11161D]" 
                }`} 
              > 
                <div className="flex items-center gap-3.5 min-w-0"> 
                  <div 
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${ 
                      isSelected 
                        ? "border-[#61F1AC]/40 bg-[#61F1AC]/15 text-[#61F1AC]" 
                        : "border-[#1E262F] bg-black/40 text-[#7A7A7A] group-hover:text-white" 
                    }`} 
                  > 
                    <Icon size={19} /> 
                  </div> 
                  <div> 
                    <div className="text-base font-semibold text-[#F5F5F5] leading-snug"> 
                      {cat.label} 
                    </div> 
                    <div className="text-xs text-[#7A7A7A]"> 
                      {cat.desc} 
                    </div> 
                  </div> 
                </div> 

                <div 
                  className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${ 
                    isSelected 
                      ? "border-[#61F1AC] bg-[#61F1AC] text-black" 
                      : "border-[#2A3441] bg-transparent opacity-40 group-hover:opacity-100" 
                  }`} 
                > 
                  {isSelected && <Check size={14} className="stroke-[3]" />} 
                </div> 
              </button> 
            );
          })}
        </div> 

        <button 
          type="button" 
          onClick={onNext} 
          className="w-full sm:w-fit px-8 py-3.5 rounded-full bg-[#61F1AC] hover:bg-[#52deb0] text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#61F1AC]/25 hover:shadow-[0_0_30px_rgba(97,241,172,0.35)] transition-all cursor-pointer" 
        > 
          <span>Continue</span> 
          <ArrowRight size={16} /> 
        </button> 
      </div> 

      {/* Right Column: 3 Animated Cover Art Cards */}
      <div className="lg:col-span-6 relative flex items-center justify-center min-h-[440px] sm:min-h-[480px]"> 
        <div className="relative w-full max-w-md h-[420px] flex items-center justify-center"> 
          {previewsList.map((prev) => {
            const isSelected = medium === prev.id;
            const CardIcon = prev.icon;
            const cardClasses = getCardClasses(prev.id);

            return (
              <div 
                key={prev.id} 
                onClick={() => onSelectMedium(prev.id)} 
                className={`absolute w-52 sm:w-60 aspect-[2/3] rounded-2xl overflow-hidden border bg-[#0B0F13] transition-all duration-500 shadow-2xl cursor-pointer ${cardClasses}`} 
              > 
                {isLoading ? (
                  <div className="w-full h-full skeleton-shimmer flex items-center justify-center">
                    <CardIcon size={28} className="text-white/20 animate-pulse" />
                  </div>
                ) : (
                  <img 
                    src={prev.image} 
                    alt={prev.title} 
                    loading="lazy" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => {
                      // Fallback gracefully without showing broken alt
                      const fallback = FALLBACK_MEDIA[prev.id]?.image;
                      if (fallback && e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="w-full h-full object-cover select-none" 
                  /> 
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" /> 

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none"> 
                  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-white bg-black/65 px-2.5 py-1 rounded-md border border-white/10 backdrop-blur-sm max-w-[130px] truncate"> 
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-[#61F1AC]" : "bg-neutral-400"}`} /> 
                    <span className="truncate">{prev.title || prev.tag}</span> 
                  </div> 

                  <div className="w-8 h-8 rounded-full bg-black/70 border border-white/20 flex items-center justify-center text-white backdrop-blur-sm shrink-0"> 
                    <CardIcon size={14} className={prev.id === "movie" ? "translate-x-0.5 fill-white" : ""} /> 
                  </div> 
                </div> 
              </div> 
            );
          })}
        </div> 
      </div> 
    </div> 
  ); 
} 
