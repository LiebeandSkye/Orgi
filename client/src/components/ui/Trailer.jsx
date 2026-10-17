import React, { useEffect } from "react"; 
import { X, ExternalLink } from "lucide-react"; 

export default function Trailer({ open, onClose, videoKey, videoName }) { 
  useEffect(() => { 
    if (!open) return; 
    const handleKey = (e) => { 
      if (e.key === "Escape") onClose?.(); 
    }; 
    document.addEventListener("keydown", handleKey); 
    return () => document.removeEventListener("keydown", handleKey); 
  }, [open, onClose]); 

  useEffect(() => { 
    if (!open) return; 
    const originalOverflow = document.body.style.overflow; 
    document.body.style.overflow = "hidden"; 
    return () => { 
      document.body.style.overflow = originalOverflow; 
    }; 
  }, [open]); 

  if (!open || !videoKey) return null; 

  const embedUrl = `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&playsinline=1`; 
  const watchUrl = `https://www.youtube.com/watch?v=${videoKey}`; 

  return ( 
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 cursor-pointer animate-in fade-in duration-200" 
      onClick={onClose} 
    > 
      <div 
        className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/20 cursor-default" 
        onClick={(e) => e.stopPropagation()} 
      > 
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2"> 
          <a 
            href={watchUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-neutral-800 text-white text-xs font-medium border border-white/20 transition-colors shadow-md backdrop-blur-sm cursor-pointer" 
            title="Open in YouTube" 
          > 
            <ExternalLink size={13} /> 
            <span className="hidden sm:inline">YouTube</span> 
          </a> 
          <button 
            type="button" 
            onClick={onClose} 
            aria-label="Close trailer" 
            className="p-1.5 sm:p-2 rounded-full bg-black/70 hover:bg-neutral-800 text-white transition-colors cursor-pointer border border-white/20 shadow-md backdrop-blur-sm" 
          > 
            <X size={18} /> 
          </button> 
        </div> 

        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}> 
          <iframe 
            className="absolute inset-0 w-full h-full" 
            src={embedUrl} 
            title={videoName || "Trailer"} 
            referrerPolicy="strict-origin-when-cross-origin" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure" 
            allowFullScreen 
          /> 
        </div> 
      </div> 
    </div> 
  ); 
} 
