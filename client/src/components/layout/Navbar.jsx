import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react"; 
import { Link, useLocation } from "react-router-dom"; 
import { ChevronDown, BookOpen, Layers, Smartphone, Bookmark, User, LayoutDashboard, Settings, LogOut, LogIn, Trash2, AlertTriangle, Menu, X, Film, Rss } from "lucide-react"; 
import { useAuth } from "../../context/AuthContext"; 
import { authApi } from "../../feature/auth/services/authApi"; 
import { NavbarSearch } from "./NavbarSearch"; 

const BOOK_ITEMS = [ 
    { to: "/books/novels", label: "Books / Novels", icon: BookOpen, match: ["/books/novels"] }, 
    { to: "/books/manga", label: "Manga", icon: Layers, match: ["/books/manga"] }, 
    { to: "/books/manhwa", label: "Manhwa", icon: Smartphone, match: ["/books/manhwa", "/books"] }, 
    { to: "/books/manhua", label: "Manhua", icon: Bookmark, match: ["/books/manhua"] }, 
];

const PROFILE_ITEMS = [ 
    { to: "/profile", label: "Profile", icon: User }, 
    { to: "/collection", label: "Collection", icon: Bookmark }, 
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, 
    { to: "/setting", label: "Setting", icon: Settings }, 
]; 


const DEFAULT_AVATAR = "https://i.pinimg.com/736x/2e/e4/25/2ee425db685b15db57175a0840e931b1.jpg"; 

