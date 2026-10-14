import React, { useState, useRef, useEffect, useMemo } from "react"; 
import { Play, ChevronLeft, ChevronRight, BookOpen, X } from "lucide-react"; 
import { getTmdbImageUrl } from "../../services/tmdb"; 

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

function VideoModal({ videoKey, videoName, onClose }) { 
  useEffect(() => { 
    const handleKey = (e) => { 
      if (e.key === "Escape") onClose(); 
    }; 
    document.addEventListener("keydown", handleKey); 
    return () => document.removeEventListener("keydown", handleKey); 
  }, [onClose]); 

  useEffect(() => { 
    document.body.style.overflow = "hidden"; 
    return () => { 
      document.body.style.overflow = ""; 
    }; 
  }, []); 

  return ( 
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-pointer" 
      onClick={onClose} 
    > 
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-backdrop-fade" /> 
      <div 
        className="relative z-10 w-[92vw] max-w-[960px] rounded-2xl border-2 border-white/20 bg-black overflow-hidden shadow-2xl animate-modal-pop cursor-default" 
        onClick={(e) => e.stopPropagation()} 
      > 
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

function ImageModal({ image, format, onClose }) { 
  const [loaded, setLoaded] = useState(false); 

  useEffect(() => { 
    const handleKey = (e) => { 
      if (e.key === "Escape") onClose(); 
    }; 
    document.addEventListener("keydown", handleKey); 
    return () => document.removeEventListener("keydown", handleKey); 
  }, [onClose]); 

  useEffect(() => { 
    document.body.style.overflow = "hidden"; 
    return () => { 
      document.body.style.overflow = ""; 
    }; 
  }, []); 

  const isBackdrop = format === "backdrop"; 
  const imageSrc = getTmdbImageUrl(image?.file_path, isBackdrop ? "w1280" : "w780"); 

  return ( 
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 cursor-pointer" 
      onClick={onClose} 
    > 
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm animate-backdrop-fade" /> 
      <div 
        className={`relative z-10 overflow-hidden rounded-2xl border-2 border-white/20 bg-[#0B0B0B] shadow-2xl flex items-center justify-center animate-modal-pop cursor-default ${ 
          isBackdrop 
            ? "w-[92vw] max-w-[1100px] aspect-video" 
            : "h-[85vh] max-h-[85vh] max-w-[90vw] aspect-[2/3]" 
        }`} 
        onClick={(e) => e.stopPropagation()} 
      > 
        {!loaded && ( 
          <div className="absolute inset-0 skeleton-shimmer" /> 
        )} 
        <img 
          src={imageSrc} 
          alt={isBackdrop ? "Backdrop preview" : "Poster preview"} 
          onLoad={() => setLoaded(true)} 
          className={`w-full h-full object-cover select-none transition-opacity duration-300 ${ 
            loaded ? "opacity-100" : "opacity-0" 
          }`} 
        /> 
      </div> 
    </div> 
  ); 
} 

export default function MediaItems({ movieData, seriesData }) { 
  const mediaItem = movieData || seriesData || {}; 
  const [selectedCover, setSelectedCover] = useState(null); 
  const [activeVideo, setActiveVideo] = useState(null); 
  const [activeImage, setActiveImage] = useState(null); 

  const volumes = mediaItem?.volumes || []; 
  const isBookOrManga = 
    Array.isArray(mediaItem?.volumes) || 
    ["MANGA", "MANHWA", "MANHUA", "BOOK / NOVEL", "NOVELS", "BOOKS", "LIGHT-NOVELS"].includes( 
      (mediaItem?.type || "").toUpperCase() 
    ); 

  const videos = useMemo(() => { 
    const rawVideos = (mediaItem?.videos?.results || []).filter( 
      (video) => video.site === "YouTube" 
    ); 

    return [...rawVideos] 
      .sort((a, b) => { 
        const getPriority = (v) => { 
          const name = (v.name || "").toLowerCase(); 
          const type = (v.type || "").toLowerCase(); 

          if (type === "trailer" && name.includes("official")) return 1; 
          if (type === "trailer") return 2; 
          if (type === "teaser") return 3; 
          return 4; 
        }; 

        return getPriority(a) - getPriority(b); 
      }) 
      .slice(0, 120); 
  }, [mediaItem?.videos?.results]); 

  const backdrops = useMemo(() => { 
    return (mediaItem?.images?.backdrops || []).slice(0, 120); 
  }, [mediaItem?.images?.backdrops]); 

  const posters = useMemo(() => { 
    return (mediaItem?.images?.posters || []).slice(0, 120); 
  }, [mediaItem?.images?.posters]); 

  const SectionTitle = ({ children, count, subtitle }) => ( 
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#1C1C1C] pb-4"> 
      <div className="flex items-center gap-3"> 
        <h3 className="text-xl font-light tracking-tight text-[#F5F5F5]"> 
          {children} 
        </h3> 
        {typeof count === "number" && ( 
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-tabular font-medium bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/30"> 
            {count} 
          </span> 
        )} 
      </div> 
      {subtitle && ( 
        <span className="text-xs text-[#7A7A7A] font-light">{subtitle}</span> 
      )} 
    </div> 
  ); 

  const EmptyState = ({ label }) => ( 
    <div className="py-12 px-6 rounded-[12px] border border-[#1C1C1C] bg-[#0B0B0B]/60 text-center"> 
      <p className="text-sm text-[#7A7A7A] font-light"> 
        No {label.toLowerCase()} available for this title. 
      </p> 
    </div> 
  ); 

  if (isBookOrManga) { 
    return ( 
      <section className="w-full bg-black text-[#F5F5F5]"> 
        <div className="py-2"> 
          <SectionTitle 
            count={volumes.length} 
            subtitle="Official Tankōbon, Volume & Edition Cover Art" 
          > 
            Volume &amp; Edition Covers 
          </SectionTitle> 

          {volumes.length > 0 ? ( 
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5"> 
              {volumes.map((vol, index) => { 
                const volBadge = 
                  vol.volume && vol.volume !== "Main" 
                    ? `VOL. ${vol.volume}` 
                    : `COVER ${index + 1}`; 

                return ( 
                  <div 
                    key={vol.id || index} 
                    onClick={() => setSelectedCover(vol)} 
                    className="group flex flex-col cursor-pointer transition-all" 
                  > 
                    <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] border border-[#1C1C1C] group-hover:border-[#61F1AC] group-hover:shadow-[0_0_24px_rgba(97,241,172,0.14)] transition-all duration-300 mb-2.5"> 
                      <img 
                        src={vol.cover} 
                        alt={vol.title || `Volume ${vol.volume}`} 
                        referrerPolicy="no-referrer" 
                        loading="lazy" 
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" 
                      /> 

                      <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 group-hover:border-[#61F1AC]/60 transition-colors"> 
                        <span className="text-[10px] font-tabular font-semibold tracking-wider uppercase text-[#F5F5F5] group-hover:text-[#61F1AC] transition-colors"> 
                          {volBadge} 
                        </span> 
                      </div> 

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3"> 
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#61F1AC]"> 
                          <BookOpen size={12} /> 
                          <span>View Cover</span> 
                        </span> 
                      </div> 
                    </div> 

                    <h4 className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-[#61F1AC] transition-colors"> 
                      {vol.title || `Volume ${vol.volume}`} 
                    </h4> 

                    {vol.subtitle && ( 
                      <span className="text-xs text-[#7A7A7A] truncate font-light mt-0.5 font-tabular"> 
                        {vol.subtitle} 
                      </span> 
                    )} 
                  </div> 
                ); 
              })} 
            </div> 
          ) : ( 
            <EmptyState label="volume covers" /> 
          )} 
        </div> 

        {selectedCover && ( 
          <div 
            onClick={() => setSelectedCover(null)} 
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" 
          > 
            <div 
              onClick={(e) => e.stopPropagation()} 
              className="relative max-w-md w-full bg-[#0B0B0B] border border-[#1C1C1C] rounded-[16px] overflow-hidden shadow-2xl p-4" 
            > 
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1C1C1C]"> 
                <div> 
                  <h4 className="text-sm font-semibold text-[#F5F5F5]"> 
                    {selectedCover.title} 
                  </h4> 
                  {selectedCover.subtitle && ( 
                    <p className="text-xs text-[#7A7A7A]"> 
                      {selectedCover.subtitle} 
                    </p> 
                  )} 
                </div> 
                <button 
                  type="button" 
                  onClick={() => setSelectedCover(null)} 
                  className="w-8 h-8 rounded-full bg-[#141414] border border-[#1C1C1C] flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#61F1AC]/50 transition-colors cursor-pointer" 
                > 
                  <X size={15} /> 
                </button> 
              </div> 
              <div className="aspect-[2/3] w-full rounded-[10px] overflow-hidden bg-[#050505] border border-[#1C1C1C]"> 
                <img 
                  src={selectedCover.cover} 
                  alt={selectedCover.title} 
                  referrerPolicy="no-referrer" 
                  className="w-full h-full object-contain" 
                /> 
              </div> 
            </div> 
          </div> 
        )} 
      </section> 
    ); 
  } 

  return ( 
    <section className="w-full bg-black text-[#F5F5F5]"> 
      <div className="space-y-10 py-6 sm:py-8"> 

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
                  <div className="relative aspect-video overflow-hidden rounded-[12px] border border-[#1C1C1C] group-hover:border-[#61F1AC]/50 bg-[#0B0B0B] transition-colors"> 
                    <img 
                      src={`https://img.youtube.com/vi/${video.key}/hqdefault.jpg`} 
                      alt={video.name} 
                      loading="lazy" 
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-75" 
                    /> 

                    <div className="absolute inset-0 flex items-center justify-center"> 
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/80 border border-white/15 group-hover:border-[#61F1AC] text-white transition group-hover:scale-110"> 
                        <Play size={19} fill="white" /> 
                      </span> 
                    </div> 
                  </div> 

                  <p className="mt-2 line-clamp-1 text-sm font-medium text-[#F5F5F5] group-hover:text-[#61F1AC] transition-colors"> 
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

        <section> 
          <SectionTitle count={backdrops.length}>Backdrops</SectionTitle> 

          {backdrops.length > 0 ? ( 
            <ScrollRow label="Backdrops"> 
              {backdrops.map((image, index) => ( 
                <button 
                  key={image.file_path || index} 
                  type="button" 
                  onClick={() => setActiveImage({ ...image, format: "backdrop" })} 
                  className="group w-[260px] shrink-0 sm:w-[340px] lg:w-[400px] text-left cursor-pointer" 
                > 
                  <div className="aspect-video overflow-hidden rounded-[12px] border border-[#1C1C1C] group-hover:border-[#61F1AC]/50 bg-[#0B0B0B] transition-all duration-300 group-hover:scale-[1.02]"> 
                    <img 
                      src={getTmdbImageUrl(image.file_path, "w780")} 
                      alt={`Backdrop ${index + 1}`} 
                      loading="lazy" 
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105" 
                    /> 
                  </div> 
                </button> 
              ))} 
            </ScrollRow> 
          ) : ( 
            <EmptyState label="Backdrops" /> 
          )} 
        </section> 

        <section> 
          <SectionTitle count={posters.length}>Posters</SectionTitle> 

          {posters.length > 0 ? ( 
            <ScrollRow label="Posters"> 
              {posters.map((image, index) => ( 
                <button 
                  key={image.file_path || index} 
                  type="button" 
                  onClick={() => setActiveImage({ ...image, format: "poster" })} 
                  className="group w-[125px] shrink-0 sm:w-[155px] lg:w-[175px] text-left cursor-pointer" 
                > 
                  <div className="aspect-[2/3] overflow-hidden rounded-[12px] border border-[#1C1C1C] group-hover:border-[#61F1AC]/50 bg-[#0B0B0B] transition-all duration-300 group-hover:scale-[1.02]"> 
                    <img 
                      src={getTmdbImageUrl(image.file_path, "w500")} 
                      alt={`Poster ${index + 1}`} 
                      loading="lazy" 
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105" 
                    /> 
                  </div> 
                </button> 
              ))} 
            </ScrollRow> 
          ) : ( 
            <EmptyState label="Posters" /> 
          )} 
        </section> 
      </div> 

      {activeVideo && ( 
        <VideoModal 
          videoKey={activeVideo.key} 
          videoName={activeVideo.name} 
          onClose={() => setActiveVideo(null)} 
        /> 
      )} 

      {activeImage && ( 
        <ImageModal 
          image={activeImage} 
          format={activeImage.format} 
          onClose={() => setActiveImage(null)} 
        /> 
      )} 
    </section> 
  ); 
} 