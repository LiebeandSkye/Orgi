import React, { useEffect, useState } from "react"; 
import { X, ExternalLink } from "lucide-react"; 
import { AiVerdictHero } from "../../../components/ui/AiVerdictHero"; 
import { AiVerdictSkeleton } from "../../../components/ui/AiVerdictSkeleton"; 
import Trailer from "../../../components/ui/Trailer"; 
import { getMediaVideos, findTrailerKey } from "../../../services/tmdb"; 
import { fetchMediaVerdict } from "../../../services/mediaApi"; 
import { isGuestInCollection, toggleGuestCollection } from "../../../utils/guestCollection"; 
import { useAuth } from "../../../context/AuthContext"; 
import { useToast } from "../../../context/ToastContext"; 
import api from "../../../services/api"; 

export function MediaQuickSummaryModal({ item, isOpen, onClose }) { 
  const { user } = useAuth() || {}; 
  const { showToast, openAuthModal } = useToast(); 
  const [trailerKey, setTrailerKey] = useState(null); 
  const [showTrailer, setShowTrailer] = useState(false); 
  const [loadingTrailer, setLoadingTrailer] = useState(false); 
  const [inCollection, setInCollection] = useState(false); 
  const [verdictData, setVerdictData] = useState(item?.aiVerdict || null); 
  const [isLoadingVerdict, setIsLoadingVerdict] = useState(false); 

  useEffect(() => { 
    if (!isOpen || !item) return; 

    setVerdictData(item.aiVerdict || null); 
    const token = localStorage.getItem("orgi_session"); 
    if (!token && !user) { 
      setInCollection(isGuestInCollection(item.provider || "tmdb", item.id)); 
    } else { 
      api.get(`/collections/check/${item.provider || "tmdb"}/${item.id}`) 
        .then((res) => { 
          if (res?.data?.inCollection) setInCollection(true); 
        }) 
        .catch(() => {}); 
    } 

    if (!item.aiVerdict) { 
      setIsLoadingVerdict(true); 
      fetchMediaVerdict({ 
        provider: item.provider || "tmdb", 
        id: item.id, 
        title: item.title, 
        type: item.type === "SERIES" ? "tv" : item.type === "BOOK" ? (item.subMedium || "manga") : "movie", 
        genres: item.genreTags, 
        year: item.year, 
        synopsis: item.synopsis, 
      }) 
        .then((res) => { 
          if (res?.success && res.data) { 
            setVerdictData(res.data); 
          } 
        }) 
        .finally(() => { 
          setIsLoadingVerdict(false); 
        }); 
    } 

    const handleKeyDown = (e) => { 
      if (e.key === "Escape") onClose(); 
    }; 
    window.addEventListener("keydown", handleKeyDown); 
    return () => window.removeEventListener("keydown", handleKeyDown); 
  }, [isOpen, item, user, onClose]); 

  if (!isOpen || !item) return null; 

  const detailUrl = item.route || (item.type === "SERIES" ? `/series/${item.id}` : `/movie/${item.id}`); 
  const category = item.subMedium || (item.type === "BOOK" ? "manga" : null); 

  const movieData = { 
    title: item.title, 
    poster: item.poster, 
    type: item.type || (category ? category.toUpperCase() : "MOVIE"), 
    genres: item.genreTags, 
    year: item.year, 
    synopsis: item.synopsis, 
    runtime: item.runtime || (item.type === "SERIES" ? "TV Series" : item.type === "BOOK" ? "Serialized" : "Feature Film"), 
    tmdbRating: item.rating, 
    tmdbVotes: item.votesCount, 
  }; 

  const handlePlayTrailer = async () => { 
    if (trailerKey) { 
      setShowTrailer(true); 
      return; 
    } 
    setLoadingTrailer(true); 
    try { 
      const videos = await getMediaVideos(item.id, item.type === "SERIES" ? "tv" : "movie"); 
      const key = findTrailerKey(videos); 
      if (key) { 
        setTrailerKey(key); 
        setShowTrailer(true); 
      } else { 
        showToast({ message: "No official trailer available." }); 
      } 
    } catch { 
      showToast({ message: "Could not load trailer." }); 
    } finally { 
      setLoadingTrailer(false); 
    } 
  }; 

  const handleToggleCollection = async () => { 
    const token = localStorage.getItem("orgi_session"); 
    const itemProvider = item.provider || "tmdb"; 
    const itemType = item.type || "MOVIE"; 

    if (!token && !user) { 
      const next = toggleGuestCollection({ 
        external_id: item.id, 
        provider: itemProvider, 
        type: itemType, 
        title: item.title, 
        cover_url: item.poster, 
      }); 
      setInCollection(next); 
      showToast({ 
        message: next ? "Added to local collection." : "Removed from collection.", 
        actionText: "Sign In to Sync", 
        onAction: openAuthModal, 
      }); 
      return; 
    } 

    try { 
      const res = await api.post("/collections/toggle", { 
        external_id: item.id, 
        provider: itemProvider, 
        type: itemType, 
        title: item.title, 
        cover_url: item.poster, 
      }); 
      if (res?.success) { 
        setInCollection(Boolean(res.data?.inCollection)); 
        showToast({ 
          message: res.data?.inCollection ? `Added "${item.title}" to collection.` : `Removed from collection.`, 
        }); 
      } 
    } catch (err) { 
      showToast({ message: err.message || "Failed to update collection." }); 
    } 
  }; 

  const handleShare = () => { 
    const fullUrl = window.location.origin + detailUrl; 
    navigator.clipboard?.writeText(fullUrl); 
    showToast({ message: "Link copied to clipboard!" }); 
  }; 

  const handleOpenFullPage = () => { 
    window.open(detailUrl, "_blank", "noopener,noreferrer"); 
  }; 

  return ( 
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"> 
      <div 
        role="dialog" 
        aria-modal="true" 
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0B0F13] border border-[#1E262F] text-[#F5F5F5] shadow-2xl shadow-black p-6 sm:p-8" 
      > 
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#1E262F]"> 
          <div className="flex items-center gap-2"> 
            <span className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#61F1AC]"> 
              ORGI PICKS · QUICK VERDICT 
            </span> 
          </div> 

          <div className="flex items-center gap-2"> 
            <button 
              type="button" 
              onClick={handleOpenFullPage} 
              className="h-8 px-3 rounded-full border border-[#1E262F] hover:border-white/20 bg-black/40 text-xs text-[#9CA3AF] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer" 
            > 
              <span>Full Page</span> 
              <ExternalLink size={12} /> 
            </button> 
            <button 
              type="button" 
              onClick={onClose} 
              aria-label="Close" 
              className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-[#B5B5B5] hover:text-white hover:bg-black/80 transition-colors cursor-pointer" 
            > 
              <X size={16} /> 
            </button> 
          </div> 
        </div> 

        {isLoadingVerdict ? ( 
          <AiVerdictSkeleton 
            movieData={movieData} 
            category={category} 
          /> 
        ) : ( 
          <AiVerdictHero 
            movieData={movieData} 
            verdictData={verdictData} 
            blendedScore={item.rating} 
            totalVotesLabel={`${item.votesCount} ratings`} 
            inCollection={inCollection} 
            collectionLoading={false} 
            onToggleCollection={handleToggleCollection} 
            onPlayTrailer={handlePlayTrailer} 
            isLoadingTrailer={loadingTrailer} 
            onOpenReviews={handleOpenFullPage} 
            onShare={handleShare} 
            category={category} 
          /> 
        )} 

        {showTrailer && trailerKey && ( 
          <Trailer 
            open={showTrailer} 
            videoKey={trailerKey} 
            videoName={`${item?.title || "Media"} Trailer`} 
            onClose={() => setShowTrailer(false)} 
          /> 
        )} 
      </div> 
    </div> 
  ); 
} 
