import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 25,
  onPageChange,
}) {
  if (totalPages <= 1) {
    return null;
  }

  const windowSize = 2;
  let start = Math.max(1, currentPage - windowSize);
  let end = Math.min(totalPages, currentPage + windowSize);

  if (currentPage <= 3) {
    end = Math.min(totalPages, 5);
  }
  if (currentPage >= totalPages - 2) {
    start = Math.max(1, totalPages - 4);
  }

  const pages = [];
  for (let p = start; p <= end; p++) {
    pages.push(p);
  }

  return (
    <nav
      aria-label="Review pagination"
      className="mt-12 mb-6 flex items-center justify-center gap-2 text-xs font-tabular select-none"
    >
      {/* Previous 1 page button */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        title="Previous page"
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>

      {start > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B] transition-colors cursor-pointer"
            aria-label="Page 1"
          >
            1
          </button>
          {start > 2 && <span className="text-[#3A3A3A] px-1 select-none">…</span>}
        </>
      )}

      {pages.map((page) => {
        const isCurrent = currentPage === page;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={isCurrent ? "page" : undefined}
            aria-label={`Page ${page}`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isCurrent
                ? "bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/50 font-semibold"
                : "text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B]"
            }`}
          >
            {page}
          </button>
        );
      })}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="text-[#3A3A3A] px-1 select-none">…</span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            aria-label={`Page ${totalPages}`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              currentPage === totalPages
                ? "bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/50 font-semibold"
                : "text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B]"
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next 1 page button */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        title="Next page"
        aria-label="Next page"
      >
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}
