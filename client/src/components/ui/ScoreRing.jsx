import React from "react";

export function ScoreRing({
  score = "8.4",
  maxScore = 10,
  label = "35K TMDB",
  size = "lg",
  variant = "stacked"
}) {
  const numScore = parseFloat(score);
  const percentage = Math.min(Math.max((numScore / maxScore) * 100, 0), 100);

  if (size === "sm" && variant === "inline") {
    // Smaller ring with side label: "Community 8.9" with "342 ratings"
    const radius = 24;
    const stroke = 3.5;
    const normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
          <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
            <circle
              stroke="#1C1C1C"
              fill="transparent"
              strokeWidth={stroke}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <circle
              stroke="#61F1AC"
              fill="transparent"
              strokeWidth={stroke}
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
          </svg>
          <span className="absolute font-tabular text-xs font-semibold text-[#F5F5F5]">
            {score}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-[#F5F5F5] tracking-tight">Community {score}</span>
          <span className="text-[11px] text-[#7A7A7A] font-tabular">{label}</span>
        </div>
      </div>
    );
  }

  // Large circular score ring in mint (stroke 4px, number "8.7" centered in tabular numerals, beneath it "1.2M TMDB" in muted text)
  const radius = 38;
  const stroke = 4;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[76px] h-[76px] flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          <circle
            stroke="#1C1C1C"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="#61F1AC"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className="absolute font-tabular text-xl font-medium tracking-tight text-[#F5F5F5]">
          {score}
        </span>
      </div>
      {label && (
        <span className="mt-1.5 text-xs text-[#7A7A7A] tracking-tight font-tabular">
          {label}
        </span>
      )}
    </div>
  );
}
