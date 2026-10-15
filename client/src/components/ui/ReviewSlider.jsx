import React from "react";
import { Star } from "lucide-react";

const THUMB_W = 12; // px, white rounded-rectangle handle
const THUMB_H = 22;

const STYLES = `
@keyframes rs-thumb-pop {
  0%   { transform: scale(1, 1); }
  35%  { transform: scale(1.25, 1.18); }
  100% { transform: scale(1, 1); }
}
@keyframes rs-tick-pop {
  0%   { transform: scaleY(1); }
  40%  { transform: scaleY(1.5); }
  100% { transform: scaleY(1); }
}
.rs-range {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}
.rs-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: ${THUMB_W}px;
  height: ${THUMB_H}px;
}
.rs-range::-moz-range-thumb {
  width: ${THUMB_W}px;
  height: ${THUMB_H}px;
  border: 0;
  background: transparent;
}
.rs-range::-webkit-slider-runnable-track { background: transparent; }
.rs-range::-moz-range-track { background: transparent; }
`;

/* Minimal star + rolling number. No border, no background. */
export function AnimatedScore({ value, min = 1, max = 10, className = "" }) {
  const digits = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const index = Math.min(Math.max(value - min, 0), digits.length - 1);

  return (
    <div className={`flex items-center gap-1.5 text-[#61F1AC] ${className}`}>
      <Star size={14} className="fill-[#61F1AC]" />
      <div
        className="relative h-[1.25em] overflow-hidden text-sm font-semibold leading-[1.25em]"
        style={{ width: "2ch", fontVariantNumeric: "tabular-nums" }}
        aria-label={`${value} out of ${max}`}
      >
        <div
          style={{
            transform: `translateY(-${index * 1.25}em)`,
            transition: "transform 450ms cubic-bezier(0.34, 1.4, 0.64, 1)",
          }}
        >
          {digits.map((d) => (
            <div key={d} style={{ height: "1.25em" }}>
              {d}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReviewSlider({
  value = 8,
  onChange,
  disabled = false,
  min = 1,
  max = 10,
}) {
  const safeVal = Math.max(min, Math.min(max, Math.round(Number(value) || min)));
  const steps = max - min;
  const ratio = (safeVal - min) / steps;
  const ticks = Array.from({ length: steps + 1 }, (_, i) => min + i);

  // x position (in the track) of the handle's center, kept inside the track edges
  const centerAt = (r) => `calc(${r * 100}% - ${r * THUMB_W}px + ${THUMB_W / 2}px)`;

  const spring = "420ms cubic-bezier(0.34, 1.56, 0.64, 1)";

  return (
    <div className="flex items-center gap-4 w-full sm:w-auto">
      <style>{STYLES}</style>

      <div className="relative flex-1 sm:w-[240px] sm:flex-none">
        {/* range area */}
        <div className="relative h-6 flex items-center">
          {/* track */}
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-[#1E1E1E]" />

          {/* fill */}
          <div
            className="absolute left-0 h-1.5 rounded-full bg-[#61F1AC]"
            style={{
              width: centerAt(ratio),
              transition: `width ${spring}`,
              opacity: disabled ? 0.5 : 1,
            }}
          />

          {/* handle: white, rectangular, rounded */}
          <div
            className="absolute top-1/2 pointer-events-none"
            style={{
              left: centerAt(ratio),
              width: THUMB_W,
              height: THUMB_H,
              marginLeft: -THUMB_W / 2,
              marginTop: -THUMB_H / 2,
              transition: `left ${spring}`,
            }}
          >
            <div
              key={safeVal}
              className="w-full h-full rounded-[5px] bg-white"
              style={{
                boxShadow:
                  "0 2px 8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)",
                animation: "rs-thumb-pop 360ms ease-out",
                opacity: disabled ? 0.5 : 1,
              }}
            />
          </div>

          {/* real range input: handles drag, touch, keyboard and snapping */}
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={safeVal}
            disabled={disabled}
            aria-label="Score"
            onChange={(e) => onChange && onChange(parseInt(e.target.value, 10))}
            className="rs-range absolute inset-0 w-full h-full m-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        {/* 10 vertical tick lines */}
        <div className="relative h-4 mt-1 pointer-events-none">
          {ticks.map((t) => {
            const r = (t - min) / steps;
            const isActive = t === safeVal;
            const isFilled = t <= safeVal;
            return (
              <span
                key={t}
                className="absolute top-0 rounded-full"
                style={{
                  left: centerAt(r),
                  width: 1.5,
                  marginLeft: -0.75,
                  height: isActive ? 14 : 8,
                  background: isActive ? "#FFFFFF" : isFilled ? "#61F1AC" : "#2C2C2C",
                  opacity: isActive ? 1 : isFilled ? 0.65 : 1,
                  transformOrigin: "top",
                  transition:
                    "height 320ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms ease, opacity 200ms ease",
                  animation: isActive ? "rs-tick-pop 320ms ease-out" : "none",
                }}
              />
            );
          })}
        </div>
      </div>

      <AnimatedScore value={safeVal} min={min} max={max} />
    </div>
  );
}

export default ReviewSlider;