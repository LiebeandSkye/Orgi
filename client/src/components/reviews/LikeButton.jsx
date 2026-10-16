import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";

const LIKE_RED = "#F4364C";
const STYLE_ID = "like-button-styles";
const PARTICLE_COUNT = 10;

const CSS = `
@keyframes like-shake {
  0%   { transform: scale(1) rotate(0deg); }
  15%  { transform: scale(1.35) rotate(-18deg); }
  30%  { transform: scale(1.3) rotate(16deg); }
  45%  { transform: scale(1.25) rotate(-12deg); }
  60%  { transform: scale(1.2) rotate(8deg); }
  75%  { transform: scale(1.1) rotate(-4deg); }
  100% { transform: scale(1) rotate(0deg); }
}
@keyframes like-particle {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; }
}
@keyframes like-ring {
  0%   { transform: scale(0.4); opacity: 0.7; }
  100% { transform: scale(2.2); opacity: 0; }
}
.like-shake    { animation: like-shake 550ms cubic-bezier(.36,.07,.19,.97) both; }
.like-particle { animation: like-particle 650ms cubic-bezier(.2,.7,.3,1) forwards; }
.like-ring     { animation: like-ring 450ms ease-out forwards; }
@media (prefers-reduced-motion: reduce) {
  .like-shake { animation: none !important; }
  .like-particle, .like-ring { display: none; }
}
`;

// Precomputed burst: alternating near/far dots around the heart
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = ((360 / PARTICLE_COUNT) * i + (i % 2 ? 12 : 0)) * (Math.PI / 180);
    const dist = i % 2 ? 20 : 28;
    return {
        dx: Math.round(Math.cos(angle) * dist),
        dy: Math.round(Math.sin(angle) * dist),
        size: i % 2 ? 3 : 4,
        color: i % 2 ? "#FF8A98" : LIKE_RED,
    };
});

/**
 * Red heart with a shake + particle burst when it becomes liked.
 * Controlled: pass `liked` and `onToggle`. Animation only plays on a click
 * that turns the like on, not when the component mounts already liked.
 */
export function LikeButton({ liked = false, count, onToggle, size = 16, className = "" }) {
    const [burstKey, setBurstKey] = useState(0);

    // Inject keyframes once per page
    useEffect(() => {
        if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
        const el = document.createElement("style");
        el.id = STYLE_ID;
        el.textContent = CSS;
        document.head.appendChild(el);
    }, []);

    const handleClick = (e) => {
        e.stopPropagation();
        if (!liked) setBurstKey((k) => k + 1);
        onToggle?.();
    };

    const animating = liked && burstKey > 0;

    return (
        <button
            type="button"
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            onClick={handleClick}
            className={`inline-flex items-center gap-1.5 cursor-pointer transition-colors duration-150 ${liked ? "" : "text-[#7A7A7A] hover:text-[#F4364C]"
                } ${className}`}
            style={liked ? { color: LIKE_RED } : undefined}
        >
            <span
                className="relative inline-flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                {animating && (
                    <span key={`fx-${burstKey}`} aria-hidden="true" className="pointer-events-none absolute inset-0">
                        <span
                            className="like-ring absolute inset-0 rounded-full border"
                            style={{ borderColor: LIKE_RED }}
                        />
                        {PARTICLES.map((p, i) => (
                            <span
                                key={i}
                                className="like-particle absolute left-1/2 top-1/2 rounded-full"
                                style={{
                                    width: p.size,
                                    height: p.size,
                                    marginLeft: -p.size / 2,
                                    marginTop: -p.size / 2,
                                    background: p.color,
                                    "--dx": `${p.dx}px`,
                                    "--dy": `${p.dy}px`,
                                }}
                            />
                        ))}
                    </span>
                )}
                <span key={burstKey} className={`inline-flex ${animating ? "like-shake" : ""}`}>
                    <Heart size={size} fill={liked ? LIKE_RED : "none"} />
                </span>
            </span>
            {count !== undefined && count !== null && (
                <span className="font-tabular text-[13px]">{count}</span>
            )}
        </button>
    );
}