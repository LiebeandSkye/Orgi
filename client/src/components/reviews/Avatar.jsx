import React, { useState } from "react";

const BG_COLORS = [
  "bg-emerald-900/60 text-emerald-300",
  "bg-teal-900/60 text-teal-300",
  "bg-cyan-900/60 text-cyan-300",
  "bg-indigo-900/60 text-indigo-300",
  "bg-slate-800 text-slate-300",
];

function getDeterministicColor(str) {
  if (!str) return BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BG_COLORS.length;
  return BG_COLORS[index];
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/[\s_.-]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ src, name, size = "w-6 h-6", textSize = "text-[10px]" }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    const initials = getInitials(name);
    const colorClass = getDeterministicColor(name);
    return (
      <div
        className={`${size} rounded-full flex items-center justify-center font-medium shrink-0 select-none ring-1 ring-white/10 ${colorClass}`}
        title={name}
      >
        <span className={textSize}>{initials}</span>
      </div>
    );
  }

  return (
    <div className={`${size} rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 bg-[#0b100e]`}>
      <img
        src={src}
        alt={name || "Avatar"}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
