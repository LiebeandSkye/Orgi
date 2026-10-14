import React, { useRef, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { CATEGORIES } from "../../hooks/useReviewFilters";

export function MobileCategoryChips({
  currentCategory,
  onSelectCategory,
  activeFilterCount = 0,
  onOpenFilters,
}) {
  const scrollRef = useRef(null);
  const activeBtnRef = useRef(null);

  // Auto-scroll active chip into view smoothly
  useEffect(() => {
    if (activeBtnRef.current && scrollRef.current) {
      activeBtnRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentCategory]);

  return (
    <div className="sticky top-[var(--nav-h,64px)] z-30 w-full bg-[#060908]/90 backdrop-blur-md border-b border-white/[0.07] md:hidden">
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        {/* Horizontally scrollable chips */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar snap-x scroll-smooth py-1"
        >
          {CATEGORIES.map((cat) => {
            const isActive = (currentCategory || "all") === cat.id;
            return (
              <button
                key={cat.id}
                ref={isActive ? activeBtnRef : null}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`snap-start h-[36px] px-3.5 rounded-full text-[13px] whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[#19d68a] text-[#060908] font-medium shadow-[0_0_12px_rgba(25,214,138,0.2)]"
                    : "bg-white/[0.04] border border-white/[0.08] text-[#8b9692] hover:text-[#e8ecea]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Fixed Filters button on the right */}
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Filter reviews"
          className="relative h-[36px] px-3 rounded-full bg-[#0b100e] border border-white/[0.1] text-[#e8ecea] flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-white/[0.06] transition-colors"
        >
          <SlidersHorizontal size={14} className="text-[#19d68a]" />
          <span className="text-[12px] font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#19d68a] text-[#060908] text-[10px] font-bold flex items-center justify-center font-tabular">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