export function Navbar({ forceBooksOpen = false }) { 
    const location = useLocation(); 
    const { user, userProfile, logout } = useAuth(); 
    const [dropdownOpen, setDropdownOpen] = useState(false); 
    const dropdownRef = useRef(null); 
    const [profileOpen, setProfileOpen] = useState(false); 
    const profileDropdownRef = useRef(null); 
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false); 
    const [isDeleting, setIsDeleting] = useState(false); 
    const [deleteError, setDeleteError] = useState(null); 

    // Mobile-only drawer state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileBooksOpen, setMobileBooksOpen] = useState(false);
    
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

  const isDropdownVisible = forceBooksOpen || dropdownOpen; 

  // Determine active tab based on path 
  const isMovies = 
    location.pathname === "/" || 
    location.pathname === "/movies" || 
    location.pathname.startsWith("/movie") ||
    location.pathname.startsWith("/series"); 
  const isBooks = location.pathname.startsWith("/books"); 
  const isFeed = location.pathname.startsWith("/feed") || location.pathname.startsWith("/reviews");
  const active = isFeed ? "feed" : isBooks ? "books" : isMovies ? "movies" : null; 

  // Close dropdown on route change 
  useEffect(() => { 
    if (!forceBooksOpen) setDropdownOpen(false); 
    setProfileOpen(false); 
    setMobileMenuOpen(false);
  }, [location.pathname, forceBooksOpen]); 

  // Close dropdown on click outside / Escape if not forced 
  useEffect(() => { 
    function handleClickOutside(event) { 
      if ( 
        !forceBooksOpen && 
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) 
      ) { 
        setDropdownOpen(false); 
      } 

      if ( 
        profileDropdownRef.current && 
        !profileDropdownRef.current.contains(event.target) 
      ) { 
        setProfileOpen(false); 
      }
    }
    function handleKey(event) { 
      if (event.key === "Escape" && !forceBooksOpen) setDropdownOpen(false); 
      if (event.key === "Escape") {
        setProfileOpen(false); 
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside); 
    document.addEventListener("keydown", handleKey); 
    return () => { 
      document.removeEventListener("mousedown", handleClickOutside); 
      document.removeEventListener("keydown", handleKey); 
    }; 

  }, [forceBooksOpen]); 

  // Lock page scroll while the mobile drawer is open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

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
    `relative flex items-center h-full text-sm font-medium transition-colors select-none ${
      isActive ? "text-[#F5F5F5]" : "text-[#7A7A7A] hover:text-[#F5F5F5]"
    }`;

  const drawerLinkClass = (isActive) =>
    `flex items-center gap-3 h-11 px-3 text-sm rounded-lg transition-colors ${
      isActive
        ? "text-[#61F1AC] bg-[#141414] font-medium"
        : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414]"
    }`;

  return ( 
    <> 
    <header className="sticky top-0 z-40 h-14 md:h-16 w-full bg-[#000000]/90 backdrop-blur-md border-b border-[#1C1C1C]">
      <div className="max-w-[1440px] h-full mx-auto px-3 md:px-6 lg:px-[120px] flex items-center justify-between"> 
        <div className="flex items-center gap-1 md:gap-8 lg:gap-10 h-full"> 
          {/* Mobile only: hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden w-10 h-10 -ml-1 flex items-center justify-center rounded-full text-[#F5F5F5] hover:bg-[#141414] active:bg-[#1C1C1C] transition-colors cursor-pointer"
          >
            <Menu size={22} strokeWidth={2} />
          </button>

          <Link 
            to="/" 
            className="flex items-center text-xl font-semibold tracking-tighter text-[#F5F5F5] hover:opacity-90 transition-opacity select-none" 
          > 
            <span>orgi</span> 
            <span className="text-[#61F1AC]">.</span> 
          </Link> 
          
          {/* Desktop / tablet nav (hidden on mobile) */}
          <nav ref={navRef} className="relative hidden md:flex items-center gap-6 sm:gap-8 h-16"> 
            <Link to="/" className={tabClass(isMovies)}> 
              <span ref={(el) => (labelRefs.current.movies = el)}>Movies &amp; Series</span> 
            </Link> 
            
            <div className="relative h-full flex items-center" ref={dropdownRef}> 
              <button 
                type="button" 
                aria-haspopup="menu" 
                aria-expanded={isDropdownVisible} 
                onClick={() => setDropdownOpen((prev) => !prev)} 
                className={`${tabClass(isBooks)} gap-1.5 cursor-pointer`} 
              > 
                <span ref={(el) => (labelRefs.current.books = el)}>Books</span> 
                <ChevronDown 
                  size={13} 
                  className={`transition-transform duration-200 ${ 
                    isDropdownVisible ? "rotate-180 text-[#61F1AC]" : "text-[#7A7A7A]" 
                  }`} 
                /> 
              </button> 
              
              {isDropdownVisible && ( 
                <div 
                  role="menu" 
                  className="absolute top-[calc(100%-4px)] left-1/2 -translate-x-1/2 w-52 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100" 
                > 
                  {BOOK_ITEMS.map(({ to, label, icon: Icon, match }) => { 
                    const isActiveItem = match.includes(location.pathname); 
                    return ( 
                      <Link 
                        key={to} 
                        to={to} 
                        role="menuitem" 
                        onClick={() => !forceBooksOpen && setDropdownOpen(false)} 
                        className={`flex items-center gap-3 h-9 px-3 text-[13px] leading-none rounded-lg transition-colors ${ 
                          isActiveItem 
                            ? "text-[#61F1AC] bg-[#141414] font-medium" 
                            : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414]" 
                        }`} 
                      > 
                        <Icon size={15} strokeWidth={1.75} className="shrink-0 text-[#F5F5F5]" /> 
                        <span className="flex-1">{label}</span> 
                        {isActiveItem && ( 
                          <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC] shrink-0" /> 
                        )} 
                      </Link> 
                    ) 
                  })} 
                </div> 
              )} 
            </div> 
            
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
        
        <div className="relative flex items-center gap-1.5 md:gap-3"> 
          <NavbarSearch /> 

          {/* Mobile only: Sign in pill when logged out */}
          {!user && (
            <Link
              to="/login"
              className="md:hidden h-8 px-4 flex items-center text-[13px] font-bold text-black bg-[#61F1AC] hover:bg-[#7af5ba] active:scale-95 rounded-full transition select-none"
            >
              Sign in
            </Link>
          )}

          {/* Avatar: always on desktop, only when logged in on mobile */}
          <div className={`relative items-center ${user ? "flex" : "hidden md:flex"}`} ref={profileDropdownRef}> 
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

    {/* Mobile only: slide-in drawer */}
    <div
      className={`md:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
        mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!mobileMenuOpen}
    >
      <div className="absolute inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)} />
      <aside
        className={`absolute top-0 left-0 h-full w-72 max-w-[85%] bg-[#0B0B0B] border-r border-[#1C1C1C] flex flex-col transition-transform duration-200 ease-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#1C1C1C] shrink-0">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center text-xl font-semibold tracking-tighter text-[#F5F5F5] select-none"
          >
            <span>orgi</span>
            <span className="text-[#61F1AC]">.</span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="w-9 h-9 -mr-1 flex items-center justify-center rounded-full text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414] cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className={drawerLinkClass(isMovies)}>
            <Film size={17} strokeWidth={1.75} className="shrink-0 text-[#F5F5F5]" />
            <span className="flex-1">Movies &amp; Series</span>
            {isMovies && <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC] shrink-0" />}
          </Link>

          <button
            type="button"
            aria-expanded={mobileBooksOpen || isBooks}
            onClick={() => setMobileBooksOpen((prev) => !prev)}
            className={`${drawerLinkClass(isBooks)} w-full cursor-pointer`}
          >
            <BookOpen size={17} strokeWidth={1.75} className="shrink-0 text-[#F5F5F5]" />
            <span className="flex-1 text-left">Books</span>
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${
                mobileBooksOpen || isBooks ? "rotate-180 text-[#61F1AC]" : "text-[#7A7A7A]"
              }`}
            />
          </button>

          {(mobileBooksOpen || isBooks) && (
            <div className="ml-5 pl-3 border-l border-[#1C1C1C] space-y-1">
              {BOOK_ITEMS.map(({ to, label, icon: Icon, match }) => {
                const isActiveItem = match.includes(location.pathname);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${drawerLinkClass(isActiveItem)} h-10 text-[13px]`}
                  >
                    <Icon size={15} strokeWidth={1.75} className="shrink-0 text-[#F5F5F5]" />
                    <span className="flex-1">{label}</span>
                    {isActiveItem && <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC] shrink-0" />}
                  </Link>
                );
              })}
            </div>
          )}

          <Link to="/feed" onClick={() => setMobileMenuOpen(false)} className={drawerLinkClass(isFeed)}>
            <Rss size={17} strokeWidth={1.75} className="shrink-0 text-[#F5F5F5]" />
            <span className="flex-1">Feed</span>
            {isFeed && <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC] shrink-0" />}
          </Link>
        </nav>

        {!user && (
          <div className="p-3 border-t border-[#1C1C1C] shrink-0">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-10 flex items-center justify-center gap-2 text-sm font-bold text-black bg-[#61F1AC] rounded-full"
            >
              <LogIn size={16} strokeWidth={2} />
              Sign in
            </Link>
          </div>
        )}
      </aside>
    </div>

    {confirmDeleteOpen && ( 
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"> 
            <div className="w-full max-w-sm bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-6 text-[#F5F5F5]"> 
                <div className="flex items-center gap-3 text-rose-400 mb-3"> 
                    <AlertTriangle size={20} /> 
                    <h2 className="text-base font-bold text-[#F5F5F5]">Delete Account</h2> 
                </div> 
                <p className="text-xs text-[#B5B5B5] leading-relaxed mb-4"> 
                    Warning: This action is permanent and cannot be undone. All your saved profile information, collections, and account data will be permanently removed. 
                </p> 
                {deleteError && ( 
                    <div className="p-2 mb-4 text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded"> 
                        {deleteError} 
                    </div> 
                )}
                <div className="flex justify-end gap-2"> 
                    <button 
                        type="button" 
                        disabled={isDeleting} 
                        onClick={() => setConfirmDeleteOpen(false)} 
                        className="px-3 py-1.5 text-xs border border-[#1C1C1C] rounded text-[#B5B5B5] bg-[#141414] hover:bg-[#1C1C1C] cursor-pointer" 
                    > 
                        Cancel 
                    </button> 
                    <button 
                        type="button" 
                        disabled={isDeleting} 
                        onClick={handleDeleteAccount} 
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded cursor-pointer disabled:opacity-50" 
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