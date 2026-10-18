import React, { useState, useEffect } from "react"; 
import { Star, Bookmark, Play, SlidersHorizontal, BookOpen, ChevronRight, Check } from "lucide-react"; 
import { isGuestInCollection, toggleGuestCollection } from "../../../utils/guestCollection"; 
import { useAuth } from "../../../context/AuthContext"; 
import { useToast } from "../../../context/ToastContext"; 
import api from "../../../services/api"; 

export function StepPicksResults({ 
  medium, 
  picks = [], 
  vibes = [], 
  answers = {}, 
  onSelectPick, 
  onRefine, 
}) { 
  const { user } = useAuth() || {}; 
  const { showToast, openAuthModal } = useToast(); 
  const [collectionMap, setCollectionMap] = useState({}); 
  const [isSavingAll, setIsSavingAll] = useState(false); 

  const isBook = medium === "book"; 

  useEffect(() => { 
    if (!picks || picks.length === 0) return; 

    const token = localStorage.getItem("orgi_session"); 
    if (!token && !user) { 
      const map = {}; 
      picks.forEach((p) => { 
        map[p.id] = isGuestInCollection(p.provider || "tmdb", p.id); 
      }); 
      setCollectionMap(map); 
    } else { 
      Promise.allSettled( 
        picks.map((p) => api.get(`/collections/check/${p.provider || "tmdb"}/${p.id}`)) 
      ).then((results) => { 
        const map = {}; 
        results.forEach((r, idx) => { 
          if (r.status === "fulfilled" && r.value?.data?.inCollection) { 
            map[picks[idx].id] = true; 
          } 
        }); 
        setCollectionMap(map); 
      }); 
    } 
  }, [picks, user]); 

  const handleToggleCollection = async (e, pick) => { 
    e.stopPropagation(); 
    const token = localStorage.getItem("orgi_session"); 
    const itemProvider = pick.provider || "tmdb"; 
    const itemType = pick.type || (isBook ? "BOOK" : "MOVIE"); 

    if (!token && !user) { 
      const next = toggleGuestCollection({ 
        external_id: pick.id, 
        provider: itemProvider, 
        type: itemType, 
        title: pick.title, 
        cover_url: pick.poster, 
      }); 
      setCollectionMap((p) => ({ ...p, [pick.id]: next })); 
      showToast({ 
        message: next ? "Saved to local collection." : "Removed from collection.", 
        actionText: "Sign In to Sync", 
        onAction: openAuthModal, 
      }); 
      return; 
    } 

    try { 
      const res = await api.post("/collections/toggle", { 
        external_id: pick.id, 
        provider: itemProvider, 
        type: itemType, 
        title: pick.title, 
        cover_url: pick.poster, 
      }); 
      if (res?.success) { 
        const inCol = Boolean(res.data?.inCollection); 
        setCollectionMap((p) => ({ ...p, [pick.id]: inCol })); 
        showToast({ 
          message: inCol ? `Added "${pick.title}" to collection.` : `Removed from collection.`, 
        }); 
      } 
    } catch { 
      showToast({ message: "Could not update collection." }); 
    } 
  }; 

  const handleSaveAll = async () => { 
    if (!picks || picks.length === 0) return; 
    setIsSavingAll(true); 

    const token = localStorage.getItem("orgi_session"); 
    const items = picks.map((pick) => ({ 
      external_id: String(pick.id), 
      provider: pick.provider || "tmdb", 
      type: pick.type || (isBook ? "BOOK" : "MOVIE"), 
      title: pick.title, 
      cover_url: pick.poster, 
      status: "plan", 
    })); 

    if (token || user) { 
      try { 
        const res = await api.post("/collections/merge", { items }); 
        if (res?.success) { 
          const nextMap = { ...collectionMap }; 
          picks.forEach((p) => { 
            nextMap[p.id] = true; 
          }); 
          setCollectionMap(nextMap); 
          showToast({ message: "Saved all 3 picks to your collection!" }); 
        } else { 
          showToast({ message: "Failed to save picks to collection." }); 
        } 
      } catch { 
        showToast({ message: "Could not save picks to server collection." }); 
      } finally { 
        setIsSavingAll(false); 
      } 
    } else { 
      items.forEach((item) => toggleGuestCollection(item)); 
      const nextMap = { ...collectionMap }; 
      picks.forEach((p) => { 
        nextMap[p.id] = true; 
      }); 
      setCollectionMap(nextMap); 
      setIsSavingAll(false); 
      showToast({ 
        message: "Saved all 3 picks to your local list!", 
        actionText: "Sign In to Sync", 
        onAction: openAuthModal, 
      }); 
    } 
  }; 

  const allSaved = picks.length > 0 && picks.every((p) => collectionMap[p.id]); 

  return ( 
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto py-6"> 
      <div className="lg:col-span-4 flex flex-col justify-between"> 
        <div> 
          <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-[#F5F5F5] leading-tight mb-3"> 
            Here are your{" "} 
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0]"> 
              3 picks! 
            </span> 
          </h1> 

          <p className="text-sm text-[#9CA3AF] leading-relaxed mb-6"> 
            Based on your preferences, we found 3 {isBook ? "books" : "movies"} that match your vibe. Enjoy! 
          </p> 

          <div className="flex flex-wrap gap-2 mb-8"> 
            {vibes.map((v) => ( 
              <span 
                key={v} 
                className="px-3 py-1 rounded-full text-xs font-medium bg-[#61F1AC]/10 text-[#61F1AC] border border-[#61F1AC]/25" 
              > 
                {v} 
              </span> 
            ))} 
            {answers.time && ( 
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] text-[#A1A1AA] border border-white/10"> 
                {answers.time === "under90" ? "Under 90m" : answers.time === "90-120" ? "90-120m" : answers.time === "episodes" ? "Series / Episodes" : "2+ hours"} 
              </span> 
            )} 
          </div> 

          <button 
            type="button" 
            onClick={onRefine} 
            className="w-full p-4 rounded-2xl bg-[#0B0F13] border border-[#1E262F] hover:border-[#61F1AC]/50 flex items-center justify-between text-left transition-all mb-4 group cursor-pointer shadow-xl" 
          > 
            <div className="flex items-center gap-3"> 
              <div className="w-10 h-10 rounded-xl bg-black/40 border border-[#1E262F] flex items-center justify-center text-[#61F1AC] group-hover:border-[#61F1AC]/40"> 
                <SlidersHorizontal size={18} /> 
              </div> 
              <div> 
                <div className="text-sm font-semibold text-[#F5F5F5] group-hover:text-[#61F1AC] transition-colors"> 
                  Refine your picks 
                </div> 
                <div className="text-xs text-[#7A7A7A]">Change your preferences</div> 
              </div> 
            </div> 
            <ChevronRight size={16} className="text-[#7A7A7A] group-hover:text-white group-hover:translate-x-0.5 transition-all" /> 
          </button> 

          <button 
            type="button" 
            disabled={isSavingAll} 
            onClick={handleSaveAll} 
            className={`w-full py-3 px-4 rounded-2xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${ 
              allSaved 
                ? "border-[#61F1AC]/50 bg-[#61F1AC]/15 text-[#61F1AC]" 
                : "border-[#1E262F] bg-[#0B0F13] hover:border-white/20 text-[#C5C5C5] hover:text-white" 
            }`} 
          > 
            {allSaved ? <Check size={15} className="stroke-[3]" /> : <Bookmark size={15} />} 
            <span>{isSavingAll ? "Saving..." : allSaved ? "All saved in collection" : "Save this list"}</span> 
          </button> 
        </div> 

        <div className="pt-8 hidden lg:flex items-center gap-2"> 
          <svg className="w-8 h-8 text-[#61F1AC] rotate-12" viewBox="0 0 40 40" fill="none"> 
            <path d="M5 10 C 15 5, 25 20, 32 30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" /> 
            <path d="M25 28 L 32 30 L 30 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> 
          </svg> 
          <span className="text-xs text-[#7A7A7A] italic"> 
            Not quite right? Refine and get new picks. 
          </span> 
        </div> 
      </div> 

      <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6"> 
        {picks.map((pick) => { 
          const isCollected = Boolean(collectionMap[pick.id]); 
          return ( 
            <div 
              key={pick.id} 
              onClick={() => onSelectPick(pick)} 
              className="group relative rounded-3xl bg-[#0B0F13] border border-[#1E262F] hover:border-[#61F1AC]/50 p-4 flex flex-col justify-between transition-all duration-300 shadow-2xl hover:shadow-[0_0_35px_rgba(97,241,172,0.15)] cursor-pointer" 
            > 
              <div> 
                <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden mb-4 bg-black border border-white/5"> 
                  <img 
                    src={pick.poster} 
                    alt={pick.title} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                  /> 
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-xs font-bold text-[#61F1AC] shadow-lg"> 
                    {pick.rank} 
                  </div> 

                  <button 
                    type="button" 
                    aria-label="Save to collection" 
                    onClick={(e) => handleToggleCollection(e, pick)} 
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full border flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer ${ 
                      isCollected 
                        ? "bg-[#61F1AC] text-black border-[#61F1AC]" 
                        : "bg-black/60 border-white/20 text-[#B5B5B5] hover:text-white" 
                    }`} 
                  > 
                    <Bookmark size={14} className={isCollected ? "fill-black" : ""} /> 
                  </button> 
                </div> 

                <h3 className="text-lg font-bold text-[#F5F5F5] truncate mb-1 group-hover:text-[#61F1AC] transition-colors"> 
                  {pick.title} 
                </h3> 

                <div className="text-xs text-[#7A7A7A] mb-2 truncate font-tabular"> 
                  {pick.year} · {pick.genreTags} 
                </div> 

                <div className="flex items-center gap-1.5 text-xs text-[#61F1AC] font-semibold mb-3"> 
                  <Star size={13} className="fill-[#61F1AC]" /> 
                  <span>{pick.rating} / 10</span> 
                  <span className="text-[11px] text-[#7A7A7A] font-normal">({pick.votesCount})</span> 
                </div> 

                <p className="text-xs text-[#A1A1AA] line-clamp-3 leading-relaxed mb-4"> 
                  {pick.pitch} 
                </p> 

                <div className="flex flex-wrap gap-1.5 mb-5"> 
                  {(pick.vibes || []).map((v) => ( 
                    <span 
                      key={v} 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#61F1AC]/10 text-[#61F1AC] border border-[#61F1AC]/20" 
                    > 
                      {v} 
                    </span> 
                  ))} 
                </div> 
              </div> 

              <button 
                type="button" 
                onClick={() => onSelectPick(pick)} 
                className="w-full py-3 rounded-xl bg-[#61F1AC] hover:bg-[#52deb0] text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#61F1AC]/15 cursor-pointer mt-auto" 
              > 
                {isBook ? <BookOpen size={14} /> : <Play size={14} className="fill-black" />} 
                <span>{isBook ? "Read now" : "Watch now"}</span> 
              </button> 
            </div> 
          ); 
        })} 
      </div> 
    </div> 
  ); 
} 
