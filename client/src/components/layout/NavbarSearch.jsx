import React, { useState, useRef, useEffect } from "react"; 
import { Link, useLocation } from "react-router-dom"; 
import { Search, Loader2, X } from "lucide-react"; 
import { unifiedSearch } from "../../services/unifiedSearch"; 

export function NavbarSearch() { 
  const [query, setQuery] = useState(""); 
  const [searchedQuery, setSearchedQuery] = useState(""); 
  const [results, setResults] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [open, setOpen] = useState(false); 
  const [expanded, setExpanded] = useState(false); 
  const inputRef = useRef(null); 
  const mobileInputRef = useRef(null); 
  const containerRef = useRef(null); 
  const location = useLocation(); 

  const handleSearch = async (e) => { 
    if (e) e.preventDefault(); 
    const clean = query.trim(); 
    if (!clean) return; 

    setSearchedQuery(clean); 
    setOpen(true); 
    setLoading(true); 
    try { 
      const data = await unifiedSearch(clean); 
      setResults(data); 
    } catch { 
      setResults([]); 
    } finally { 
      setLoading(false); 
    } 
  }; 

  useEffect(() => { 
    const clean = query.trim(); 
    if (!clean) { 
      setResults([]); 
      setSearchedQuery(""); 
      setOpen(false); 
      return; 
    } 

    const timer = setTimeout(async () => { 
      setSearchedQuery(clean); 
      setOpen(true); 
      setLoading(true); 
      try { 
        const data = await unifiedSearch(clean); 
        setResults(data); 
      } catch { 
        setResults([]); 
      } finally { 
        setLoading(false); 
      } 
    }, 280); 

    return () => clearTimeout(timer); 
  }, [query]); 

  useEffect(() => { 
    setOpen(false); 
    setExpanded(false); 
  }, [location.pathname]); 

  useEffect(() => { 
    document.body.style.overflow = ""; 
    return () => { 
      document.body.style.overflow = ""; 
    }; 
  }, []); 

  useEffect(() => { 
    const handleClickOutside = (event) => { 
      if (containerRef.current && !containerRef.current.contains(event.target)) { 
        setOpen(false); 
        setExpanded(false); 
      } 
    }; 
    const handleKeyDown = (event) => { 
      if (event.key === "Escape") { 
        setOpen(false); 
        setExpanded(false); 
        inputRef.current?.blur(); 
        mobileInputRef.current?.blur(); 
      } 
    }; 
    document.addEventListener("mousedown", handleClickOutside); 
    document.addEventListener("keydown", handleKeyDown); 
    return () => { 
      document.removeEventListener("mousedown", handleClickOutside); 
      document.removeEventListener("keydown", handleKeyDown); 
    }; 
  }, []); 

  const handleClose = () => { 
    setOpen(false); 
    setExpanded(false); 
    setQuery(""); 
  }; 

  const handleOpenMobile = () => { 
    setExpanded(true); 
    setTimeout(() => { 
      mobileInputRef.current?.focus(); 
    }, 50); 
  }; 

  const renderResults = () => { 
    if (loading) { 
      return ( 
        <p className="p-4 text-center text-neutral-400 text-xs"> 
          Searching... 
        </p> 
      ); 
    } 

    if (results.length === 0) { 
      return ( 
        <p className="p-4 text-center text-neutral-400 text-xs"> 
          No results found 
        </p> 
      ); 
    } 

    return results.map((item) => ( 
      <Link 
        key={`${item.type}-${item.id}`} 
        to={item.route || "#"} 
        onClick={handleClose} 
        className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-neutral-800 active:bg-neutral-800 text-left cursor-pointer transition-colors border-b border-neutral-800/60 last:border-b-0 group" 
      > 
        <img 
          src={ 
            item.poster || 
            "https://via.placeholder.com/150x225/0B0B0B/7A7A7A?text=No+Cover" 
          } 
          alt={item.title} 
          referrerPolicy="no-referrer" 
          onError={(e) => { 
            e.currentTarget.src = 
              "https://via.placeholder.com/150x225/0B0B0B/7A7A7A?text=No+Cover"; 
          }} 
          className="w-10 h-14 object-cover rounded bg-neutral-950 shrink-0 border border-white/5" 
        /> 
        <div className="min-w-0 flex-1"> 
          <div className="flex items-center gap-1.5 mb-0.5"> 
            <span 
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${item.badgeColor}`} 
            > 
              {item.type} 
            </span> 
            {item.score && ( 
              <span className="text-[11px] text-[#61F1AC] font-medium font-tabular"> 
                ★ {item.score} 
              </span> 
            )} 
          </div> 
          <p className="text-xs sm:text-sm font-medium line-clamp-1 text-neutral-200 group-hover:text-white"> 
            {item.title} 
          </p> 
          {item.subtitle && ( 
            <p className="text-[11px] text-neutral-400 truncate mt-0.5"> 
              {item.subtitle} 
            </p> 
          )} 
        </div> 
      </Link> 
    )); 
  }; 

  return ( 
    <div ref={containerRef} className="relative"> 
      <div className="hidden sm:block relative w-fit"> 
        <form onSubmit={handleSearch} className="relative flex items-center"> 
          <input 
            ref={inputRef} 
            type="text" 
            placeholder="Search..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onFocus={() => { 
              if (results.length > 0 && query.trim()) setOpen(true); 
            }} 
            className="bg-neutral-800/80 px-4 py-1.5 pr-8 rounded-full text-xs sm:text-sm text-[#F5F5F5] placeholder-[#7A7A7A] w-44 md:w-52 focus:w-60 md:focus:w-64 focus:outline-none focus:ring-1 focus:ring-[#61F1AC]/50 border border-transparent focus:border-[#61F1AC]/40 transition-all duration-300" 
          /> 
          <button 
            type="submit" 
            title="Search" 
            aria-label="Search" 
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-[#61F1AC] transition-colors cursor-pointer" 
          > 
            {loading ? ( 
              <Loader2 size={13} className="animate-spin text-[#61F1AC]" /> 
            ) : ( 
              <Search size={13} /> 
            )} 
          </button> 
        </form> 

        {open && searchedQuery && ( 
          <div className="z-50 absolute right-0 mt-2 w-72 sm:w-80 md:w-88 bg-neutral-900/95 border border-neutral-800 rounded-xl shadow-2xl overflow-y-auto max-h-80 backdrop-blur-md"> 
            {renderResults()} 
          </div> 
        )} 
      </div> 

      <div className="sm:hidden flex items-center"> 
        <button 
          type="button" 
          onClick={handleOpenMobile} 
          className="w-9 h-9 rounded-full bg-[#141414] border border-[#1C1C1C] flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#61F1AC]/40 transition-colors cursor-pointer shrink-0" 
          aria-label="Open search" 
        > 
          <Search size={15} /> 
        </button> 

        {expanded && ( 
          <> 
            <div className="fixed inset-x-0 top-0 h-16 z-50 bg-[#000000] border-b border-[#1C1C1C] px-4 flex items-center gap-3 animate-in fade-in duration-150"> 
              <form onSubmit={handleSearch} className="relative flex-1 flex items-center"> 
                <Search size={14} className="absolute left-3.5 text-[#7A7A7A] pointer-events-none" /> 
                <input 
                  ref={mobileInputRef} 
                  autoFocus 
                  type="text" 
                  placeholder="Search movies, series, books..." 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  className="w-full bg-[#141414] border border-[#1C1C1C] focus:border-[#61F1AC]/50 text-xs text-[#F5F5F5] placeholder-[#7A7A7A] pl-9 pr-9 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-[#61F1AC]/40 transition-all" 
                /> 
                <button 
                  type="submit" 
                  title="Search" 
                  aria-label="Search" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-[#61F1AC] transition-colors cursor-pointer" 
                > 
                  {loading ? ( 
                    <Loader2 size={13} className="animate-spin text-[#61F1AC]" /> 
                  ) : ( 
                    <Search size={13} /> 
                  )} 
                </button> 
              </form> 
              <button 
                type="button" 
                onClick={handleClose} 
                className="p-1.5 rounded-full text-[#7A7A7A] hover:text-[#F5F5F5] transition-colors cursor-pointer shrink-0" 
                aria-label="Close search" 
              > 
                <X size={18} /> 
              </button> 
            </div> 

            {open && searchedQuery && ( 
              <div className="fixed top-16 inset-x-0 max-h-[calc(100vh-4rem)] bg-[#0B0B0B]/98 border-b border-[#1C1C1C] overflow-y-auto backdrop-blur-xl z-50 shadow-2xl"> 
                {renderResults()} 
              </div> 
            )} 

            <div 
              className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-40" 
              onClick={handleClose} 
            /> 
          </> 
        )} 
      </div> 
    </div> 
  ); 
} 
