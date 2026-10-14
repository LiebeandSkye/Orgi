import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const ACTIVE_ROW = "bg-[#141a17] text-[#e8ecea]";
const IDLE_ROW = "text-[#8b9692] hover:text-[#e8ecea] hover:bg-[#101614]";

function ActiveBar() {
  return (
    <span
      className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#19d68a]"
      aria-hidden="true"
    />
  );
}

function CustomSelect({
  id,
  label,
  value,
  defaultValue,
  options,
  onChange,
  isOpen,
  onToggle,
  onClose,
}) {
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selectedOption =
    options.find((opt) => opt.id === value) || options[0];
  const isCustomized = defaultValue !== undefined && value !== defaultValue;

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleTriggerKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isOpen) {
        onToggle();
      } else {
        const firstOption = menuRef.current?.querySelector("button");
        firstOption?.focus();
      }
    }
  };

  const handleOptionKeyDown = (e, index) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const buttons = menuRef.current?.querySelectorAll("button");
      const nextIndex = (index + 1) % options.length;
      buttons?.[nextIndex]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const buttons = menuRef.current?.querySelectorAll("button");
      const prevIndex = (index - 1 + options.length) % options.length;
      buttons?.[prevIndex]?.focus();
    } else if (e.key === "Tab") {
      onClose();
    }
  };

  const handleSelect = (optionId) => {
    onChange(optionId);
    onClose();
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-1.5 ${isOpen ? "z-30" : "z-10"}`}
    >
      <span
        id={`${id}-label`}
        className="text-[13px] text-[#B5B5B5] select-none"
      >
        {label}
      </span>

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={`${id}-label ${id}`}
          onClick={onToggle}
          onKeyDown={handleTriggerKeyDown}
          className={`w-full h-[38px] bg-[#0B0B0B] border rounded-lg px-3 flex items-center justify-between text-[13px] transition-colors cursor-pointer text-left select-none outline-none ${
            isOpen
              ? "border-[#19d68a]/60 ring-1 ring-[#19d68a]/40 bg-[#101614] text-[#F5F5F5]"
              : isCustomized
                ? "border-[#19d68a]/40 text-[#F5F5F5] hover:border-[#19d68a]/70 hover:bg-[#101614]"
                : "border-[#1C1C1C] text-[#F5F5F5] hover:border-[#333333] hover:bg-[#101614]"
          }`}
        >
          <span className="truncate flex-1 font-medium">
            {selectedOption?.label}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={1.8}
            className={`shrink-0 transition-transform duration-200 ml-2 ${
              isOpen
                ? "rotate-180 text-[#19d68a]"
                : isCustomized
                  ? "text-[#19d68a]"
                  : "text-[#7A7A7A]"
            }`}
          />
        </button>

        {isOpen && (
          <div
            ref={menuRef}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="absolute top-[calc(100%+4px)] left-0 w-full bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5"
          >
            {options.map((opt, index) => {
              const isSelected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.id)}
                  onKeyDown={(e) => handleOptionKeyDown(e, index)}
                  className={`relative flex items-center justify-between h-[36px] px-3 rounded-lg text-[13px] font-medium transition-colors text-left cursor-pointer overflow-hidden outline-none ${
                    isSelected
                      ? ACTIVE_ROW
                      : `${IDLE_ROW} focus-visible:bg-[#101614] focus-visible:text-[#e8ecea]`
                  }`}
                >
                  {isSelected && <ActiveBar />}
                  <span className="truncate flex-1">{opt.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#19d68a] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ReviewFilters({
  sort,
  onSortChange,
  rating,
  onRatingChange,
  type,
  onTypeChange,
  capabilities = {},
}) {
  const [openDropdown, setOpenDropdown] = useState(null);

  const {
    hasRating = true,
    hasLikes = false,
    hasSocial = false,
  } = capabilities;

  const sortOptions = [
    { id: "recent", label: "Most recent" },
    ...(hasRating ? [{ id: "rated", label: "Highest rated" }] : []),
    ...(hasLikes ? [{ id: "liked", label: "Most liked" }] : []),
  ];

  const ratingOptions = [
    { id: "all", label: "All ratings" },
    { id: "9", label: "9+ (Exceptional)" },
    { id: "8", label: "8+ (Great)" },
    { id: "7", label: "7+ (Good)" },
    { id: "6", label: "6+ (Above Average)" },
  ];

  // Content type radio options
  const typeOptions = [
    { id: "all", label: "All" },
    ...(hasSocial
      ? [
          { id: "friends", label: "My friends" },
          { id: "following", label: "Following" },
        ]
      : []),
    { id: "featured", label: "Featured" },
  ];

  const showContentType = typeOptions.length > 1;

  return (
    <aside aria-label="Filters" className="flex flex-col gap-5 mt-6 pb-6">
      <span className="text-[11px] uppercase tracking-[0.18em] font-medium text-[#7A7A7A] px-1">
        FILTERS
      </span>

      {/* Sort By Custom Dropdown */}
      <CustomSelect
        id="feed-sort"
        label="Sort by"
        value={sort || "recent"}
        defaultValue="recent"
        options={sortOptions}
        onChange={onSortChange}
        isOpen={openDropdown === "sort"}
        onToggle={() =>
          setOpenDropdown((prev) => (prev === "sort" ? null : "sort"))
        }
        onClose={() => setOpenDropdown(null)}
      />

      {/* Rating Custom Dropdown (Only if hasRating) */}
      {hasRating && (
        <CustomSelect
          id="feed-rating"
          label="Rating"
          value={rating || "all"}
          defaultValue="all"
          options={ratingOptions}
          onChange={onRatingChange}
          isOpen={openDropdown === "rating"}
          onToggle={() =>
            setOpenDropdown((prev) => (prev === "rating" ? null : "rating"))
          }
          onClose={() => setOpenDropdown(null)}
        />
      )}

      {/* Content Type Radio Group */}
      {showContentType && (
        <fieldset className="flex flex-col gap-2.5 pt-1">
          <legend className="text-[13px] text-[#B5B5B5] mb-1">Content type</legend>
          {typeOptions.map((opt) => {
            const isChecked = (type || "all") === opt.id;
            return (
              <label
                key={opt.id}
                className="flex items-center gap-2.5 text-[13px] text-[#F5F5F5] cursor-pointer select-none group"
              >
                <div className="relative flex items-center justify-center w-4 h-4 rounded-full border border-[#1C1C1C] group-hover:border-[#61F1AC] transition-colors">
                  <input
                    type="radio"
                    name="contentType"
                    value={opt.id}
                    checked={isChecked}
                    onChange={() => onTypeChange(opt.id)}
                    className="sr-only"
                  />
                  {isChecked && (
                    <div className="w-2 h-2 rounded-full bg-[#61F1AC]" />
                  )}
                </div>
                <span className={isChecked ? "text-[#F5F5F5] font-medium" : "text-[#B5B5B5]"}>
                  {opt.label}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}
    </aside>
  );
}
