import React, { useState, useEffect } from "react";
import {
  MessageSquareText,
  Clapperboard,
  Tv,
  Cat,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { CATEGORIES } from "../../hooks/useReviewFilters";

const ICON_MAP = {
  all: MessageSquareText,
  movie: Clapperboard,
  series: Tv,
  anime: Cat,
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

// Categories grouped under the "Reading" dropdown
const READING_IDS = ["manga", "manhwa", "book", "novel", "light-novel"];

const ACTIVE_ROW = "bg-[#141a17] text-[#e8ecea]";
const IDLE_ROW =
  "text-[#8b9692] hover:text-[#e8ecea] hover:bg-[#101614]";

function ActiveBar() {
  return (
    <span
      className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#19d68a]"
      aria-hidden="true"
    />
  );
}

export function BrowseNav({ currentCategory, onSelectCategory }) {
  const current = currentCategory || "all";
  const readingActive = READING_IDS.includes(current);
  const [readingOpen, setReadingOpen] = useState(readingActive);

  // Auto-open the branch when one of its children becomes active
  useEffect(() => {
    if (readingActive) setReadingOpen(true);
  }, [readingActive]);

  const topLevel = CATEGORIES.filter((c) => !READING_IDS.includes(c.id));
  const readingItems = CATEGORIES.filter((c) => READING_IDS.includes(c.id));

  const renderTopLevel = (cat) => {
    const isActive = current === cat.id;
    const Icon = ICON_MAP[cat.id] || MessageSquareText;
    return (
      <button
        key={cat.id}
        type="button"
        onClick={() => onSelectCategory(cat.id)}
        aria-current={isActive ? "page" : undefined}
        className={`relative flex items-center gap-3 h-[40px] px-3 rounded-lg text-[14px] font-medium transition-colors text-left cursor-pointer overflow-hidden ${
          isActive ? ACTIVE_ROW : IDLE_ROW
        }`}
      >
        {isActive && <ActiveBar />}
        <Icon
          size={18}
          strokeWidth={1.6}
          className={`shrink-0 ${isActive ? "text-[#19d68a]" : "text-[#8b9692]"}`}
        />
        <span className="truncate flex-1">
          {LABEL_MAP[cat.id] || cat.label}
        </span>
      </button>
    );
  };

  // Insert the Reading group right after the last top-level item
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#5d6763] mb-2.5 px-1">
        BROWSE
      </span>

      <nav
        aria-label="Browse categories"
        className="w-full bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-2 flex flex-col gap-0.5"
      >
        {topLevel.map(renderTopLevel)}

        {readingItems.length > 0 && (
          <div className="flex flex-col">
            {/* Dropdown header */}
            <button
              type="button"
              onClick={() => setReadingOpen((o) => !o)}
              aria-expanded={readingOpen}
              aria-controls="browse-reading-group"
              className={`flex items-center gap-3 h-[40px] px-3 rounded-lg text-[14px] font-medium transition-colors text-left cursor-pointer ${
                readingActive && !readingOpen
                  ? ACTIVE_ROW
                  : readingActive
                    ? "text-[#e8ecea] hover:bg-[#101614]"
                    : IDLE_ROW
              }`}
            >
              <BookOpen
                size={18}
                strokeWidth={1.6}
                className={`shrink-0 ${readingActive ? "text-[#19d68a]" : "text-[#8b9692]"}`}
              />
              <span className="truncate flex-1">Reading</span>
              <ChevronDown
                size={16}
                strokeWidth={1.8}
                className={`shrink-0 text-[#5d6763] transition-transform duration-200 ${
                  readingOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Branch with children */}
            <div
              id="browse-reading-group"
              className={`grid transition-all duration-200 ease-out ${
                readingOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="ml-[21px] mt-0.5 mb-0.5 pl-2 border-l border-white/[0.08] flex flex-col gap-0.5">
                  {readingItems.map((cat) => {
                    const isActive = current === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        tabIndex={readingOpen ? 0 : -1}
                        onClick={() => onSelectCategory(cat.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex items-center h-[36px] pl-4 pr-3 rounded-lg text-[13.5px] font-medium transition-colors text-left cursor-pointer overflow-hidden ${
                          isActive ? ACTIVE_ROW : IDLE_ROW
                        }`}
                      >
                        {isActive && <ActiveBar />}
                        <span className="truncate flex-1">
                          {LABEL_MAP[cat.id] || cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}