import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

export function MobileFilterSheet({
  isOpen,
  onClose,
  sort,
  rating,
  type,
  capabilities = {},
  totalCount = 0,
  onApplyFilters,
  onResetFilters,
}) {
  const [stagedSort, setStagedSort] = useState(sort);
  const [stagedRating, setStagedRating] = useState(rating);
  const [stagedType, setStagedType] = useState(type);

  // Sync staged state when opening
  useEffect(() => {
    if (isOpen) {
      setStagedSort(sort || "recent");
      setStagedRating(rating || "all");
      setStagedType(type || "all");
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, sort, rating, type]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const {
    hasRating = true,
    hasLikes = false,
    hasSocial = false,
  } = capabilities;

  const handleApply = () => {
    onApplyFilters({
      sort: stagedSort,
      rating: stagedRating,
      type: stagedType,
    });
    onClose();
  };

  const handleReset = () => {
    setStagedSort("recent");
    setStagedRating("all");
    setStagedType("all");
    onResetFilters();
    onClose();
  };

  const sortOptions = [
    { id: "recent", label: "Most recent" },
    ...(hasRating ? [{ id: "rated", label: "Highest rated" }] : []),
    ...(hasLikes ? [{ id: "liked", label: "Most liked" }] : []),
  ];

  const ratingOptions = [
    { id: "all", label: "Any" },
    { id: "6", label: "6+" },
    { id: "7", label: "7+" },
    { id: "8", label: "8+" },
    { id: "9", label: "9+" },
  ];

  const typeOptions = [
    { id: "all", label: "All" },
    ...(hasSocial
      ? [
          { id: "friends", label: "My friends" },
          { id: "following", label: "Following" },
        ]
      : []),
    { id: "featured", label: "Featured" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filter Reviews"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-backdrop-fade"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[85vh] bg-[#0b100e] border-t border-white/[0.1] rounded-t-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Drag Handle */}
        <div className="flex flex-col items-center pt-3 pb-2 px-5 border-b border-white/[0.07] shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />
          <div className="w-full flex items-center justify-between">
            <h3 className="text-[16px] font-medium text-[#e8ecea]">Filters</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="p-1 rounded-full text-[#8b9692] hover:text-[#e8ecea] hover:bg-white/[0.06] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Sections (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Sort By Section */}
          <div>
            <h4 className="text-[12px] uppercase tracking-[0.18em] font-medium text-[#5d6763] mb-3">
              SORT BY
            </h4>
            <div className="space-y-1">
              {sortOptions.map((opt) => {
                const isSelected = stagedSort === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStagedSort(opt.id)}
                    className={`w-full flex items-center justify-between h-[44px] px-3.5 rounded-xl text-[14px] transition-colors ${
                      isSelected
                        ? "bg-[#19d68a]/[0.12] text-[#19d68a] font-medium"
                        : "text-[#8b9692] hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={16} className="text-[#19d68a]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating Section (Segmented Chips) */}
          {hasRating && (
            <div>
              <h4 className="text-[12px] uppercase tracking-[0.18em] font-medium text-[#5d6763] mb-3">
                MINIMUM RATING
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {ratingOptions.map((opt) => {
                  const isSelected = stagedRating === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStagedRating(opt.id)}
                      className={`h-[40px] rounded-xl text-[13px] font-medium flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#19d68a] text-[#060908] shadow-[0_0_12px_rgba(25,214,138,0.25)]"
                          : "bg-white/[0.04] border border-white/[0.08] text-[#8b9692]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content Type Section */}
          {typeOptions.length > 1 && (
            <div>
              <h4 className="text-[12px] uppercase tracking-[0.18em] font-medium text-[#5d6763] mb-3">
                CONTENT TYPE
              </h4>
              <div className="space-y-1">
                {typeOptions.map((opt) => {
                  const isSelected = stagedType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStagedType(opt.id)}
                      className={`w-full flex items-center justify-between h-[44px] px-3.5 rounded-xl text-[14px] transition-colors ${
                        isSelected
                          ? "bg-[#19d68a]/[0.12] text-[#19d68a] font-medium"
                          : "text-[#8b9692] hover:bg-white/[0.04]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={16} className="text-[#19d68a]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-white/[0.07] bg-[#0b100e] flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="text-[13px] font-medium text-[#8b9692] hover:text-[#e8ecea] px-3 py-2 transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-[44px] rounded-full bg-[#19d68a] hover:bg-[#19d68a]/90 text-[#060908] font-semibold text-[14px] flex items-center justify-center transition-colors cursor-pointer shadow-lg"
          >
            Show reviews
          </button>
        </div>
      </div>
    </div>
  );
}
