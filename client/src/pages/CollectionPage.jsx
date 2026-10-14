import React, { useState, useEffect, useCallback } from "react"; 
import { Link } from "react-router-dom"; 
import { 
  Bookmark, 
  Trash2, 
  ChevronDown, 
  Film, 
  BookOpen, 
  ArrowRight, 
  Layers, 
  Sparkles 
} from "lucide-react"; 
import api from "../services/api"; 
import { Button } from "../components/ui/Button"; 
import { CardSkeletonGrid } from "../components/ui/CardSkeleton"; 
import { useAuth } from "../context/AuthContext"; 

const STATUS_LABELS = { 
  plan: "Plan", 
  progress: "Progress", 
  completed: "Completed", 
}; 

const STATUS_COLORS = { 
  plan: "bg-[#1A1A1A] text-[#B5B5B5] border-[#2A2A2A]", 
  progress: "bg-[#1E3A5F]/60 text-[#60A5FA] border-[#3B82F6]/30", 
  completed: "bg-[#1E3A2B] text-[#78F5B8] border-[#2E5E43]", 
}; 

export function CollectionPage() { 
  const { session } = useAuth(); 
  const [items, setItems] = useState([]); 
  const [isLoading, setIsLoading] = useState(Boolean(session)); 
  const [errorMessage, setErrorMessage] = useState(null); 
  const [activeTab, setActiveTab] = useState("all"); 
  const [statusMenuOpen, setStatusMenuOpen] = useState(null); 
  const [isUpdating, setIsUpdating] = useState({}); 

  const loadCollections = useCallback(async () => { 
    if (!session) return; 
    setIsLoading(true); 
    setErrorMessage(null); 
    try { 
      const res = await api.get("/collections"); 
      if (res?.success) { 
        setItems(res.data || []); 
      } 
    } catch (err) { 
      setErrorMessage(err.message || "Failed to load collection items"); 
    } finally { 
      setIsLoading(false); 
    } 
  }, [session]); 

  useEffect(() => { 
    if (session) { 
      loadCollections(); 
    } else { 
      setItems([]); 
      setIsLoading(false); 
    } 
  }, [session, loadCollections]); 

  const handleUpdateStatus = async (itemId, newStatus) => { 
    setStatusMenuOpen(null); 
    setIsUpdating((prev) => ({ ...prev, [itemId]: true })); 
    try { 
      const res = await api.patch(`/collections/${itemId}/status`, { 
        status: newStatus, 
      }); 
      if (res?.success) { 
        setItems((prev) => 
          prev.map((item) => 
            item.itemId === itemId ? { ...item, status: newStatus } : item 
          ) 
        ); 
      } 
    } catch (err) { 
      console.error("Failed to update item status:", err); 
      alert(err.message || "Failed to update status"); 
    } finally { 
      setIsUpdating((prev) => ({ ...prev, [itemId]: false })); 
    } 
  }; 

  const handleRemoveItem = async (item) => { 
    if (!confirm(`Remove "${item.title}" from your collection?`)) return; 

    setIsUpdating((prev) => ({ ...prev, [item.itemId]: true })); 
    try { 
      const res = await api.post("/collections/toggle", { 
        external_id: item.externalId, 
        provider: item.provider, 
        type: item.type, 
        title: item.title, 
        cover_url: item.coverUrl, 
      }); 

      if (res?.success && !res.data?.inCollection) { 
        setItems((prev) => prev.filter((i) => i.itemId !== item.itemId)); 
      } 
    } catch (err) { 
      console.error("Failed to remove collection item:", err); 
      alert(err.message || "Failed to remove item"); 
    } finally { 
      setIsUpdating((prev) => ({ ...prev, [item.itemId]: false })); 
    } 
  }; 

  const counts = { 
    all: items.length, 
    plan: items.filter((i) => i.status === "plan").length, 
    progress: items.filter((i) => i.status === "progress").length, 
    completed: items.filter((i) => i.status === "completed").length, 
  }; 

  const filteredItems = items.filter((item) => { 
    if (activeTab === "all") return true; 
    return item.status === activeTab; 
  }); 

  const getItemLink = (item) => { 
    if (item.type === "MOVIE") { 
      return `/movie/${item.externalId}`; 
    } 
    if (item.type === "SERIES") { 
      return `/movie/${item.externalId}`; 
    } 
    const cat = item.type ? item.type.toLowerCase() : "manhwa"; 
    return `/books/${cat}/${item.externalId}`; 
  }; 

  if (!session) { 
    return ( 
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center"> 
        <div className="w-16 h-16 rounded-2xl bg-[#0E0E0E] border border-[#1C1C1C] flex items-center justify-center text-[#61F1AC] mb-6 shadow-xl"> 
          <Bookmark size={28} /> 
        </div> 
        <h1 className="text-3xl font-light text-[#F5F5F5] tracking-tight mb-2"> 
          Your Collection 
        </h1> 
        <p className="text-sm text-[#7A7A7A] max-w-sm mb-8 leading-relaxed"> 
          Sign in to save movies, series, books, and manga to your personal library. 
        </p> 
        <Link to="/login"> 
          <Button variant="primary" size="md" className="px-6 py-2.5 rounded-xl cursor-pointer"> 
            <span>Sign in to continue</span> 
            <ArrowRight size={15} /> 
          </Button> 
        </Link> 
      </div> 
    ); 
  } 

  return ( 
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-24 pt-8"> 
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px]"> 
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#1C1C1C]"> 
          <div> 
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#61F1AC] mb-2"> 
              <Layers size={14} /> 
              <span>Personal</span> 
            </div> 
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#F5F5F5]"> 
              Collection 
            </h1> 
          </div> 

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"> 
            {[ 
              { key: "all", label: "All" }, 
              { key: "plan", label: "Plan" }, 
              { key: "progress", label: "Progress" }, 
              { key: "completed", label: "Completed" }, 
            ].map((tab) => { 
              const isActive = activeTab === tab.key; 
              const isProgress = tab.key === "progress"; 
              return ( 
                <button 
                  key={tab.key} 
                  type="button" 
                  onClick={() => setActiveTab(tab.key)} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${ 
                    isActive 
                      ? isProgress 
                        ? "bg-[#3B82F6] text-white font-semibold shadow-[0_0_15px_rgba(59,130,246,0.35)]" 
                        : "bg-[#61F1AC] text-black font-semibold shadow-[0_0_15px_rgba(97,241,172,0.25)]" 
                      : isProgress 
                        ? "bg-[#0B0B0B] border border-[#1C1C1C] text-[#B5B5B5] hover:text-[#60A5FA] hover:border-[#3B82F6]/40" 
                        : "bg-[#0B0B0B] border border-[#1C1C1C] text-[#B5B5B5] hover:text-white hover:border-[#61F1AC]/40" 
                  }`} 
                > 
                  <span>{tab.label}</span> 
                  <span 
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-tabular ${ 
                      isActive 
                        ? isProgress 
                          ? "bg-white/20 text-white font-bold" 
                          : "bg-black/20 text-black font-bold" 
                        : "bg-[#181818] text-[#7A7A7A]" 
                    }`} 
                  > 
                    {counts[tab.key] || 0} 
                  </span> 
                </button> 
              ); 
            })} 
          </div> 
        </div> 

        {errorMessage ? ( 
          <div className="flex flex-col items-center justify-center py-24 text-center"> 
            <p className="text-sm text-red-400 mb-4">{errorMessage}</p> 
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadCollections} 
              className="px-4 py-2 rounded-lg text-xs cursor-pointer" 
            > 
              <span>Try Again</span> 
            </Button> 
          </div> 
        ) : isLoading ? ( 
          <CardSkeletonGrid count={12} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-8" /> 
        ) : filteredItems.length === 0 ? ( 
          <div className="flex flex-col items-center justify-center py-24 text-center"> 
            <div className="w-14 h-14 rounded-full bg-[#0E0E0E] border border-[#1C1C1C] flex items-center justify-center text-[#7A7A7A] mb-4"> 
              <Sparkles size={22} /> 
            </div> 
            <h2 className="text-xl font-light text-[#F5F5F5] mb-2"> 
              No items in {STATUS_LABELS[activeTab] || "collection"} 
            </h2> 
            <p className="text-sm text-[#7A7A7A] max-w-sm mb-6 font-light"> 
              Explore trending titles, movies, and stories to add them to your collection. 
            </p> 
            <div className="flex items-center gap-3"> 
              <Link to="/movies"> 
                <Button variant="outline" size="sm" className="px-4 py-2 rounded-lg text-xs cursor-pointer"> 
                  <Film size={14} /> 
                  <span>Browse Movies</span> 
                </Button> 
              </Link> 
              <Link to="/books/manhwa"> 
                <Button variant="mintGhost" size="sm" className="px-4 py-2 rounded-lg text-xs cursor-pointer"> 
                  <BookOpen size={14} /> 
                  <span>Browse Manhwa</span> 
                </Button> 
              </Link> 
            </div> 
          </div> 
        ) : ( 
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-8"> 
            {filteredItems.map((item) => { 
              const isItemMenuOpen = statusMenuOpen === item.itemId; 
              const updating = isUpdating[item.itemId]; 

              return ( 
                <div 
                  key={item.id} 
                  className="group flex flex-col transition-all" 
                > 
                  <div className="relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] border border-[#1C1C1C] group-hover:border-[#61F1AC]/60 group-hover:shadow-[0_0_20px_rgba(97,241,172,0.12)] transition-all duration-300"> 
                    <Link to={getItemLink(item)} className="block w-full h-full"> 
                      <img 
                        src={ 
                          item.coverUrl || 
                          "https://via.placeholder.com/300x450/0B0B0B/7A7A7A?text=No+Cover" 
                        } 
                        alt={item.title} 
                        loading="lazy" 
                        className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500" 
                      /> 
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" /> 
                    </Link> 

                    <div className="absolute top-0.5 left-1 z-10 pointer-events-none"> 
                      <span className="px-2 py-1 rounded-md text-[10px] font-semibold tracking-wider uppercase bg-black/75 backdrop-blur-md border border-white/10 text-white"> 
                        {item.type || "MEDIA"} 
                      </span> 
                    </div> 
                  </div> 

                  <div className="mt-2.5 flex flex-col"> 
                    <Link to={getItemLink(item)} className="block"> 
                      <h3 className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-white transition-colors"> 
                        {item.title} 
                      </h3> 
                    </Link> 

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#1C1C1C]/60 text-xs"> 
                      <div className="relative"> 
                        <button 
                          type="button" 
                          disabled={updating} 
                          onClick={() => 
                            setStatusMenuOpen(isItemMenuOpen ? null : item.itemId) 
                          } 
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${ 
                            STATUS_COLORS[item.status] || STATUS_COLORS.plan 
                          }`} 
                        > 
                          <span>{STATUS_LABELS[item.status] || "Plan"}</span> 
                          <ChevronDown size={11} /> 
                        </button> 

                        {isItemMenuOpen && ( 
                          <div className="absolute left-0 bottom-full mb-1.5 w-32 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg py-1 shadow-2xl z-30"> 
                            {["plan", "progress", "completed"].map((st) => ( 
                              <button 
                                key={st} 
                                type="button" 
                                onClick={() => handleUpdateStatus(item.itemId, st)} 
                                className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${ 
                                  item.status === st 
                                    ? st === "progress" 
                                      ? "text-[#60A5FA] bg-[#141414] font-semibold" 
                                      : "text-[#61F1AC] bg-[#141414] font-semibold" 
                                    : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]" 
                                }`} 
                              > 
                                {STATUS_LABELS[st]} 
                              </button> 
                            ))} 
                          </div> 
                        )} 
                      </div> 

                      <button 
                        type="button" 
                        aria-label="Remove item" 
                        disabled={updating} 
                        onClick={() => handleRemoveItem(item)} 
                        className="p-1 rounded-full text-[#7A7A7A] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer" 
                      > 
                        <Trash2 size={13} /> 
                      </button> 
                    </div> 
                  </div> 
                </div> 
              ); 
            })} 
          </div> 
        )} 
      </div> 
    </div> 
  ); 
} 
