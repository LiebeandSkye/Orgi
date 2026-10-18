import React, { useRef, useEffect, useState, useCallback, forwardRef } from "react";

/**
 * DetailTabs - Responsive tab switcher for Movie and Series detail pages.
 * Desktop: Minimal horizontal tabs with spacious gaps and mint underline.
 * Mobile: Ergonomic pill chips with edge gradient masks and auto-centering on active tab.
 */
export const DetailTabs = forwardRef(function DetailTabs(
  { tabs = [], activeTab, onChange, className = "" },
  ref
) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check whether the scroll container has overflow to the left or right
  const updateScrollIndicators = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasLeft = el.scrollLeft > 4;
    const hasRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
    setCanScrollLeft(hasLeft);
    setCanScrollRight(hasRight);
  }, []);

  // Update indicators on scroll and window resize
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollIndicators();

    el.addEventListener("scroll", updateScrollIndicators, { passive: true });
    window.addEventListener("resize", updateScrollIndicators);

    return () => {
      el.removeEventListener("scroll", updateScrollIndicators);
      window.removeEventListener("resize", updateScrollIndicators);
    };
  }, [updateScrollIndicators, tabs]);

  // Smoothly center the active tab into view when activeTab changes
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const activeEl = el.querySelector(`[data-tab-id="${activeTab}"]`);
    if (activeEl && el.scrollWidth > el.clientWidth) {
      const containerRect = el.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();

      const scrollTarget =
        activeRect.left -
        containerRect.left +
        el.scrollLeft -
        (containerRect.width / 2 - activeRect.width / 2);

      el.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: "smooth",
      });
    }

    updateScrollIndicators();
  }, [activeTab, updateScrollIndicators]);

  return (
    <div
      ref={ref}
      className={`sticky top-14 md:top-16 z-30 bg-[#000000]/95 backdrop-blur-md border-b border-[#1C1C1C] ${className}`}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[120px] relative">
        {/* Left scroll fade affordance (mobile only) */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-black via-black/80 to-transparent transition-opacity duration-200 md:hidden ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />

        {/* Right scroll fade affordance (mobile only) */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-black via-black/80 to-transparent transition-opacity duration-200 md:hidden ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        />

        {/* Scrollable Tab List */}
        <div
          ref={scrollContainerRef}
          role="tablist"
          aria-label="Detail sections"
          className="flex items-center gap-2 md:gap-8 h-12 md:h-12 overflow-x-auto no-scrollbar scroll-smooth py-1.5 md:py-0 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {tabs.map((tab) => {
            const tabId = typeof tab === "string" ? tab : tab.id || tab.key;
            const tabLabel = typeof tab === "string" ? tab : tab.label || tab.id;
            const tabBadge = typeof tab === "object" ? tab.badge : null;
            const isActive = activeTab === tabId;

            return (
              <button
                key={tabId}
                type="button"
                role="tab"
                data-tab-id={tabId}
                aria-selected={isActive}
                onClick={() => onChange(tabId)}
                className={`group relative shrink-0 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap select-none
                  /* Mobile Pill Chip Styling */
                  px-3.5 py-1.5 rounded-full text-xs font-medium border
                  ${
                    isActive
                      ? "bg-[#61F1AC]/15 text-[#61F1AC] border-[#61F1AC]/35 shadow-[0_0_12px_rgba(97,241,172,0.12)] font-semibold"
                      : "bg-[#111111] text-[#8E8E8E] border-[#222222] hover:text-[#F5F5F5] hover:bg-[#181818] active:scale-95"
                  }
                  /* Desktop Underline Tab Styling */
                  md:border-none md:bg-transparent md:px-0 md:py-0 md:rounded-none md:shadow-none md:h-full md:text-sm md:active:scale-100
                  ${
                    isActive
                      ? "md:text-[#F5F5F5] md:font-medium"
                      : "md:text-[#7A7A7A] md:hover:text-[#F5F5F5] md:font-normal"
                  }
                `}
              >
                <span>{tabLabel}</span>

                {/* Optional Badge */}
                {tabBadge !== undefined && tabBadge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${
                      isActive
                        ? "bg-[#61F1AC]/20 text-[#61F1AC] md:bg-[#1C1C1C] md:text-[#F5F5F5]"
                        : "bg-[#1C1C1C] text-[#7A7A7A] group-hover:text-[#B5B5B5]"
                    }`}
                  >
                    {tabBadge}
                  </span>
                )}

                {/* Desktop Active Accent Line */}
                {isActive && (
                  <span
                    className="hidden md:block absolute bottom-0 left-0 right-0 h-[2px] bg-[#61F1AC] rounded-full shadow-[0_0_8px_rgba(97,241,172,0.6)]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
