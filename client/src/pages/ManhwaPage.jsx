import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Grid, List } from "lucide-react";
import { MANHWA_DATA } from "../data/mockData";

export function ManhwaPage() {
  const { category } = useParams();
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredCardId, setHoveredCardId] = useState("m1"); // Card 1 in hover state with 1px mint border by default

  const categoryTitles = {
    novels: { title: "Novels", desc: "Literary fiction, modern classics, and serialized web novels" },
    manga: { title: "Manga", desc: "Japanese serialized comics, print graphic novels, and tankōbon" },
    manhwa: { title: "Manhwa", desc: "Korean webcomics, vertical scrolls, and webtoons" },
    "light-novels": { title: "Light Novels", desc: "Japanese illustrated light novels and serialized fiction" }
  };

  const activeCat = categoryTitles[category?.toLowerCase()] || categoryTitles.manhwa;

  const [genreOpen, setGenreOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Top rated");

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] pb-24 pt-8 select-none">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[120px]">
        {/* Large light title */}
        <div className="mb-6">
          <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-[#F5F5F5]">
            {activeCat.title}
          </h1>
          <p className="text-xs text-[#7A7A7A] mt-1 font-normal">
            {activeCat.desc}
          </p>
        </div>

        {/* Thin filter row: chips "Genre ⌄", "Status ⌄" (Ongoing / Completed), "Sort: Top rated ⌄", and grid/list toggle at right */}
        <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-5 mb-8">
          <div className="flex items-center gap-3">
            {/* Genre Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setGenreOpen(!genreOpen);
                  setStatusOpen(false);
                  setSortOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5] transition-colors cursor-pointer"
              >
                <span>{selectedGenre === "All" ? "Genre ⌄" : `Genre: ${selectedGenre} ⌄`}</span>
              </button>

              {genreOpen && (
                <div className="absolute left-0 top-full mt-2 w-40 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg py-1 shadow-2xl z-30">
                  {["All", "Action", "Fantasy", "Martial Arts", "Romance", "Thriller"].map(
                    (g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setSelectedGenre(g);
                          setGenreOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          selectedGenre === g
                            ? "text-[#61F1AC] bg-[#141414]"
                            : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]"
                        }`}
                      >
                        {g}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStatusOpen(!statusOpen);
                  setGenreOpen(false);
                  setSortOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5] transition-colors cursor-pointer"
              >
                <span>{selectedStatus === "All" ? "Status ⌄" : `Status: ${selectedStatus} ⌄`}</span>
              </button>

              {statusOpen && (
                <div className="absolute left-0 top-full mt-2 w-36 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg py-1 shadow-2xl z-30">
                  {["All", "Ongoing", "Completed"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(s);
                        setStatusOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                        selectedStatus === s
                          ? "text-[#61F1AC] bg-[#141414]"
                          : "text-[#B5B5B5] hover:text-white hover:bg-[#141414]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSortOpen(!sortOpen);
                  setGenreOpen(false);
                  setStatusOpen(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#B5B5B5] bg-[#0B0B0B] border border-[#1C1C1C] hover:border-[#61F1AC]/50 hover:text-[#F5F5F5] transition-colors cursor-pointer"
              >
                <span>Sort: {selectedSort} ⌄</span>
              </button>

              {sortOpen && (
                <div className="absolute left-0 top-full mt-2 w-40 bg-[#0B0B0B] border border-[#1C1C1C] rounded-lg py-1 shadow-2xl z-30">
                  {["Top rated", "Most popular", "Latest update", "Alphabetical"].map(
                    (so) => (
                      <button
                        key={so}
                        type="button"
                        onClick={() => {
                          setSelectedSort(so);
                          setSortOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-[#B5B5B5] hover:text-white hover:bg-[#141414]"
                      >
                        {so}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Grid / List Toggle */}
          <div className="flex items-center border border-[#1C1C1C] rounded-lg p-0.5 bg-[#0B0B0B]">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-[#141414] text-[#61F1AC]"
                  : "text-[#7A7A7A] hover:text-white"
              }`}
              title="Grid view"
            >
              <Grid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-[#141414] text-[#61F1AC]"
                  : "text-[#7A7A7A] hover:text-white"
              }`}
              title="List view"
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* 6-column grid of portrait cover cards with 16px gaps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {MANHWA_DATA.map((item) => {
            const isHovered = hoveredCardId === item.id;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredCardId(item.id)}
                className="group flex flex-col cursor-pointer transition-all"
              >
                {/* Cover with 12px radius, 1px border. One card in hover state with 1px mint border */}
                <div
                  className={`relative aspect-[2/3] w-full rounded-[12px] overflow-hidden bg-[#0B0B0B] transition-all duration-200 mb-2.5 ${
                    isHovered
                      ? "border border-[#61F1AC] shadow-[0_0_20px_rgba(97,241,172,0.12)] scale-102"
                      : "border border-[#1C1C1C] group-hover:border-[#61F1AC]/50"
                  }`}
                >
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Title in white */}
                <h3 className="text-sm font-medium text-[#F5F5F5] truncate group-hover:text-white">
                  {item.title}
                </h3>

                {/* Author in muted grey */}
                <span className="text-xs text-[#7A7A7A] truncate font-light mt-0.5">
                  {item.author}
                </span>

                {/* Small mint score and "Ch. 120" in muted */}
                <div className="flex items-center justify-between text-xs mt-1.5 pt-1 border-t border-[#1C1C1C]/40">
                  <div className="flex items-center gap-1 font-tabular text-[#61F1AC] font-medium">
                    <Star size={11} className="fill-[#61F1AC]" />
                    <span>{item.rating}</span>
                  </div>

                  <span className="text-[11px] text-[#7A7A7A] font-tabular">
                    {item.chapters}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Minimal numbered pagination at bottom with current page in mint */}
        <div className="mt-16 flex items-center justify-center gap-2 text-xs font-tabular">
          {[1, 2, 3, 4].map((page) => {
            const isCurrent = currentPage === page;
            return (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
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
          <span className="text-[#3A3A3A] px-1">…</span>
          <button
            type="button"
            onClick={() => setCurrentPage(18)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              currentPage === 18
                ? "bg-[#141414] text-[#61F1AC] border border-[#61F1AC]/50 font-semibold"
                : "text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#0B0B0B]"
            }`}
          >
            18
          </button>
        </div>
      </div>
    </div>
  );
}
