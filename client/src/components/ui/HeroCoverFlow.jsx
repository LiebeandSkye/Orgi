import React, {
    useState,
    useEffect,
    useLayoutEffect,
    useRef,
    useMemo,
    useCallback,
} from "react";
import { Link } from "react-router-dom";
import { Plus, Check, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tweakables                                                          */
/* ------------------------------------------------------------------ */
const AUTOPLAY_MS = 6500; // time each slide stays in focus
const MIN_SLIDES = 5; // coverflow needs 5 slots so wrap-around is invisible
const MOVE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // fluid "expo-out" feel
const MOVE_MS = 1100;
const STAGE_HEIGHT = "h-[240px] sm:h-[280px] lg:h-[320px]"; // banner height

/* d = signed distance from the focused slide (0 = center) */
function slideStyle(d) {
    const abs = Math.abs(d);
    const sign = Math.sign(d);
    if (abs === 0) {
        return { transform: "translate3d(0,0,0) scale(1)", opacity: 1, zIndex: 30 };
    }
    if (abs === 1) {
        return {
            transform: `translate3d(calc(${sign * 94}% + ${sign * 18}px),0,0) scale(0.86)`,
            opacity: 0.6,
            zIndex: 20,
        };
    }
    return {
        transform: `translate3d(calc(${sign * 150}% + ${sign * 36}px),0,0) scale(0.72)`,
        opacity: 0,
        zIndex: 10,
        pointerEvents: "none",
    };
}

const EDGE_MASK =
    "linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)";

/* ------------------------------------------------------------------ */
/* Hero coverflow                                                      */
/* ------------------------------------------------------------------ */
export function HeroCoverflow({ items = [], resetKey }) {
    const [index, setIndex] = useState(0);
    const [inListMap, setInListMap] = useState({});

    const toggleList = (id) => setInListMap((prev) => ({ ...prev, [id]: !prev[id] }));

    const pausedRef = useRef(false);
    const barRef = useRef(null);
    const startX = useRef(null);
    const dragged = useRef(false);

    // Make sure we always have enough slides for a seamless loop
    const slides = useMemo(() => {
        if (!items.length) return [];
        const target = Math.max(MIN_SLIDES, items.length);
        const out = [];
        for (let i = 0; out.length < target; i++) out.push(items[i % items.length]);
        return out;
    }, [items]);

    const n = slides.length;

    const next = useCallback(() => setIndex((i) => (n ? (i + 1) % n : 0)), [n]);
    const prev = useCallback(() => setIndex((i) => (n ? (i - 1 + n) % n : 0)), [n]);
    const goTo = useCallback((i) => setIndex(i), []);

    // Reset to first slide when the category tab changes
    useEffect(() => {
        setIndex(0);
    }, [resetKey]);

    // Keep index valid if the pool shrinks
    useEffect(() => {
        if (n && index >= n) setIndex(0);
    }, [n, index]);

    // Autoplay with a smooth progress bar. Pauses on hover / hidden tab.
    useEffect(() => {
        if (n <= 1) return;
        const reduceMotion =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (reduceMotion) return;

        let raf;
        let last = performance.now();
        let elapsed = 0;

        const tick = (now) => {
            const dt = now - last;
            last = now;
            if (!pausedRef.current && !document.hidden) elapsed += dt;

            const p = Math.min(elapsed / AUTOPLAY_MS, 1);
            if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;

            if (elapsed >= AUTOPLAY_MS) {
                elapsed = 0;
                setIndex((i) => (i + 1) % n);
                return; // effect re-runs on index change and restarts the clock
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [index, n]);

    const offsetOf = (i) => {
        let d = i - index;
        const half = n / 2;
        if (d > half) d -= n;
        if (d < -half) d += n;
        return d;
    };

    /* ---------- Loading skeleton ---------- */
    if (!n) { 
        return ( 
            <div className={`relative w-full max-w-full overflow-hidden ${STAGE_HEIGHT} animate-pulse`} aria-hidden="true"> 
                <div className="absolute inset-y-0 left-0 right-0 mx-auto w-[78%] sm:w-[60%] lg:w-[56%] rounded-[28px] bg-[#0C0C0C] border border-white/[0.05]" /> 
                <div className="absolute inset-y-[14px] -left-[8%] w-[26%] rounded-[24px] bg-[#0A0A0A] border border-white/[0.04] hidden sm:block" /> 
                <div className="absolute inset-y-[14px] -right-[8%] w-[26%] rounded-[24px] bg-[#0A0A0A] border border-white/[0.04] hidden sm:block" /> 
            </div> 
        ); 
    } 
 
    const dotCount = items.length; 
    const activeDot = index % dotCount; 
 
    return ( 
        <div 
            className="relative w-full max-w-full overflow-hidden" 
            onMouseEnter={() => (pausedRef.current = true)} 
            onMouseLeave={() => (pausedRef.current = false)} 
        > 
            <div 
                className={`relative w-full max-w-full ${STAGE_HEIGHT} touch-pan-y select-none overflow-hidden`} 
                style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
                onPointerDown={(e) => {
                    startX.current = e.clientX;
                    dragged.current = false;
                }}
                onPointerUp={(e) => {
                    if (startX.current == null) return;
                    const dx = e.clientX - startX.current;
                    startX.current = null;
                    if (Math.abs(dx) > 50) {
                        dragged.current = true;
                        dx < 0 ? next() : prev();
                    }
                }}
                onPointerCancel={() => (startX.current = null)}
                onClickCapture={(e) => {
                    if (dragged.current) {
                        e.preventDefault();
                        e.stopPropagation();
                        dragged.current = false;
                    }
                }}
            >
                {slides.map((item, i) => {
                    const d = offsetOf(i);
                    const active = d === 0;
                    const style = slideStyle(d);
                    const hasBackdrop = Boolean(item.backdrop);
                    const img = item.backdrop || item.cover || item.poster;

                    return (
                        <article
                            key={`${item.id}-${i}`}
                            aria-hidden={!active}
                            aria-label={item.title}
                            onClick={() => {
                                if (!active && Math.abs(d) === 1) goTo(i);
                            }}
                            className={`group absolute inset-y-0 left-0 right-0 mx-auto w-[78%] sm:w-[60%] lg:w-[56%] rounded-[28px] overflow-hidden isolate bg-[#050505] will-change-transform ${active ? "" : "cursor-pointer"
                                }`}
                            style={{
                                ...style,
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transition: `transform ${MOVE_MS}ms ${MOVE_EASE}, opacity 800ms ease`,
                                boxShadow: active ? "0 30px 60px -30px rgba(0,0,0,0.9)" : "none",
                            }}
                        >
                            {img && (
                                <>
                                    {/* Blurred ambient fill (covers every pixel, no white gaps) */}
                                    <img
                                        src={img}
                                        alt=""
                                        aria-hidden="true"
                                        referrerPolicy="no-referrer"
                                        draggable={false}
                                        className="absolute left-1/2 top-1/2 w-[130%] h-[130%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-center blur-2xl saturate-125 brightness-[0.55]"
                                    />

                                    {/* The artwork itself — centered and shown in full */}
                                    <img
                                        src={img}
                                        alt=""
                                        aria-hidden="true"
                                        referrerPolicy="no-referrer"
                                        draggable={false}
                                        className={`absolute inset-0 w-full h-full object-center drop-shadow-[0_12px_30px_rgba(0,0,0,0.65)] ${hasBackdrop ? "object-cover" : "object-contain"
                                            }`}
                                    />
                                </>
                            )}

                            {/* Full-coverage dark layers */}
                            <div className="absolute inset-0 bg-black/15" />
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                            <div
                                className={`absolute inset-0 bg-black transition-opacity duration-700 ${active ? "opacity-0" : "opacity-40"
                                    }`}
                            />

                            {/* Hairline frame — hides anti-aliasing / white edge artifacts */}
                            <div className="absolute inset-0 z-[5] rounded-[inherit] pointer-events-none shadow-[inset_0_0_0_2px_rgba(5,5,5,0.95)]" />

                            {/* Title + actions */}
                            <div
                                className={`absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7 transition-all duration-700 ease-out pointer-events-none ${active ? "opacity-100 translate-y-0 delay-300" : "opacity-0 translate-y-3"
                                    }`}
                            >
                                <h2 className="max-w-[85%] text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-white leading-tight line-clamp-1 drop-shadow-lg">
                                    {item.title}
                                </h2>

                                <div className={`mt-3 flex items-center gap-2 ${active ? "pointer-events-auto" : ""}`}>
                                    <Link
                                        to={item.route}
                                        tabIndex={active ? 0 : -1}
                                        className="group/btn inline-flex items-center gap-1.5 pl-4 pr-3.5 py-2 rounded-full bg-[#61F1AC] hover:bg-[#7BF5BB] text-black text-xs sm:text-sm font-semibold transition-colors"
                                    >
                                        <span>View details</span>
                                        <ArrowUpRight
                                            size={14}
                                            className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                                        />
                                    </Link>

                                    <button
                                        type="button"
                                        tabIndex={active ? 0 : -1}
                                        onClick={() => toggleList(item.id)}
                                        aria-label={inListMap[item.id] ? "Remove from reading list" : "Add to reading list"}
                                        className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs sm:text-sm font-medium backdrop-blur-md border transition-colors cursor-pointer ${inListMap[item.id]
                                                ? "bg-[#61F1AC]/10 border-[#61F1AC]/50 text-[#61F1AC]"
                                                : "bg-white/[0.08] border-white/15 text-white/85 hover:bg-white/[0.16] hover:text-white"
                                            }`}
                                    >
                                        {inListMap[item.id] ? <Check size={14} /> : <Plus size={14} />}
                                        <span>{inListMap[item.id] ? "In list" : "Add to list"}</span>
                                    </button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center justify-between gap-4 px-1">
                <span className="hidden sm:block w-20 text-xs font-mono tracking-widest text-white/35 font-tabular">
                    {String(activeDot + 1).padStart(2, "0")}
                    <span className="text-white/15"> / </span>
                    {String(dotCount).padStart(2, "0")}
                </span>

                {/* Progress indicators */}
                <div className="flex items-center gap-2">
                    {Array.from({ length: dotCount }).map((_, j) => {
                        const isActive = j === activeDot;
                        return (
                            <button
                                key={j}
                                type="button"
                                aria-label={`Go to featured title ${j + 1}`}
                                onClick={() => goTo(j)}
                                className={`relative h-[3px] rounded-full overflow-hidden bg-white/15 hover:bg-white/25 cursor-pointer transition-all duration-500 ${isActive ? "w-12" : "w-6"
                                    }`}
                            >
                                {isActive && (
                                    <span
                                        ref={barRef}
                                        className="absolute inset-0 origin-left bg-[#61F1AC]"
                                        style={{ transform: "scaleX(0)" }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center justify-end gap-1.5 sm:w-20">
                    <button
                        type="button"
                        aria-label="Previous featured title"
                        onClick={prev}
                        className="w-8 h-8 rounded-full border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-white/60 hover:text-white cursor-pointer transition-colors"
                    >
                        <ChevronLeft size={15} />
                    </button>
                    <button
                        type="button"
                        aria-label="Next featured title"
                        onClick={next}
                        className="w-8 h-8 rounded-full border border-white/10 hover:border-white/25 bg-white/[0.03] hover:bg-white/[0.08] flex items-center justify-center text-white/60 hover:text-white cursor-pointer transition-colors"
                    >
                        <ChevronRight size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Category tabs — minimal pill with a sliding highlight               */
/* ------------------------------------------------------------------ */
export function CategoryTabs({ tabs, active, onChange }) {
    const btnRefs = useRef({});
    const mountedRef = useRef(false);
    const [ind, setInd] = useState({ left: 0, width: 0 });

    const measure = useCallback(() => {
        const el = btnRefs.current[active];
        if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    }, [active]);

    useLayoutEffect(() => {
        measure();
        const el = btnRefs.current[active];
        if (mountedRef.current && el?.scrollIntoView) {
            el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
        const raf = requestAnimationFrame(() => {
            mountedRef.current = true;
        });
        return () => cancelAnimationFrame(raf);
    }, [active, measure]);

    useEffect(() => {
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    return (
        <div className="relative flex items-center gap-0.5 overflow-x-auto no-scrollbar p-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            {/* Sliding highlight */}
            <span
                aria-hidden="true"
                className="absolute top-1 bottom-1 rounded-full bg-white/[0.09] ring-1 ring-white/[0.08]"
                style={{
                    left: ind.left,
                    width: ind.width,
                    opacity: ind.width ? 1 : 0,
                    transition: mountedRef.current
                        ? `left 500ms ${MOVE_EASE}, width 500ms ${MOVE_EASE}`
                        : "none",
                }}
            />

            {tabs.map((tab) => {
                const isActive = active === tab.key;
                return (
                    <button
                        key={tab.key}
                        ref={(el) => (btnRefs.current[tab.key] = el)}
                        type="button"
                        onClick={() => onChange(tab)}
                        className={`relative z-10 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-[13px] font-medium tracking-tight whitespace-nowrap cursor-pointer transition-colors duration-300 ${isActive ? "text-white" : "text-white/45 hover:text-white/80"
                            }`}
                    >
                        <span>{tab.label}</span>
                        {tab.count && (
                            <span
                                className={`text-[10px] font-tabular transition-colors duration-300 ${isActive ? "text-[#61F1AC]" : "text-white/25"
                                    }`}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}