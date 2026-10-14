import React from "react";
import {
  MessageSquareText,
  Clapperboard,
  Tv,
  Cat,
  BookOpen,
} from "lucide-react";
import { CATEGORIES } from "../../hooks/useReviewFilters";

// Icons matched to the design: message icon for "All Reviews",
// clapperboard for movies, TV for series, cat for anime,
// and the open-book icon for every reading category.
const ICON_MAP = {
  all: MessageSquareText,
  movie: Clapperboard,
  series: Tv,
  anime: Cat,
  manga: BookOpen,
  manhwa: BookOpen,
  book: BookOpen,
  novel: BookOpen,
  "light-novel": BookOpen,
};

// Labels as shown in the design (falls back to the label from CATEGORIES)
const LABEL_MAP = {
  all: "All Reviews",
  movie: "Movies",
  series: "Series",
  anime: "Anime",
  manga: "Manga",
  manhwa: "Manhwa",
  book: "Books",
  novel: "Novels",
  "light-novel": "Light Novels",
};

export function BrowseNav({ currentCategory, onSelectCategory }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#5d6763] mb-2.5 px-1">
        BROWSE
      </span>

      <nav
        aria-label="Browse categories"
        className="w-full bg-[#0b100e] border border-white/[0.08] rounded-xl p-2 flex flex-col gap-0.5"
      >
        {CATEGORIES.map((cat) => {
          const isActive = (currentCategory || "all") === cat.id;
          const Icon = ICON_MAP[cat.id] || MessageSquareText;
          const label = LABEL_MAP[cat.id] || cat.label;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-center gap-3 h-[40px] px-3 rounded-lg text-[14px] font-medium transition-colors text-left cursor-pointer overflow-hidden ${
                isActive
                  ? "bg-[#141a17] text-[#e8ecea]"
                  : "text-[#8b9692] hover:text-[#e8ecea] hover:bg-[#101614]"
              }`}
            >
              {/* Left accent bar for the active row */}
              {isActive && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#19d68a]"
                  aria-hidden="true"
                />
              )}
              <Icon
                size={18}
                strokeWidth={1.6}
                className={`shrink-0 ${isActive ? "text-[#19d68a]" : "text-[#8b9692]"}`}
              />
              <span className="truncate flex-1">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}