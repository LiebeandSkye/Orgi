import React from "react";

export function ReviewCardSkeleton() {
  return (
    <div className="w-full bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-3.5 flex gap-3.5 sm:gap-4 select-none">
      {/* Poster Skeleton */}
      <div className="w-[84px] h-[120px] sm:w-[112px] sm:h-[160px] rounded-lg bg-white/[0.04] animate-pulse shrink-0" />

      {/* Content Skeleton */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          {/* Reviewer Row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-white/[0.06] animate-pulse shrink-0" />
            <div className="w-24 h-3.5 rounded bg-white/[0.06] animate-pulse" />
            <div className="w-12 h-3.5 rounded bg-white/[0.04] animate-pulse" />
          </div>

          {/* Title */}
          <div className="w-3/5 h-5 rounded bg-white/[0.08] animate-pulse mb-2.5" />

          {/* Meta line */}
          <div className="w-2/5 h-3.5 rounded bg-white/[0.05] animate-pulse mb-3" />

          {/* Excerpt 3 lines */}
          <div className="space-y-1.5 mb-3">
            <div className="w-full h-3 rounded bg-white/[0.04] animate-pulse" />
            <div className="w-11/12 h-3 rounded bg-white/[0.04] animate-pulse" />
            <div className="w-4/5 h-3 rounded bg-white/[0.04] animate-pulse" />
          </div>

          {/* Chips */}
          <div className="flex gap-2">
            <div className="w-12 h-5 rounded-md bg-white/[0.05] animate-pulse" />
            <div className="w-14 h-5 rounded-md bg-white/[0.05] animate-pulse" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <div className="w-16 h-3 rounded bg-white/[0.04] animate-pulse" />
          <div className="w-5 h-5 rounded bg-white/[0.04] animate-pulse" />
        </div>
      </div>

      {/* Right Thumbnail Skeleton (lg+) */}
      <div className="hidden lg:block w-[143px] h-[80px] rounded-lg bg-white/[0.04] animate-pulse shrink-0 mt-1" />
    </div>
  );
}
