import React from "react";
import {
  MessageSquare,
  Film,
  Tv,
  Sparkles,
  BookOpen,
  Layers,
  Bookmark,
  FileText,
  BookMarked,
} from "lucide-react";
import { CATEGORIES } from "../../hooks/useReviewFilters";

const ICON_MAP = {
  all: MessageSquare,
  movie: Film,
  series: Tv,
  anime: Sparkles,
  manga: BookOpen,
  manhwa: Layers,
  book: Bookmark,
  novel: FileText,
  "light-novel": BookMarked,
};

export function BrowseNav({ currentCategory, onSelectCategory }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#5d6763] mb-2 px-1">
        BROWSE
      </span>

      <nav
        aria-label="Browse categories"
        className="w-full bg-[#0b100e] border border-white/[0.07] rounded-xl p-2 flex flex-col gap-0.5"
      >
        {CATEGORIES.map((cat) => {
          const isActive = (currentCategory || "all") === cat.id;
          const Icon = ICON_MAP[cat.id] || MessageSquare;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex items-center gap-3 h-[40px] px-3 rounded-lg text-[14px] font-medium transition-colors text-left cursor-pointer overflow-hidden ${
                isActive
                  ? "bg-[#19d68a]/[0.12] text-[#19d68a]"
                  : "text-[#8b9692] hover:text-[#e8ecea] hover:bg-[#101614]"
              }`}
            >
              {/* Left Accent Bar for Active Row */}
              {isActive && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#19d68a]"
                  aria-hidden="true"
                />
              )}
              <Icon
                size={17}
                strokeWidth={1.8}
                className={`shrink-0 ${isActive ? "text-[#19d68a]" : "text-[#8b9692]"}`}
              />
              <span className="truncate flex-1">{cat.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
