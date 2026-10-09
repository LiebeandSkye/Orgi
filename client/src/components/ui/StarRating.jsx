import React, { useState } from "react";
import { Star } from "lucide-react";

export function StarRating({
  value = 0,
  maxStars = 5,
  onChange = null,
  readOnly = false,
  size = 15
}) {
  const [hoverVal, setHoverVal] = useState(0);

  const displayVal = hoverVal > 0 ? hoverVal : value;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxStars }).map((_, idx) => {
        const starNum = idx + 1;
        const isFilled = starNum <= displayVal;

        return (
          <button
            key={idx}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(starNum)}
            onMouseEnter={() => !readOnly && setHoverVal(starNum)}
            onMouseLeave={() => !readOnly && setHoverVal(0)}
            className={`transition-colors p-0.5 rounded ${
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
          >
            <Star
              size={size}
              className={`transition-all ${
                isFilled
                  ? "fill-[#61F1AC] text-[#61F1AC]"
                  : "fill-transparent text-[#2A2A2A] hover:text-[#4A4A4A]"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
