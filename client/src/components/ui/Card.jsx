import React from "react";

export function Card({
  children,
  className = "",
  hoverable = false,
  bordered = true,
  ...props
}) {
  return (
    <div
      className={`bg-[#0B0B0B] rounded-[12px] ${
        bordered ? "border border-[#1C1C1C]" : ""
      } ${
        hoverable ? "transition-colors hover:border-[#61F1AC]/50 hover:bg-[#141414]" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
