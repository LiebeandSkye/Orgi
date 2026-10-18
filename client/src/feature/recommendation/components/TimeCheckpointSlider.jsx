import React from "react"; 

const THUMB_W = 14; // px, white rounded-rectangle handle matching ReviewSlider
const THUMB_H = 24; 

const STYLES = `
@keyframes time-thumb-pop {
  0%   { transform: scale(1, 1); }
  35%  { transform: scale(1.22, 1.15); }
  100% { transform: scale(1, 1); }
}
@keyframes time-tick-pop {
  0%   { transform: scaleY(1); }
  40%  { transform: scaleY(1.4); }
  100% { transform: scaleY(1); }
}
.time-range {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
}
.time-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: ${THUMB_W}px;
  height: ${THUMB_H}px;
}
.time-range::-moz-range-thumb {
  width: ${THUMB_W}px;
  height: ${THUMB_H}px;
  border: 0;
  background: transparent;
}
.time-range::-webkit-slider-runnable-track { background: transparent; }
.time-range::-moz-range-track { background: transparent; }
`;

export function TimeCheckpointSlider({
  checkpoints = [],
  value,
  onChange,
  disabled = false,
}) {
  const steps = Math.max(checkpoints.length - 1, 1);
  const foundIndex = checkpoints.findIndex((cp) => cp.id === value);
  const currentIndex = foundIndex >= 0 ? foundIndex : 0;
  const ratio = currentIndex / steps;

  // x position (in the track) of the handle's center, kept inside the track edges
  const centerAt = (r) => `calc(${r * 100}% - ${r * THUMB_W}px + ${THUMB_W / 2}px)`;
  const spring = "420ms cubic-bezier(0.34, 1.56, 0.64, 1)";

  return (
    <div className="w-full select-none pt-2 pb-1">
      <style>{STYLES}</style>

      {/* Main Track & Thumb Container */}
      <div className="relative h-8 flex items-center">
        {/* Background Track */}
        <div className="absolute inset-x-0 h-2 rounded-full bg-[#181E24]" />

        {/* Fill Track */}
        <div
          className="absolute left-0 h-2 rounded-full bg-gradient-to-r from-[#61F1AC] to-[#A7F3D0] shadow-[0_0_12px_rgba(97,241,172,0.35)]"
          style={{
            width: centerAt(ratio),
            transition: `width ${spring}`,
            opacity: disabled ? 0.5 : 1,
          }}
        />

        {/* Sliding Thumb: White, rectangular, rounded */}
        <div
          className="absolute top-1/2 pointer-events-none z-10"
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
            key={currentIndex}
            className="w-full h-full rounded-[6px] bg-white border border-white/40"
            style={{
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.65), 0 0 12px rgba(97,241,172,0.45)",
              animation: "time-thumb-pop 360ms ease-out",
              opacity: disabled ? 0.5 : 1,
            }}
          />
        </div>

        {/* Range Input for dragging, touch, keyboard, and clicking anywhere */}
        <input
          type="range"
          min={0}
          max={steps}
          step={1}
          value={currentIndex}
          disabled={disabled}
          aria-label="Time Budget"
          onChange={(e) => {
            const idx = parseInt(e.target.value, 10);
            if (checkpoints[idx]) {
              onChange(checkpoints[idx].id);
            }
          }}
          className="time-range absolute inset-0 w-full h-full m-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
        />
      </div>

      {/* Tick Marks & Labels for each checkpoint */}
      <div className="relative mt-2">
        {/* Vertical Ticks */}
        <div className="relative h-3 pointer-events-none">
          {checkpoints.map((cp, idx) => {
            const r = idx / steps;
            const isActive = idx === currentIndex;
            const isFilled = idx <= currentIndex;
            return (
              <span
                key={cp.id}
                className="absolute top-0 rounded-full"
                style={{
                  left: centerAt(r),
                  width: 2,
                  marginLeft: -1,
                  height: isActive ? 12 : 7,
                  background: isActive ? "#FFFFFF" : isFilled ? "#61F1AC" : "#2A3441",
                  opacity: isActive ? 1 : isFilled ? 0.8 : 0.6,
                  transformOrigin: "top",
                  transition:
                    "height 320ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms ease, opacity 200ms ease",
                  animation: isActive ? "time-tick-pop 320ms ease-out" : "none",
                }}
              />
            );
          })}
        </div>

        {/* Labels below ticks */}
        <div className="relative flex justify-between mt-1 text-center">
          {checkpoints.map((cp, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={cp.id}
                type="button"
                onClick={() => onChange(cp.id)}
                className="flex flex-col items-center cursor-pointer transition-all duration-200 group px-1 flex-1 first:items-start last:items-end text-center first:text-left last:text-right"
              >
                <span
                  className={`text-[11px] sm:text-xs font-medium transition-colors ${
                    isActive ? "text-[#61F1AC] font-semibold" : "text-[#8E9CA8] group-hover:text-white"
                  }`}
                >
                  {cp.label}
                </span>
                <span className="text-[10px] text-[#556370] group-hover:text-[#7A8A98] transition-colors mt-0.5">
                  {cp.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TimeCheckpointSlider;
