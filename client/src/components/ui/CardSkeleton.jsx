import React from "react";

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-[2/3] w-full rounded-[12px] bg-[#0E0E0E] animate-pulse border border-[#1C1C1C]" />
      <div className="h-4 w-3/4 rounded bg-[#161616] animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-[#161616] animate-pulse" />
    </div>
  );
}

export function CardSkeletonGrid({
  count = 12,
  className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4",
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, idx) => (
        <CardSkeleton key={idx} />
      ))}
    </div>
  );
}
