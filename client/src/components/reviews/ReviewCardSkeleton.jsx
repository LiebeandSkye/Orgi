import React from "react";

export function ReviewCardSkeleton() {
  return (
    <article className="flex gap-3 px-4 py-3 border-b border-[#1C1C1C] select-none">
      {/* Avatar column */}
      <div className="shrink-0">
        <div className="w-10 h-10 rounded-full bg-white/[0.06] animate-pulse" />
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0">
        {/* Header: name · time */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <div className="w-24 h-4 rounded bg-white/[0.06] animate-pulse" />
            <div className="w-12 h-3.5 rounded bg-white/[0.04] animate-pulse" />
          </div>
        </div>

        {/* Body: text on the left, small poster on the right */}
        <div className="flex gap-3 mt-1.5">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title & rating */}
            <div className="flex items-center gap-2">
              <div className="w-2/5 h-4.5 rounded bg-white/[0.08] animate-pulse" />
              <div className="w-10 h-4 rounded bg-white/[0.05] animate-pulse" />
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <div className="w-full h-3 rounded bg-white/[0.04] animate-pulse" />
              <div className="w-11/12 h-3 rounded bg-white/[0.04] animate-pulse" />
              <div className="w-4/5 h-3 rounded bg-white/[0.04] animate-pulse" />
            </div>

            {/* Meta */}
            <div className="w-1/3 h-3 rounded bg-white/[0.04] animate-pulse" />
          </div>

          {/* Poster */}
          <div className="shrink-0 w-[72px] h-[104px] sm:w-[84px] sm:h-[122px] rounded-lg bg-white/[0.04] animate-pulse" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 mt-3">
          <div className="w-10 h-3.5 rounded bg-white/[0.04] animate-pulse" />
          <div className="w-10 h-3.5 rounded bg-white/[0.04] animate-pulse" />
        </div>
      </div>
    </article>
  );
}

export default ReviewCardSkeleton;