import React from "react";
import { ChevronDown } from "lucide-react";

export function ReviewFilters({
  sort,
  onSortChange,
  rating,
  onRatingChange,
  type,
  onTypeChange,
  capabilities = {},
}) {
  const {
    hasRating = true,
    hasLikes = false,
    hasSocial = false,
  } = capabilities;

  // Content type radio options
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

  const showContentType = typeOptions.length > 1;

  return (
    <aside aria-label="Filters" className="flex flex-col gap-5 mt-6">
      <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#7A7A7A] px-1">
        FILTERS
      </span>

      {/* Sort By Select */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="feed-sort" className="text-[13px] text-[#B5B5B5]">
          Sort by
        </label>
        <div className="relative">
          <select
            id="feed-sort"
            value={sort || "recent"}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full h-[38px] bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg px-3 pr-8 text-[13px] text-[#F5F5F5] appearance-none focus:outline-none focus:border-[#61F1AC]/60 cursor-pointer"
          >
            <option value="recent">Most recent</option>
            {hasRating && <option value="rated">Highest rated</option>}
            {hasLikes && <option value="liked">Most liked</option>}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]"
          />
        </div>
      </div>

      {/* Rating Filter (Only if hasRating) */}
      {hasRating && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="feed-rating" className="text-[13px] text-[#B5B5B5]">
            Rating
          </label>
          <div className="relative">
            <select
              id="feed-rating"
              value={rating || "all"}
              onChange={(e) => onRatingChange(e.target.value)}
              className="w-full h-[38px] bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg px-3 pr-8 text-[13px] text-[#F5F5F5] appearance-none focus:outline-none focus:border-[#61F1AC]/60 cursor-pointer"
            >
              <option value="all">All ratings</option>
              <option value="9">9+ (Exceptional)</option>
              <option value="8">8+ (Great)</option>
              <option value="7">7+ (Good)</option>
              <option value="6">6+ (Above Average)</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7A7A]"
            />
          </div>
        </div>
      )}

      {/* Content Type Radio Group */}
      {showContentType && (
        <fieldset className="flex flex-col gap-2.5 pt-1">
          <legend className="text-[13px] text-[#B5B5B5] mb-1">Content type</legend>
          {typeOptions.map((opt) => {
            const isChecked = (type || "all") === opt.id;
            return (
              <label
                key={opt.id}
                className="flex items-center gap-2.5 text-[13px] text-[#F5F5F5] cursor-pointer select-none group"
              >
                <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-[#1C1C1C] group-hover:border-[#61F1AC] transition-colors">
                  <input
                    type="radio"
                    name="contentType"
                    value={opt.id}
                    checked={isChecked}
                    onChange={() => onTypeChange(opt.id)}
                    className="sr-only"
                  />
                  {isChecked && (
                    <div className="w-2 h-2 rounded-full bg-[#61F1AC]" />
                  )}
                </div>
                <span className={isChecked ? "text-[#F5F5F5] font-medium" : "text-[#B5B5B5]"}>
                  {opt.label}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}
    </aside>
  );
}
