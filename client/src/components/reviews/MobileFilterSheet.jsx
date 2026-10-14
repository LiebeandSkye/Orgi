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
        className="w-full max-h-[85vh] bg-[#0B0B0B] border-t border-[#1C1C1C] rounded-t-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Drag Handle */}
        <div className="flex flex-col items-center pt-3 pb-2 px-5 border-b border-[#1C1C1C] shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />
          <div className="w-full flex items-center justify-between">
            <h3 className="text-[16px] font-medium text-[#F5F5F5]">Filters</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="p-1 rounded-full text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#141414] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Sections (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Sort By Section */}
          <div>
            <h4 className="text-[12px] uppercase tracking-[0.18em] font-medium text-[#7A7A7A] mb-3">
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
                        ? "bg-[#61F1AC]/[0.12] text-[#61F1AC] font-medium"
                        : "text-[#B5B5B5] hover:bg-[#141414]"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={16} className="text-[#61F1AC]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating Section (Segmented Chips) */}
          {hasRating && (
            <div>
              <h4 className="text-[12px] uppercase tracking-[0.18em] font-medium text-[#7A7A7A] mb-3">
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
                          ? "bg-[#61F1AC] text-[#000000] shadow-[0_0_12px_rgba(97,241,172,0.25)]"
                          : "bg-[#0B0B0B] border border-[#1C1C1C] text-[#B5B5B5]"
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
              <h4 className="text-[12px] uppercase tracking-[0.18em] font-medium text-[#7A7A7A] mb-3">
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
                          ? "bg-[#61F1AC]/[0.12] text-[#61F1AC] font-medium"
                          : "text-[#B5B5B5] hover:bg-[#141414]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check size={16} className="text-[#61F1AC]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-[#1C1C1C] bg-[#0B0B0B] flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="text-[13px] font-medium text-[#B5B5B5] hover:text-[#F5F5F5] px-3 py-2 transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-[44px] rounded-full bg-[#61F1AC] hover:bg-[#61F1AC]/90 text-[#000000] font-semibold text-[14px] flex items-center justify-center transition-colors cursor-pointer shadow-lg"
          >
            Show reviews
          </button>
        </div>
      </div>
    </div>
  );
}
