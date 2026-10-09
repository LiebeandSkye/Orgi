import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, BookOpen, Layers, Smartphone, Bookmark } from "lucide-react";

export function Navbar({ forceBooksOpen = false }) {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isDropdownVisible = forceBooksOpen || dropdownOpen;

  // Determine active tab based on path
  const isMovies =
    location.pathname === "/" ||
    location.pathname === "/movies" ||
    location.pathname.startsWith("/movie");
  const isSeries = location.pathname.startsWith("/series");
  const isBooks = location.pathname.startsWith("/books");

  // Close dropdown on click outside if not forced
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        !forceBooksOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [forceBooksOpen]);

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-[#000000]/90 backdrop-blur-md border-b border-[#1C1C1C]">
      <div className="max-w-[1440px] h-full mx-auto px-6 lg:px-[120px] flex items-center justify-between">
        {/* Wordmark */}
        <Link
          to="/"
          className="flex items-center text-xl font-semibold tracking-tighter text-[#F5F5F5] hover:opacity-90 transition-opacity select-none"
        >
          <span>rate</span>
          <span className="text-[#61F1AC]">.</span>
        </Link>

        {/* Centered navigation tabs */}
        <nav className="flex items-center gap-8 h-full">
          {/* Movies tab */}
          <Link
            to="/"
            className={`relative flex items-center h-full text-sm font-medium transition-colors ${
              isMovies ? "text-[#F5F5F5]" : "text-[#7A7A7A] hover:text-[#F5F5F5]"
            }`}
          >
            <span>Movies</span>
            {isMovies && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#61F1AC]" />
            )}
          </Link>

          {/* Series tab */}
          <Link
            to="/series"
            className={`relative flex items-center h-full text-sm font-medium transition-colors ${
              isSeries ? "text-[#F5F5F5]" : "text-[#7A7A7A] hover:text-[#F5F5F5]"
            }`}
          >
            <span>Series</span>
            {isSeries && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#61F1AC]" />
            )}
          </Link>

          {/* Books tab with dropdown */}
          <div className="relative h-full flex items-center" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`relative flex items-center gap-1.5 h-full text-sm font-medium transition-colors cursor-pointer select-none ${
                isBooks ? "text-[#F5F5F5]" : "text-[#7A7A7A] hover:text-[#F5F5F5]"
              }`}
            >
              <span>Books</span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${
                  isDropdownVisible ? "rotate-180 text-[#61F1AC]" : "text-[#7A7A7A]"
                }`}
              />
              {isBooks && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#61F1AC]" />
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownVisible && (
              <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 w-48 bg-[#0B0B0B] border border-[#1C1C1C] rounded-[12px] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <Link
                  to="/books/novels"
                  onClick={() => !forceBooksOpen && setDropdownOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                    location.pathname === "/books/novels"
                      ? "text-[#61F1AC] bg-[#141414] font-medium"
                      : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414]"
                  }`}
                >
                  <BookOpen size={14} className={location.pathname === "/books/novels" ? "text-[#61F1AC]" : "text-[#7A7A7A]"} />
                  <span>Novels</span>
                </Link>
                <Link
                  to="/books/manga"
                  onClick={() => !forceBooksOpen && setDropdownOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                    location.pathname === "/books/manga"
                      ? "text-[#61F1AC] bg-[#141414] font-medium"
                      : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414]"
                  }`}
                >
                  <Layers size={14} className={location.pathname === "/books/manga" ? "text-[#61F1AC]" : "text-[#7A7A7A]"} />
                  <span>Manga</span>
                </Link>
                <Link
                  to="/books/manhwa"
                  onClick={() => !forceBooksOpen && setDropdownOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                    location.pathname === "/books/manhwa" || location.pathname === "/books"
                      ? "text-[#61F1AC] bg-[#141414] font-medium"
                      : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414]"
                  }`}
                >
                  <Smartphone size={14} className={location.pathname === "/books/manhwa" || location.pathname === "/books" ? "text-[#61F1AC]" : "text-[#7A7A7A]"} />
                  <span>Manhwa</span>
                </Link>
                <Link
                  to="/books/light-novels"
                  onClick={() => !forceBooksOpen && setDropdownOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                    location.pathname === "/books/light-novels"
                      ? "text-[#61F1AC] bg-[#141414] font-medium"
                      : "text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414]"
                  }`}
                >
                  <Bookmark size={14} className={location.pathname === "/books/light-novels" ? "text-[#61F1AC]" : "text-[#7A7A7A]"} />
                  <span>Light Novels</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right side: User Avatar */}
        <div className="flex items-center">
          <button
            type="button"
            className="w-9 h-9 rounded-full overflow-hidden p-0.5 cursor-pointer"
            title="User Profile"
          >
            <img
              src="https://imgs.search.brave.com/NmPZjePZioE_lCWEwu7wkqrQwsFRs9j0toSsN3hn8gY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTMv/NTQ3LzEyMC9zbWFs/bC9nZW5lcmljLXVz/ZXItcHJvZmlsZS1h/dmF0YXItZm9yLW9u/bGluZS1wbGF0Zm9y/bXMtYW5kLXNvY2lh/bC1tZWRpYS12ZWN0/b3IuanBn"
              alt="Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
