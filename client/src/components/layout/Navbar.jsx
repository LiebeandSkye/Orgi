import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react"; 
import { Link, useLocation } from "react-router-dom"; 
import { Bookmark, User, LayoutDashboard, LogOut, LogIn, Trash2, AlertTriangle } from "lucide-react"; 
import { useAuth } from "../../context/AuthContext"; 
import { authApi } from "../../feature/auth/services/authApi"; 
import { NavbarSearch } from "./NavbarSearch"; 

const PROFILE_ITEMS = [ 
    { to: "/profile", label: "Profile", icon: User }, 
    { to: "/collection", label: "Collection", icon: Bookmark }, 
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, 
]; 

const DEFAULT_AVATAR = "https://i.pinimg.com/736x/2e/e4/25/2ee425db685b15db57175a0840e931b1.jpg"; 

export function Navbar() { 
    const location = useLocation(); 
    const { user, userProfile, logout } = useAuth(); 
    const [profileOpen, setProfileOpen] = useState(false); 
    const profileDropdownRef = useRef(null); 
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false); 
    const [deleteConfirmationInput, setDeleteConfirmationInput] = useState(""); 
    const [isDeleting, setIsDeleting] = useState(false); 
    const [deleteError, setDeleteError] = useState(null); 
    
    const currentUsername = userProfile?.user_name || user?.user_metadata?.user_name || user?.user_name || user?.email?.split("@")[0] || "account"; 
    const targetDeletePhrase = `delete my ${currentUsername} data`; 
    const isDeleteConfirmed = deleteConfirmationInput.trim().toLowerCase() === targetDeletePhrase.toLowerCase(); 
    
    const handleDeleteAccount = async () => { 
        setIsDeleting(true); 
        setDeleteError(null); 
        try { 
            await authApi.deleteAccount(); 
            logout(); 
            setConfirmDeleteOpen(false); 
            setProfileOpen(false); 
        }
        catch (err) { 
            setDeleteError(err.message || "Failed to delete account"); 
        }
        finally { 
            setIsDeleting(false); 
        }
    }

  const navRef = useRef(null); 
  const labelRefs = useRef({}); 
  const indicatorRef = useRef(null); 
  const prevRect = useRef(null); 

  const isMovies = 
    location.pathname === "/" || 
    location.pathname === "/movies" || 
    location.pathname.startsWith("/movie") ||
    location.pathname.startsWith("/series"); 
  const isBooks = location.pathname.startsWith("/books"); 
  const isFeed = location.pathname.startsWith("/feed") || location.pathname.startsWith("/reviews");
  const active = isFeed ? "feed" : isBooks ? "books" : isMovies ? "movies" : null; 

  useEffect(() => { 
    setProfileOpen(false); 
  }, [location.pathname]); 

  useEffect(() => { 
    function handleClickOutside(event) { 
      if ( 
        profileDropdownRef.current && 
        !profileDropdownRef.current.contains(event.target) 
      ) { 
        setProfileOpen(false); 
      }
    }
    function handleKey(event) { 
      if (event.key === "Escape") setProfileOpen(false); 
    }
    document.addEventListener("mousedown", handleClickOutside); 
    document.addEventListener("keydown", handleKey); 
    return () => { 
      document.removeEventListener("mousedown", handleClickOutside); 
      document.removeEventListener("keydown", handleKey); 
    }; 
  }, []); 

  // Measure the label of a tab relative to the nav
  const measure = useCallback((key) => {
    const nav = navRef.current;
    const el = key ? labelRefs.current[key] : null;
    if (!nav || !el) return null;
    const n = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - n.left, w: r.width };
  }, []);

  const applyRect = (rect) => {
    const ind = indicatorRef.current;
    if (!ind || !rect) return;
    ind.style.width = `${rect.w}px`;
    ind.style.transform = `translateX(${rect.x}px)`;
  }

  // Animate the underline: float down, glide across, float up
  useLayoutEffect(() => {
    const ind = indicatorRef.current;
    if (!ind) return;
    const next = measure(active);

    if (!next) {
      ind.style.opacity = "0";
      prevRect.current = null;
      return;
    }

    ind.style.opacity = "1";
    const prev = prevRect.current;
    applyRect(next);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prev && !reduce && (prev.x !== next.x || prev.w !== next.w) && ind.animate) {
      const midX = (prev.x + prev.w / 2 + next.x + next.w / 2) / 2;
      const midW = 10;
      ind.animate(
        [
          {
            transform: `translateX(${prev.x}px) translateY(0px)`,
            width: `${prev.w}px`,
            opacity: 1,
            easing: "cubic-bezier(0.4, 0, 0.9, 0.6)",
          },
          {
            transform: `translateX(${midX - midW / 2}px) translateY(10px)`,
            width: `${midW}px`,
            opacity: 0.35,
            offset: 0.5,
            easing: "cubic-bezier(0.1, 0.4, 0.2, 1)",
          },
          {
            transform: `translateX(${next.x}px) translateY(0px)`,
            width: `${next.w}px`,
            opacity: 1,
          },
        ],
        { duration: 250 }
      )
    }
    prevRect.current = next;
  }, [active, measure]);

  // Keep the underline aligned on resize (no animation)
  useEffect(() => {
    function onResize() {
      const rect = measure(active);
      if (rect) {
        applyRect(rect);
        prevRect.current = rect;
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, measure]);

  const tabClass = (isActive) => 
    `relative flex items-center h-full text-xs sm:text-sm font-medium transition-colors select-none ${ 
      isActive ? "text-[#F5F5F5]" : "text-[#7A7A7A] hover:text-[#F5F5F5]" 
    }`; 
 
  return ( 
    <> 
    <header className="sticky top-0 z-40 h-16 w-full bg-[#000000]/90 backdrop-blur-md border-b border-[#1C1C1C]"> 
      <div className="max-w-[1440px] h-full mx-auto px-4 sm:px-6 lg:px-[120px] flex items-center justify-between"> 
        <div className="flex items-center gap-3.5 sm:gap-8 lg:gap-10 h-full"> 
          <Link 
            to="/" 
            className="flex items-center text-xl font-semibold tracking-tighter text-[#F5F5F5] hover:opacity-90 transition-opacity select-none" 
          > 
            <span>orgi</span> 
            <span className="text-[#61F1AC]">.</span> 
          </Link> 
          
          <nav ref={navRef} className="relative flex items-center gap-3.5 sm:gap-8 h-16"> 
            <Link to="/" className={tabClass(isMovies)}> 
              <span ref={(el) => (labelRefs.current.movies = el)}>Movies</span> 
            </Link> 
            
            <Link to="/books" className={tabClass(isBooks)}> 
              <span ref={(el) => (labelRefs.current.books = el)}>Books</span> 
            </Link> 
            
            <Link to="/feed" className={tabClass(isFeed)}> 
              <span ref={(el) => (labelRefs.current.feed = el)}>Feed</span> 
            </Link> 
            
            <span 
              ref={indicatorRef} 
              aria-hidden="true" 
              className="pointer-events-none absolute bottom-0 left-0 h-[2px] rounded-full bg-[#61F1AC] opacity-0" 
              style={{ width: 0, willChange: "transform, width" }} 
            /> 
          </nav> 
        </div> 
        
        <div className="relative flex items-center gap-2 sm:gap-3"> 
          <NavbarSearch /> 
          <div className="relative flex items-center" ref={profileDropdownRef}> 
            <button 
                type="button" 
                onClick={() => setProfileOpen((prev) => !prev)} 
                className="w-9 h-9 rounded-full overflow-hidden cursor-pointer bg-[#141414] ring-1 ring-[#1C1C1C] shrink-0" 
                title="User Profile" 
            > 
                <img 
                    src={userProfile?.profile_url || user?.profile_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || DEFAULT_AVATAR} 
                    alt="Avatar" 
                    onError={(e) => { 
                        if (e.currentTarget.src !== DEFAULT_AVATAR) { 
                            e.currentTarget.src = DEFAULT_AVATAR; 
                        } 
                    }} 
                    className="w-full h-full object-cover" 
                /> 
            </button> 
            {profileOpen && ( 
                <div 
                    role="menu" 
                    className="absolute top-[calc(100%+8px)] right-0 w-48 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-1.5 shadow-2xl z-50" 
                > 
                    {PROFILE_ITEMS.map(({ to, label, icon: Icon }) => { 
                        const isActive = location.pathname === to; 
                        return ( 
                            <Link 
                                key={to} 
                                to={to} 
                                role="menuitem" 
                                onClick={() => setProfileOpen(false)} 
                                className={`flex items-center gap-3 h-9 px-3 text-[13px] leading-none rounded-lg ${ 
                                    isActive 
                                        ? "text-[#61F1AC] bg-[#141414] font-medium" 
                                        : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414]" 
                                }`} 
                            > 
                                <Icon size={15} strokeWidth={1.75} className="shrink-0 text-[#F5F5F5]" /> 
                                <span className="flex-1">{label}</span> 
                                {isActive && ( 
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC] shrink-0" /> 
                                )} 
                            </Link> 
                        ) 
                    })} 
                    <div className="my-1 border-t border-[#1C1C1C]" /> 
                    {user ? ( 
                        <> 
                            <button 
                                type="button" 
                                role="menuitem" 
                                onClick={() => { 
                                    logout(); 
                                    setProfileOpen(false); 
                                }} 
                                className="w-full flex items-center gap-3 h-9 px-3 text-[13px] leading-none rounded-lg text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414] cursor-pointer" 
                            > 
                                <LogOut size={15} strokeWidth={1.75} className="shrink-0" /> 
                                <span className="flex-1 text-left">Log Out</span> 
                            </button> 
                            <button 
                                type="button" 
                                role="menuitem" 
                                onClick={() => { 
                                    setProfileOpen(false); 
                                    setDeleteError(null); 
                                    setDeleteConfirmationInput(""); 
                                    setConfirmDeleteOpen(true); 
                                }} 
                                className="w-full flex items-center gap-3 h-9 px-3 text-[13px] leading-none rounded-lg text-rose-400 hover:bg-[#141414] cursor-pointer" 
                            > 
                                <Trash2 size={15} strokeWidth={1.75} className="shrink-0" /> 
                                <span className="flex-1 text-left">Delete Account</span> 
                            </button> 
                        </> 
                    ) : ( 
                        <Link 
                            to="/login" 
                            role="menuitem" 
                            onClick={() => setProfileOpen(false)} 
                            className="w-full flex items-center gap-3 h-9 px-3 text-[13px] leading-none rounded-lg text-[#61F1AC] hover:bg-[#141414] cursor-pointer" 
                        > 
                            <LogIn size={15} strokeWidth={1.75} className="shrink-0" /> 
                            <span className="flex-1 text-left">Log In</span> 
                        </Link> 
                    )} 
                </div> 
            )} 
          </div> 
        </div> 
      </div> 
    </header> 
    {confirmDeleteOpen && ( 
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"> 
            <div className="w-full max-w-sm bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-6 text-[#F5F5F5]"> 
                <div className="flex items-center gap-3 text-rose-400 mb-3"> 
                    <AlertTriangle size={20} /> 
                    <h2 className="text-base font-bold text-[#F5F5F5]">Delete Account</h2> 
                </div> 
                <p className="text-xs text-[#B5B5B5] leading-relaxed mb-3"> 
                    Warning: This action is permanent and cannot be undone. All your saved profile information, collections, and account data will be permanently removed. 
                </p> 
                <div className="mb-4"> 
                    <label className="block text-[11px] text-[#7A7A7A] mb-1.5"> 
                        To confirm, please type{" "} 
                        <span className="font-mono text-rose-400 select-all font-semibold"> 
                            {targetDeletePhrase} 
                        </span> 
                    </label> 
                    <input 
                        type="text" 
                        value={deleteConfirmationInput} 
                        onChange={(e) => setDeleteConfirmationInput(e.target.value)} 
                        placeholder={targetDeletePhrase} 
                        className="w-full px-3 py-2 text-xs bg-[#141414] border border-[#1C1C1C] focus:border-rose-500 rounded-lg outline-none text-[#F5F5F5] placeholder-[#4A4A4A] font-mono transition-colors" 
                        autoFocus 
                    /> 
                </div> 
                {deleteError && ( 
                    <div className="p-2 mb-4 text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded"> 
                        {deleteError} 
                    </div> 
                )} 
                <div className="flex justify-end gap-2"> 
                    <button 
                        type="button" 
                        disabled={isDeleting} 
                        onClick={() => { 
                            setConfirmDeleteOpen(false); 
                            setDeleteConfirmationInput(""); 
                            setDeleteError(null); 
                        }} 
                        className="px-3 py-1.5 text-xs border border-[#1C1C1C] rounded text-[#B5B5B5] bg-[#141414] hover:bg-[#1C1C1C] cursor-pointer" 
                    > 
                        Cancel 
                    </button> 
                    <button 
                        type="button" 
                        disabled={isDeleting || !isDeleteConfirmed} 
                        onClick={handleDeleteAccount} 
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity" 
                    > 
                        {isDeleting ? "Deleting..." : "Delete Account"} 
                    </button> 
                </div> 
            </div> 
        </div> 
    )}
    </> 
  )
}
