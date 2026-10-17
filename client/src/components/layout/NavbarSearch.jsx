import React, { useState, useRef, useEffect } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { Search, Loader2 } from "lucide-react"; 
import { unifiedSearch } from "../../services/unifiedSearch"; 

export function NavbarSearch({ mobile = false }) { 
  const [query, setQuery] = useState(""); 
  const [searchedQuery, setSearchedQuery] = useState(""); 
  const [results, setResults] = useState([]); 
  const [loading, setLoading] = useState(false); 
  const [open, setOpen] = useState(false); 
  const inputRef = useRef(null); 
  const containerRef = useRef(null); 
  const navigate = useNavigate(); 

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
    const handleClickOutside = (event) => { 
      if (containerRef.current && !containerRef.current.contains(event.target)) { 
        setOpen(false); 
      } 
    }; 
    const handleKeyDown = (event) => { 
      if (event.key === "Escape") { 
        setOpen(false); 
        inputRef.current?.blur(); 
      } 
    }; 
    document.addEventListener("mousedown", handleClickOutside); 
    document.addEventListener("keydown", handleKeyDown); 
    return () => { 
      document.removeEventListener("mousedown", handleClickOutside); 
      document.removeEventListener("keydown", handleKeyDown); 
    }; 
  }, []); 

  const handleSelect = (item) => { 
    setOpen(false); 
    setQuery(""); 
    if (item.route) { 
      navigate(item.route); 
    } 
  }; 

  return ( 
    <div ref={containerRef} className={`relative ${mobile ? "w-full" : "w-fit"}`}> 
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
          className="bg-neutral-800/80 px-4 py-1.5 pr-8 rounded-full text-xs sm:text-sm text-[#F5F5F5] placeholder-[#7A7A7A] w-32 sm:w-44 md:w-52 focus:w-48 sm:focus:w-60 md:focus:w-64 focus:outline-none focus:ring-1 focus:ring-[#61F1AC]/50 border border-transparent focus:border-[#61F1AC]/40 transition-all duration-300" 
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
          {loading && ( 
            <p className="p-4 text-center text-neutral-400 text-xs"> 
              Searching... 
            </p> 
          )} 

          {!loading && results.length === 0 && ( 
            <p className="p-4 text-center text-neutral-400 text-xs"> 
              No results found 
            </p> 
          )} 

          {!loading && 
            results.map((item) => ( 
              <button 
                key={`${item.type}-${item.id}`} 
                type="button" 
                onClick={() => handleSelect(item)} 
                className="flex items-center gap-3 w-full px-3 py-2 hover:bg-neutral-800 text-left cursor-pointer transition-colors border-b border-neutral-800/60 last:border-b-0 group" 
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
              </button> 
            ))} 
        </div> 
      )} 
    </div> 
  ); 
} 
