import React, { useState, useRef, useEffect } from "react"; 
import { Star, MoreHorizontal, Heart, MessageSquare, Copy, AlertCircle, Check } from "lucide-react"; 
import { Avatar } from "./Avatar"; 

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (Number.isNaN(diffSec) || diffSec < 0) return "";
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function ReviewCard({
  item,
  isBookmarked = false,
  onToggleBookmark,
  isLiked = false,
  onToggleLike,
  onOpenDetail,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);
  const menuRef = useRef(null);
  
  // Close menu on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [menuOpen]);
  
  const handleCopyLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}${item.detailHref}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setMenuOpen(false);
      }, 1500);
    });
  };
  
  const handleReport = (e) => {
    e.stopPropagation();
    setReported(true);
    setTimeout(() => {
      setReported(false);
      setMenuOpen(false);
    }, 1500);
  };
  
  const isSynopsis = item.excerptKind === "synopsis";
  const relativeTime = formatRelativeTime(item.createdAt);
  
  const likesCount = (item.likes ?? 0) + (isLiked ? 1 : 0);
  
  return ( 
    <article className="group relative w-full bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#333333] hover:bg-[#121212] rounded-2xl p-4 sm:p-5 transition-all duration-200 flex gap-4 sm:gap-5 select-none shadow-sm"> 
      <div className="relative w-[96px] h-[142px] sm:w-[116px] sm:h-[168px] rounded-xl overflow-hidden bg-black/40 border border-[#1C1C1C] shrink-0 group-hover:border-[#2C2C2C] transition-colors"> 
        {item.posterUrl ? ( 
          <img 
            src={item.posterUrl} 
            alt={item.title} 
            loading="lazy" 
            decoding="async" 
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" 
          /> 
        ) : ( 
          <div className="w-full h-full flex items-center justify-center text-[11px] text-[#7A7A7A] p-2 text-center bg-[#000000]"> 
            {item.title} 
          </div> 
        )} 
        
        {item.mediaLabel && ( 
          <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none"> 
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-black/75 backdrop-blur-md border border-white/10 text-white"> 
              {item.mediaLabel} 
            </span> 
          </div> 
        )} 
      </div> 
      
      <div className="flex-1 min-w-0 flex flex-col justify-between"> 
        <div> 
          <div className="flex items-center justify-between gap-2 min-w-0 mb-1.5"> 
            <div className="flex items-center gap-2 min-w-0 flex-wrap"> 
              {isSynopsis ? ( 
                <span className="text-xs font-medium text-[#B5B5B5]"> 
                  {item.source === "mangadex" ? "MangaDex" : "Open Library"} · Community rating 
                </span> 
              ) : ( 
                <> 
                  <Avatar src={item.author?.avatarUrl} name={item.author?.name} size="w-6 h-6" /> 
                  <span className="text-xs sm:text-sm font-semibold text-[#F5F5F5] truncate max-w-[140px] sm:max-w-[200px]"> 
                    {item.author?.name || "Anonymous"} 
                  </span> 
                  {item.source === "orgi" && ( 
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold text-[#61F1AC] bg-[#61F1AC]/10 border border-[#61F1AC]/20 shrink-0"> 
                      Orgi 
                    </span> 
                  )} 
                  {relativeTime && ( 
                    <span 
                      className="text-xs text-[#7A7A7A] shrink-0" 
                      title={new Date(item.createdAt).toLocaleString()} 
                    > 
                      · {relativeTime} 
                    </span> 
                  )} 
                </> 
              )} 
            </div> 
            
            <div className="flex items-center gap-2 shrink-0"> 
              {item.rating !== undefined && item.rating !== null && ( 
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#61F1AC]/10 border border-[#61F1AC]/30 text-[#61F1AC] font-semibold text-xs font-tabular"> 
                  <Star size={12} className="fill-[#61F1AC] text-[#61F1AC]" /> 
                  <span>{typeof item.rating === "number" ? item.rating.toFixed(1) : item.rating}</span> 
                </div> 
              )} 
              
              <div className="relative z-10" ref={menuRef}> 
                <button 
                  type="button" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setMenuOpen((prev) => !prev); 
                  }} 
                  aria-label="More options" 
                  aria-haspopup="menu" 
                  aria-expanded={menuOpen} 
                  className="p-1 rounded-md text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] cursor-pointer transition-colors" 
                > 
                  <MoreHorizontal size={16} /> 
                </button> 
                
                {menuOpen && ( 
                  <div 
                    role="menu" 
                    className="absolute right-0 top-full mt-1 w-36 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg p-1 shadow-2xl z-20" 
                  > 
                    <button 
                      type="button" 
                      role="menuitem" 
                      onClick={handleCopyLink} 
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#F5F5F5] hover:bg-[#141414] rounded cursor-pointer text-left" 
                    > 
                      {copied ? ( 
                        <> 
                          <Check size={13} className="text-[#61F1AC]" /> 
                          <span className="text-[#61F1AC]">Copied!</span> 
                        </> 
                      ) : ( 
                        <> 
                          <Copy size={13} /> 
                          <span>Copy link</span> 
                        </> 
                      )} 
                    </button> 
                    <button 
                      type="button" 
                      role="menuitem" 
                      onClick={handleReport} 
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-[#141414] rounded cursor-pointer text-left" 
                    > 
                      {reported ? ( 
                        <> 
                          <Check size={13} className="text-rose-400" /> 
                          <span>Reported</span> 
                        </> 
                      ) : ( 
                        <> 
                          <AlertCircle size={13} /> 
                          <span>Report</span> 
                        </> 
                      )} 
                    </button> 
                  </div> 
                )} 
              </div> 
            </div> 
          </div> 
          
          <div className="flex items-center gap-2 flex-wrap mb-1.5"> 
            <h3 className="text-base sm:text-lg font-semibold text-[#F5F5F5] leading-snug"> 
              <button 
                type="button" 
                onClick={() => onOpenDetail(item)} 
                className="text-left cursor-pointer hover:text-[#61F1AC] transition-colors after:absolute after:inset-0 after:content-['']" 
              > 
                {item.title} 
              </button> 
            </h3> 
            {item.year && ( 
              <span className="text-xs text-[#7A7A7A]"> 
                ({item.year}) 
              </span> 
            )} 
            {item.containsSpoilers && ( 
              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20"> 
                Spoilers 
              </span> 
            )} 
          </div> 
          
          <div className="my-2 bg-[#060606] border border-[#1A1A1A] rounded-xl p-3 sm:p-3.5 transition-colors group-hover:border-[#242424]"> 
            <p className="text-[14px] sm:text-[14.5px] leading-relaxed text-[#EDEDED] font-light line-clamp-3 break-words"> 
              "{item.excerpt}" 
            </p> 
          </div> 
        </div> 
        
        <div className="flex items-center justify-between gap-3 pt-2 text-xs text-[#7A7A7A]"> 
          {item.genres && item.genres.length > 0 ? ( 
            <div className="flex flex-wrap items-center gap-1.5"> 
              {item.genres.slice(0, 3).map((g, idx) => ( 
                <span 
                  key={idx} 
                  className="px-2 py-0.5 rounded-md text-[11px] text-[#888888] bg-[#121212] border border-[#1E1E1E] lowercase" 
                > 
                  {g} 
                </span> 
              ))} 
            </div> 
          ) : ( 
            <div /> 
          )} 
          
          <div className="flex items-center gap-4"> 
            {item.likes !== undefined && item.likes !== null && ( 
              <button 
                type="button" 
                aria-pressed={isLiked} 
                aria-label={isLiked ? "Unlike review" : "Like review"} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onToggleLike?.(item); 
                }} 
                className={`relative z-10 flex items-center gap-1.5 transition-colors duration-150 cursor-pointer ${ 
                  isLiked 
                    ? "text-rose-500 hover:text-rose-400" 
                    : "text-[#7A7A7A] hover:text-rose-400" 
                }`} 
              > 
                <Heart 
                  size={14} 
                  className={`transition-transform duration-150 ${ 
                    isLiked ? "fill-rose-500 scale-105" : "" 
                  }`} 
                /> 
                <span className="font-tabular">{likesCount}</span> 
              </button> 
            )} 
            {item.comments !== undefined && item.comments !== null && ( 
              <div className="flex items-center gap-1.5"> 
                <MessageSquare size={14} /> 
                <span className="font-tabular">{item.comments}</span> 
              </div> 
            )} 
          </div> 
        </div> 
      </div> 
    </article> 
  ); 
}