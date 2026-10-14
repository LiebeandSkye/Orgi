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
      <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#5d6763] px-1">
        FILTERS
      </span>

      {/* Sort By Select */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="feed-sort" className="text-[13px] text-[#8b9692]">
          Sort by
        </label>
        <div className="relative">
          <select
            id="feed-sort"
            value={sort || "recent"}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full h-[38px] bg-[#0b100e] border border-white/[0.07] rounded-lg px-3 pr-8 text-[13px] text-[#e8ecea] appearance-none focus:outline-none focus:border-[#19d68a]/60 cursor-pointer"
          >
            <option value="recent">Most recent</option>
            {hasRating && <option value="rated">Highest rated</option>}
            {hasLikes && <option value="liked">Most liked</option>}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8b9692]"
          />
        </div>
      </div>

      {/* Rating Filter (Only if hasRating) */}
      {hasRating && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="feed-rating" className="text-[13px] text-[#8b9692]">
            Rating
          </label>
          <div className="relative">
            <select
              id="feed-rating"
              value={rating || "all"}
              onChange={(e) => onRatingChange(e.target.value)}
              className="w-full h-[38px] bg-[#0b100e] border border-white/[0.07] rounded-lg px-3 pr-8 text-[13px] text-[#e8ecea] appearance-none focus:outline-none focus:border-[#19d68a]/60 cursor-pointer"
            >
              <option value="all">All ratings</option>
              <option value="9">9+ (Exceptional)</option>
              <option value="8">8+ (Great)</option>
              <option value="7">7+ (Good)</option>
              <option value="6">6+ (Above Average)</option>
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8b9692]"
            />
          </div>
        </div>
      )}

      {/* Content Type Radio Group */}
      {showContentType && (
        <fieldset className="flex flex-col gap-2.5 pt-1">
          <legend className="text-[13px] text-[#8b9692] mb-1">Content type</legend>
          {typeOptions.map((opt) => {
            const isChecked = (type || "all") === opt.id;
            return (
              <label
                key={opt.id}
                className="flex items-center gap-2.5 text-[13px] text-[#e8ecea] cursor-pointer select-none group"
              >
                <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-white/20 group-hover:border-[#19d68a] transition-colors">
                  <input
                    type="radio"
                    name="contentType"
                    value={opt.id}
                    checked={isChecked}
                    onChange={() => onTypeChange(opt.id)}
                    className="sr-only"
                  />
                  {isChecked && (
                    <div className="w-2 h-2 rounded-full bg-[#19d68a]" />
                  )}
                </div>
                <span className={isChecked ? "text-[#e8ecea] font-medium" : "text-[#8b9692]"}>
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
