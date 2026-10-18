import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, X, Film } from "lucide-react";
import { unifiedSearch } from "../../services/unifiedSearch";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

// Result types from unifiedSearch grouped into the three sections shown in the UI.
const SECTIONS = [
  { label: "Movies", match: (t) => t === "Movie" },
  { label: "Series", match: (t) => t === "Series" },
  { label: "Books", match: (t) => t === "Manga" || t === "Manhwa" || t === "Book" },
];

function groupResults(results) {
  return SECTIONS.map((s) => ({
    label: s.label,
    items: results.filter((r) => s.match(r.type)),
  })).filter((s) => s.items.length > 0);
}

/* ------------------------------------------------------------------ */
/* Search state (shared by desktop input + mobile modal)               */
/* ------------------------------------------------------------------ */

function useSearch(debounceMs = 350) {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const debounceTimer = useRef(null);

  const executeSearch = useCallback(async (textToSearch) => {
    const clean = textToSearch.trim();
    if (!clean) {
      setResults([]);
      setLoading(false);
      setSearchedQuery("");
      return;
    }

    const id = ++requestId.current;
    setSearchedQuery(clean);
    setLoading(true);

    try {
      const data = await unifiedSearch(clean);
      if (id === requestId.current) {
        setResults(data || []);
      }
    } catch {
      if (id === requestId.current) {
        setResults([]);
      }
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const clean = query.trim();
    if (!clean) {
      setResults([]);
      setLoading(false);
      setSearchedQuery("");
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      executeSearch(clean);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, debounceMs, executeSearch]);

  // Immediate manual search trigger (e.g. Enter key or form submit)
  const run = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    executeSearch(query);
  }, [query, executeSearch]);

  const reset = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    requestId.current++;
    setQuery("");
    setSearchedQuery("");
    setResults([]);
    setLoading(false);
  }, []);

  return { query, setQuery, searchedQuery, results, loading, run, reset };
}

/* ------------------------------------------------------------------ */
/* Result list pieces                                                  */
/* ------------------------------------------------------------------ */

const Poster = React.memo(function Poster({ src, alt }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div className="w-10 h-14 shrink-0 rounded bg-neutral-950 border border-white/5 overflow-hidden flex items-center justify-center">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <Film size={14} className="text-neutral-600" />
      )}
    </div>
  );
});

function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-3 pb-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-neutral-800" />
    </div>
  );
}

