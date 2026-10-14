import React from "react";
import { Star } from "lucide-react";

export function StarRating({ score, size = 13, showScore = true, className = "" }) {
  if (score === null || score === undefined) return null;
  const formatted = typeof score === "number" ? score.toFixed(1) : score;

  return (
    <div className={`inline-flex items-center gap-1.5 font-medium text-[#19d68a] ${className}`}>
      <Star size={size} className="fill-[#19d68a] text-[#19d68a] shrink-0" />
      {showScore && <span className="font-tabular text-[13px] leading-none">{formatted}</span>}
    </div>
  );
}
