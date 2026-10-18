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
    <div className="sticky top-14 md:top-16 z-30 w-full bg-[#000000]/90 backdrop-blur-md border-b border-[#1C1C1C] md:hidden">
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
                    ? "bg-[#61F1AC] text-[#000000] font-medium shadow-[0_0_12px_rgba(97,241,172,0.2)]"
                    : "bg-[#0B0B0B] border border-[#1C1C1C] text-[#B5B5B5] hover:text-[#F5F5F5]"
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
          className="relative h-[36px] px-3 rounded-full bg-[#0B0B0B] border border-[#1C1C1C] text-[#F5F5F5] flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-[#141414] transition-colors"
        >
          <SlidersHorizontal size={14} className="text-[#61F1AC]" />
          <span className="text-[12px] font-medium">Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#61F1AC] text-[#000000] text-[10px] font-bold flex items-center justify-center font-tabular">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
