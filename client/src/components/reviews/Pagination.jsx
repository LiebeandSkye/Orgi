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
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 pb-4 mt-6 border-t border-[#1C1C1C] select-none"
    >
      {/* Items Range Summary */}
      <span className="text-[12px] text-[#7A7A7A] font-tabular">
        Showing <span className="text-[#B5B5B5] font-medium">{startItem}–{endItem}</span> of{" "}
        <span className="text-[#B5B5B5] font-medium">{totalItems}</span> reviews
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
              ? "opacity-30 cursor-not-allowed text-[#7A7A7A] border border-transparent"
              : "bg-[#0B0B0B] border border-[#1C1C1C] text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414] hover:border-[#333333] cursor-pointer"
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
                  ? "bg-[#61F1AC] text-[#000000] font-bold shadow-[0_0_12px_rgba(97,241,172,0.25)] cursor-default"
                  : "bg-[#0B0B0B] border border-[#1C1C1C] text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414] hover:border-[#333333] cursor-pointer"
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
              ? "opacity-30 cursor-not-allowed text-[#7A7A7A] border border-transparent"
              : "bg-[#0B0B0B] border border-[#1C1C1C] text-[#B5B5B5] hover:text-[#F5F5F5] hover:bg-[#141414] hover:border-[#333333] cursor-pointer"
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
