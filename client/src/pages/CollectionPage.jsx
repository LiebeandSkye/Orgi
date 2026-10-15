import React, { useState, useEffect, useCallback, useRef } from "react"; 
import { Link } from "react-router-dom"; 
import { 
  Bookmark, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  X, 
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

const TYPE_OPTIONS = [ 
  { key: "all", label: "All Types" }, 
  { key: "MOVIE", label: "Movies" }, 
  { key: "SERIES", label: "Series" }, 
  { key: "BOOK", label: "Books" }, 
  { key: "MANGA", label: "Manga" }, 
  { key: "MANHWA", label: "Manhwa" }, 
  { key: "MANHUA", label: "Manhua" }, 
]; 

const SORT_OPTIONS = [ 
  { key: "recent", label: "Recently Added" }, 
  { key: "title_asc", label: "Title (A–Z)" }, 
  { key: "title_desc", label: "Title (Z–A)" }, 
]; 

export function CollectionPage() { 
  const { session } = useAuth(); 
  const [items, setItems] = useState([]); 
  const [isLoading, setIsLoading] = useState(Boolean(session)); 
  const [errorMessage, setErrorMessage] = useState(null); 
  const [statusFilter, setStatusFilter] = useState("all"); 
  const [typeFilter, setTypeFilter] = useState("all"); 
  const [sortBy, setSortBy] = useState("recent"); 
  const [statusOpen, setStatusOpen] = useState(false); 
  const [typeOpen, setTypeOpen] = useState(false); 
  const [sortOpen, setSortOpen] = useState(false); 
  const [statusMenuOpen, setStatusMenuOpen] = useState(null); 
  const [isUpdating, setIsUpdating] = useState({}); 
  const toolbarRef = useRef(null); 

  const loadCollections = useCallback(async () => { 
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem("orgi_session") : null; 
    let token = null; 
    try { 
      const parsed = saved ? JSON.parse(saved) : null; 
      token = parsed?.access_token || parsed?.session?.access_token; 
    } catch {} 

    if (!session || !token) { 
      setIsLoading(false); 
      return; 
    } 
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

  useEffect(() => { 
    function handleClickOutside(event) { 
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) { 
        setStatusOpen(false); 
        setTypeOpen(false); 
        setSortOpen(false); 
      } 
    } 
    function handleKey(event) { 
      if (event.key === "Escape") { 
        setStatusOpen(false); 
        setTypeOpen(false); 
        setSortOpen(false); 
        setStatusMenuOpen(null); 
      } 
    } 
    document.addEventListener("mousedown", handleClickOutside); 
    document.addEventListener("keydown", handleKey); 
    return () => { 
      document.removeEventListener("mousedown", handleClickOutside); 
      document.removeEventListener("keydown", handleKey); 
    }; 
  }, []); 

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

  const getItemLink = (item) => { 
    if (item.type === "MOVIE") { 
      return `/movie/${item.externalId}`; 
    } 
    if (item.type === "SERIES") { 
      return `/series/${item.externalId}`; 
    } 
    const cat = item.type ? item.type.toLowerCase() : "manhwa"; 
    return `/books/${cat}/${item.externalId}`; 
  }; 

  const statusCounts = { 
    all: items.length, 
    plan: items.filter((i) => i.status === "plan").length, 
    progress: items.filter((i) => i.status === "progress").length, 
    completed: items.filter((i) => i.status === "completed").length, 
  }; 

  const typeCounts = { 
    all: items.length, 
    MOVIE: items.filter((i) => (i.type || "").toUpperCase() === "MOVIE").length, 
    SERIES: items.filter((i) => (i.type || "").toUpperCase() === "SERIES").length, 
    BOOK: items.filter((i) => (i.type || "").toUpperCase() === "BOOK").length, 
    MANGA: items.filter((i) => (i.type || "").toUpperCase() === "MANGA").length, 
    MANHWA: items.filter((i) => (i.type || "").toUpperCase() === "MANHWA").length, 
    MANHUA: items.filter((i) => (i.type || "").toUpperCase() === "MANHUA").length, 
  }; 

  const isFilterActive = statusFilter !== "all" || typeFilter !== "all" || sortBy !== "recent"; 

  const handleResetFilters = () => { 
    setStatusFilter("all"); 
    setTypeFilter("all"); 
    setSortBy("recent"); 
  }; 

  const filteredItems = items 
    .filter((item) => { 
      if (statusFilter !== "all" && item.status !== statusFilter) return false; 
      if (typeFilter !== "all") { 
        const itemType = (item.type || "").toUpperCase(); 
        if (itemType !== typeFilter) return false; 
      } 
      return true; 
    }) 
    .sort((a, b) => { 
      if (sortBy === "title_asc") { 
        return (a.title || "").localeCompare(b.title || ""); 
      } 
      if (sortBy === "title_desc") { 
        return (b.title || "").localeCompare(a.title || ""); 
      } 
      return 0; 
    }); 

  const hasValidToken = Boolean( 
    session?.access_token || 
    session?.session?.access_token || 
    (typeof localStorage !== "undefined" && localStorage.getItem("orgi_session")?.includes("access_token")) 
  ); 

  if (!session || !hasValidToken) { 
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

  const activeStatusLabel = statusFilter === "all" ? "Status" : `Status: ${STATUS_LABELS[statusFilter]}`; 
  const activeTypeObj = TYPE_OPTIONS.find((t) => t.key === typeFilter); 
  const activeTypeLabel = typeFilter === "all" ? "Filter" : `Filter: ${activeTypeObj?.label || typeFilter}`; 
  const activeSortObj = SORT_OPTIONS.find((s) => s.key === sortBy); 
  const activeSortLabel = `Sort: ${activeSortObj?.label || "Recently Added"}`; 

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

          <div ref={toolbarRef} className="flex items-center gap-2.5 flex-wrap"> 
            <div className="relative"> 
              <button 
                type="button" 
                onClick={() => { 
                  setStatusOpen(!statusOpen); 
                  setTypeOpen(false); 
                  setSortOpen(false); 
                }} 
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${ 
                  statusOpen || statusFilter !== "all" 
                    ? "text-[#F5F5F5] bg-[#141414] border border-[#61F1AC]/50 shadow-[0_0_12px_rgba(97,241,172,0.1)]" 
                    : "text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5]" 
                }`} 
              > 
                <span>{activeStatusLabel}</span> 
                {statusOpen ? ( 
                  <ChevronUp size={14} className="text-[#61F1AC]" /> 
                ) : ( 
                  <ChevronDown 
                    size={14} 
                    className={statusFilter !== "all" ? "text-[#61F1AC]" : "text-[#7A7A7A]"} 
                  /> 
                )} 
              </button> 

              {statusOpen && ( 
                <div className="absolute left-0 top-full mt-2 w-44 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl py-1.5 shadow-2xl z-30"> 
                  {[ 
                    { key: "all", label: "All" }, 
                    { key: "plan", label: "Plan" }, 
                    { key: "progress", label: "Progress" }, 
                    { key: "completed", label: "Completed" }, 
                  ].map((s) => ( 
                    <button 
                      key={s.key} 
                      type="button" 
                      onClick={() => { 
                        setStatusFilter(s.key); 
                        setStatusOpen(false); 
                      }} 
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors cursor-pointer ${ 
                        statusFilter === s.key 
                          ? "text-[#61F1AC] bg-[#141414] font-medium" 
                          : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]" 
                      }`} 
                    > 
                      <span>{s.label}</span> 
                      <span className="text-[10px] text-[#7A7A7A] font-tabular"> 
                        {statusCounts[s.key] || 0} 
                      </span> 
                    </button> 
                  ))} 
                </div> 
              )} 
            </div> 

            <div className="relative"> 
              <button 
                type="button" 
                onClick={() => { 
                  setTypeOpen(!typeOpen); 
                  setStatusOpen(false); 
                  setSortOpen(false); 
                }} 
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${ 
                  typeOpen || typeFilter !== "all" 
                    ? "text-[#F5F5F5] bg-[#141414] border border-[#61F1AC]/50 shadow-[0_0_12px_rgba(97,241,172,0.1)]" 
                    : "text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5]" 
                }`} 
              > 
                <span>{activeTypeLabel}</span> 
                {typeOpen ? ( 
                  <ChevronUp size={14} className="text-[#61F1AC]" /> 
                ) : ( 
                  <ChevronDown 
                    size={14} 
                    className={typeFilter !== "all" ? "text-[#61F1AC]" : "text-[#7A7A7A]"} 
                  /> 
                )} 
              </button> 

              {typeOpen && ( 
                <div className="absolute left-0 top-full mt-2 w-44 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl py-1.5 shadow-2xl z-30"> 
                  {TYPE_OPTIONS.map((t) => ( 
                    <button 
                      key={t.key} 
                      type="button" 
                      onClick={() => { 
                        setTypeFilter(t.key); 
                        setTypeOpen(false); 
                      }} 
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors cursor-pointer ${ 
                        typeFilter === t.key 
                          ? "text-[#61F1AC] bg-[#141414] font-medium" 
                          : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]" 
                      }`} 
                    > 
                      <span>{t.label}</span> 
                      <span className="text-[10px] text-[#7A7A7A] font-tabular"> 
                        {typeCounts[t.key] || 0} 
                      </span> 
                    </button> 
                  ))} 
                </div> 
              )} 
            </div> 

            <div className="relative"> 
              <button 
                type="button" 
                onClick={() => { 
                  setSortOpen(!sortOpen); 
                  setStatusOpen(false); 
                  setTypeOpen(false); 
                }} 
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${ 
                  sortOpen || sortBy !== "recent" 
                    ? "text-[#F5F5F5] bg-[#141414] border border-[#61F1AC]/50 shadow-[0_0_12px_rgba(97,241,172,0.1)]" 
                    : "text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5]" 
                }`} 
              > 
                <span>{activeSortLabel}</span> 
                {sortOpen ? ( 
                  <ChevronUp size={14} className="text-[#61F1AC]" /> 
                ) : ( 
                  <ChevronDown 
                    size={14} 
                    className={sortBy !== "recent" ? "text-[#61F1AC]" : "text-[#7A7A7A]"} 
                  /> 
                )} 
              </button> 

              {sortOpen && ( 
                <div className="absolute right-0 md:left-0 top-full mt-2 w-44 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl py-1.5 shadow-2xl z-30"> 
                  {SORT_OPTIONS.map((so) => ( 
                    <button 
                      key={so.key} 
                      type="button" 
                      onClick={() => { 
                        setSortBy(so.key); 
                        setSortOpen(false); 
                      }} 
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${ 
                        sortBy === so.key 
                          ? "text-[#61F1AC] bg-[#141414] font-medium" 
                          : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]" 
                      }`} 
                    > 
                      {so.label} 
                    </button> 
                  ))} 
                </div> 
              )} 
            </div> 

            {isFilterActive && ( 
              <button 
                type="button" 
                onClick={handleResetFilters} 
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs text-[#7A7A7A] hover:text-[#F5F5F5] bg-white/[0.04] border border-white/[0.06] transition-colors cursor-pointer" 
                title="Reset filters" 
              > 
                <X size={12} /> 
                <span>Reset</span> 
              </button> 
            )} 
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
              {items.length === 0 ? "Your collection is empty" : "No items match your filter"} 
            </h2> 
            <p className="text-sm text-[#7A7A7A] max-w-sm mb-6 font-light"> 
              {items.length === 0 
                ? "Explore trending titles, movies, and stories to add them to your collection." 
                : "Try clearing your filters or selecting a different status or media type."} 
            </p> 
            {isFilterActive ? ( 
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetFilters} 
                className="px-4 py-2 rounded-lg text-xs cursor-pointer" 
              > 
                <X size={14} /> 
                <span>Reset Filters</span> 
              </Button> 
            ) : ( 
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
            )} 
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
