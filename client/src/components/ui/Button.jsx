import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#61F1AC] disabled:opacity-40 disabled:cursor-not-allowed select-none";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
    icon: "w-9 h-9 p-0 rounded-full"
  };

  const variantClasses = {
    primary:
      "bg-[#61F1AC] text-black font-semibold hover:bg-[#52deb0] shadow-sm active:scale-[0.99]",
    outline:
      "bg-transparent border border-[#1C1C1C] text-[#F5F5F5] hover:border-[#61F1AC]/50 hover:bg-[#141414]",
    ghost:
      "bg-transparent text-[#7A7A7A] hover:text-[#F5F5F5] hover:bg-[#141414]",
    mintGhost:
      "bg-transparent border border-[#61F1AC]/30 text-[#61F1AC] hover:bg-[#61F1AC]/10 hover:border-[#61F1AC]",
    icon:
      "bg-transparent border border-[#1C1C1C] text-[#7A7A7A] hover:text-[#F5F5F5] hover:border-[#61F1AC]/50 hover:bg-[#141414]"
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