const ResultRow = React.memo(function ResultRow({ item, isSelected, onSelect }) {
  const rowRef = useRef(null);

  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isSelected]);

  // Plain, uncolored meta line: "Manga · Author", "2021", etc.
  const meta =
    item.subtitle && item.subtitle !== item.type
      ? ["Manga", "Manhwa", "Book"].includes(item.type)
        ? `${item.type} · ${item.subtitle}`
        : item.subtitle
      : ["Manga", "Manhwa", "Book"].includes(item.type)
        ? item.type
        : "";

  return (
    <button
      ref={rowRef}
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect(item)}
      className={`flex items-center gap-3 w-full px-4 py-2 focus:outline-none text-left cursor-pointer transition-colors group ${
        isSelected ? "bg-white/10 text-white" : "hover:bg-white/5 text-neutral-200"
      }`}
    >
      <Poster src={item.poster} alt={item.title} />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium line-clamp-1 transition-colors ${
            isSelected ? "text-white" : "text-neutral-200 group-hover:text-white"
          }`}
        >
          {item.title}
        </p>
        {(meta || item.score) && (
          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
            {meta}
            {meta && item.score && <span className="mx-1.5">·</span>}
            {item.score && (
              <span className="text-neutral-400">
                <span className="text-[#61F1AC]">★</span> {item.score}
              </span>
            )}
          </p>
        )}
      </div>
    </button>
  );
});

const ResultsList = React.memo(function ResultsList({ results, activeIndex = -1, onSelect }) {
  const sections = useMemo(() => groupResults(results), [results]);

  let itemCounter = 0;

  return (
    <div className="pb-2">
      {sections.map((section) => (
        <div key={section.label}>
          <SectionHeader label={section.label} />
          {section.items.map((item) => {
            const currentIndex = itemCounter++;
            return (
              <ResultRow
                key={`${item.type}-${item.id}`}
                item={item}
                isSelected={activeIndex === currentIndex}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Mobile modal                                                        */
/* ------------------------------------------------------------------ */

function SearchModal({ search, onClose, onSelect }) {
  const { query, setQuery, searchedQuery, results, loading, run, reset } = search;
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);

  const flatResults = useMemo(() => {
    const sections = groupResults(results);
    return sections.flatMap((s) => s.items);
  }, [results]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, results]);

  useEffect(() => {
    inputRef.current?.focus();

    const handleGlobalKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [onClose]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatResults.length > 0) {
        setActiveIndex((prev) => (prev + 1 < flatResults.length ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatResults.length > 0) {
        setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatResults.length - 1));
      }
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < flatResults.length) {
        e.preventDefault();
        onSelect(flatResults[activeIndex]);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeIndex >= 0 && activeIndex < flatResults.length) {
      onSelect(flatResults[activeIndex]);
    } else {
      run();
    }
  };

  const showHint = !query.trim() && !loading && results.length === 0;
  const showEmpty = searchedQuery && !loading && results.length === 0;

  // Portaled to <body> so a blurred/transformed navbar can't trap the fixed overlay
  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-backdrop-fade"
        onClick={onClose}
      />

      <div className="relative mx-auto mt-[10vh] w-[calc(100%-2rem)] max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-modal-pop">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 px-4 h-14 border-b border-neutral-800"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-[#61F1AC] shrink-0" />
          ) : (
            <Search size={18} className="text-neutral-500 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Search movies, series, books..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 bg-transparent text-base text-[#F5F5F5] placeholder-[#7A7A7A] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                reset();
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="shrink-0 p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="shrink-0 p-1.5 -mr-1.5 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {showHint && (
            <p className="px-4 py-10 text-center text-neutral-500 text-sm">
              Type to search movies, series, books...
            </p>
          )}
          {loading && results.length === 0 && (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-center text-neutral-400 text-sm">
              <Loader2 size={16} className="animate-spin text-[#61F1AC]" />
              <span>Searching...</span>
            </div>
          )}
          {showEmpty && (
            <p className="px-4 py-10 text-center text-neutral-500 text-sm">
              No results for &ldquo;{searchedQuery}&rdquo;
            </p>
          )}
          {results.length > 0 && (
            <div className={loading ? "opacity-60 transition-opacity" : ""}>
              <ResultsList
                results={results}
                activeIndex={activeIndex}
                onSelect={onSelect}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

/**
 * - Below `sm`: icon button that opens a centered search modal.
 * - `sm` and up: inline input with a dropdown of grouped results.
 * - Pass `mobile` to force the icon + modal at every width (e.g. inside a mobile menu).
 */
export function NavbarSearch({ mobile = false }) {
  const search = useSearch();
  const { query, setQuery, searchedQuery, results, loading, run, reset } = search;

  const [open, setOpen] = useState(false); // desktop dropdown
  const [modalOpen, setModalOpen] = useState(false); // mobile modal
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const closeModal = useCallback(() => setModalOpen(false), []);

  const flatResults = useMemo(() => {
    const sections = groupResults(results);
    return sections.flatMap((s) => s.items);
  }, [results]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, results]);

  // Desktop dropdown: click outside + Escape
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleGlobalKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      if (!open && (query.trim() || results.length > 0)) {
        setOpen(true);
        return;
      }
      e.preventDefault();
      if (flatResults.length > 0) {
        setActiveIndex((prev) => (prev + 1 < flatResults.length ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatResults.length > 0) {
        setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatResults.length - 1));
      }
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && activeIndex < flatResults.length) {
        e.preventDefault();
        handleSelect(flatResults[activeIndex]);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (open && activeIndex >= 0 && activeIndex < flatResults.length) {
      handleSelect(flatResults[activeIndex]);
      return;
    }
    if (!query.trim()) return;
    setOpen(true);
    run();
  };

  const handleSelect = (item) => {
    setOpen(false);
    setModalOpen(false);
    reset();
    if (item.route) navigate(item.route);
  };

  const showDropdown = open && (query.trim().length > 0 || results.length > 0);

  return (
    <>
      {/* Icon-only trigger (mobile) */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-label="Open search"
        title="Search"
        className={`${
          mobile ? "flex" : "flex sm:hidden"
        } items-center justify-center w-9 h-9 rounded-full text-white/80 hover:text-[#61F1AC] hover:bg-white/5 transition-colors cursor-pointer`}
      >
        <Search size={18} />
      </button>

      {modalOpen && (
        <SearchModal
          search={search}
          onClose={closeModal}
          onSelect={handleSelect}
        />
      )}

      {/* Inline input (tablet / desktop) */}
      {!mobile && (
        <div ref={containerRef} className="relative hidden sm:block w-fit">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={showDropdown}
              aria-autocomplete="list"
              aria-controls="navbar-search-results"
              placeholder="Search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
              }}
              onFocus={() => {
                if (query.trim() || results.length > 0) setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              className="bg-neutral-800/80 pl-4 pr-14 py-1.5 rounded-full text-sm text-[#F5F5F5] placeholder-[#7A7A7A] w-48 md:w-56 focus:w-64 md:focus:w-72 focus:outline-none border border-transparent  transition-all duration-300"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    inputRef.current?.focus();
                  }}
                  title="Clear search"
                  aria-label="Clear search"
                  className="p-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
              <button
                type="submit"
                title="Search"
                aria-label="Search"
                className="text-white/70 hover:text-[#61F1AC] transition-colors cursor-pointer p-0.5"
              >
                {loading ? (
                  <Loader2 size={13} className="animate-spin text-[#61F1AC]" />
                ) : (
                  <Search size={13} />
                )}
              </button>
            </div>
          </form>

          {showDropdown && (
            <div
              id="navbar-search-results"
              role="listbox"
              className="z-50 absolute right-0 mt-2 w-80 md:w-96 bg-neutral-900/95 border border-neutral-800 rounded-xl shadow-2xl overflow-y-auto max-h-96 backdrop-blur-md custom-scrollbar"
            >
              {loading && results.length === 0 && (
                <div className="flex items-center justify-center gap-2 p-5 text-neutral-400 text-xs">
                  <Loader2 size={14} className="animate-spin text-[#61F1AC]" />
                  <span>Searching...</span>
                </div>
              )}

              {!loading && results.length === 0 && (
                <p className="p-5 text-center text-neutral-400 text-xs">
                  No results found for &ldquo;{searchedQuery || query}&rdquo;
                </p>
              )}

              {results.length > 0 && (
                <div className={loading ? "opacity-60 transition-opacity" : ""}>
                  <ResultsList
                    results={results}
                    activeIndex={activeIndex}
                    onSelect={handleSelect}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
