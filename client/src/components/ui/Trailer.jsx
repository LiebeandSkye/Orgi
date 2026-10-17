import React, { useEffect } from "react"; 

export default function Trailer({ open, onClose, videoKey, videoName }) { 
  useEffect(() => { 
    if (!open) return; 
    const handleKey = (e) => { 
      if (e.key === "Escape") { 
        if (document.fullscreenElement) return; 
        onClose?.(); 
      } 
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

  return ( 
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 cursor-pointer animate-in fade-in duration-200" 
      onClick={onClose} 
    > 
      <div 
        className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/20 cursor-default" 
        onClick={(e) => e.stopPropagation()} 
      > 
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}> 
          <iframe 
            className="absolute inset-0 w-full h-full" 
            src={embedUrl} 
            title={videoName || "Trailer"} 
            referrerPolicy="strict-origin-when-cross-origin" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure; fullscreen" 
            allowFullScreen 
          /> 
        </div> 
      </div> 
    </div> 
  ); 
} 
