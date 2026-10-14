import React from "react";
import { Star } from "lucide-react";

export function StarRating({ score, size = 13, showScore = true, className = "" }) {
  if (score === null || score === undefined) return null;
  const formatted = typeof score === "number" ? score.toFixed(1) : score;

  return (
    <div className={`inline-flex items-center gap-1.5 font-medium text-[#61F1AC] ${className}`}>
      <Star size={size} className="fill-[#61F1AC] text-[#61F1AC] shrink-0" />
      {showScore && <span className="font-tabular text-[13px] leading-none">{formatted}</span>}
    </div>
  );
}
