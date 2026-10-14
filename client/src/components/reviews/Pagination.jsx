import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 25,
  onPageChange,
}) {
  if (totalPages <= 1 && totalItems <= pageSize) {
    return null;
  }

  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers array
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav
      aria-label="Review pagination"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 mt-6 border-t border-white/[0.07] select-none"
    >
      {/* Items Range Summary */}
      <span className="text-[12px] text-[#5d6763] font-tabular">
        Showing <span className="text-[#8b9692] font-medium">{startItem}–{endItem}</span> of{" "}
        <span className="text-[#8b9692] font-medium">{totalItems}</span> reviews
      </span>

      {/* Page Buttons Container */}
      <div className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className={`h-[38px] px-3 rounded-lg text-[13px] font-medium flex items-center gap-1 transition-all ${
            currentPage <= 1
              ? "opacity-30 cursor-not-allowed text-[#5d6763] border border-transparent"
              : "bg-[#0b100e] border border-white/[0.08] text-[#8b9692] hover:text-[#e8ecea] hover:bg-[#101614] hover:border-white/[0.15] cursor-pointer"
          }`}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Numbered Page Buttons */}
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Go to page ${p}`}
              className={`w-[38px] h-[38px] rounded-lg text-[13px] font-medium flex items-center justify-center transition-all font-tabular ${
                isActive
                  ? "bg-[#19d68a] text-[#060908] font-bold shadow-[0_0_12px_rgba(25,214,138,0.25)] cursor-default"
                  : "bg-[#0b100e] border border-white/[0.08] text-[#8b9692] hover:text-[#e8ecea] hover:bg-[#101614] hover:border-white/[0.15] cursor-pointer"
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className={`h-[38px] px-3 rounded-lg text-[13px] font-medium flex items-center gap-1 transition-all ${
            currentPage >= totalPages
              ? "opacity-30 cursor-not-allowed text-[#5d6763] border border-transparent"
              : "bg-[#0b100e] border border-white/[0.08] text-[#8b9692] hover:text-[#e8ecea] hover:bg-[#101614] hover:border-white/[0.15] cursor-pointer"
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
